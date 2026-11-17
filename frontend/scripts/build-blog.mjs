/**
 * build-blog.mjs — turns the files in content/blog/ into the static blog.
 *
 * There is no backend any more. Every blog post is one file in content/blog/:
 *
 *   content/blog/<slug>.md     write in Markdown (recommended for new posts)
 *   content/blog/<slug>.html   raw HTML body (used for the imported old posts)
 *
 * Each file starts with a "front matter" block between --- lines that holds
 * the title, date, SEO fields and so on. See content/blog/_TEMPLATE.md.
 *
 * This script runs automatically before `npm run dev` and `npm run build`
 * (and can be run on its own with `npm run blog`). It writes:
 *
 *   src/generated/blogIndex.ts        list of all posts (no body) for the
 *                                     blog page, homepage, sidebar, related
 *   public/blog-data/<slug>.json      one file per post with its full body
 *   public/sitemap.xml                every page + every post, with lastmod
 *
 * The first two are generated and git-ignored. sitemap.xml is committed.
 *
 * It STOPS THE BUILD on mistakes that would hurt the live site (missing title,
 * bad date, duplicate slug, missing image file...), so a broken post can never
 * be published by accident.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(ROOT, "content/blog");
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(PUBLIC_DIR, "blog-data");
const INDEX_FILE = path.join(ROOT, "src/generated/blogIndex.ts");
const SITEMAP_FILE = path.join(PUBLIC_DIR, "sitemap.xml");
const SITE = "https://elegantize.com";

// Pages that are not blog posts. Keep in step with the routes in src/App.tsx.
const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/about", priority: "0.8", changefreq: "monthly" },
  { loc: "/services", priority: "0.9", changefreq: "monthly" },
  { loc: "/services/floral-design", priority: "0.8", changefreq: "monthly" },
  { loc: "/services/ceiling-design", priority: "0.8", changefreq: "monthly" },
  { loc: "/services/centerpiece-design", priority: "0.8", changefreq: "monthly" },
  { loc: "/services/vinyl-floor-wrap", priority: "0.8", changefreq: "monthly" },
  { loc: "/services/ceremony-decor", priority: "0.8", changefreq: "monthly" },
  { loc: "/services/draping-services", priority: "0.8", changefreq: "monthly" },
  { loc: "/services/mandap-design", priority: "0.8", changefreq: "monthly" },
  { loc: "/services/stage-design", priority: "0.8", changefreq: "monthly" },
  { loc: "/gallery", priority: "0.8", changefreq: "weekly" },
  { loc: "/portfolio", priority: "0.8", changefreq: "monthly" },
  { loc: "/blog", priority: "0.7", changefreq: "weekly" },
  { loc: "/contact", priority: "0.8", changefreq: "monthly" },
  { loc: "/faq", priority: "0.6", changefreq: "monthly" },
];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const errors = [];
const warnings = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

/** Front matter dates arrive as Date objects (YAML) or strings. Return YYYY-MM-DD. */
function toDay(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return isNaN(value) ? null : value.toISOString().slice(0, 10);
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${s}T12:00:00.000Z`);
  return isNaN(d) || d.toISOString().slice(0, 10) !== s ? null : s;
}

const toList = (v) =>
  Array.isArray(v)
    ? v.map(String).map((t) => t.trim()).filter(Boolean)
    : String(v ?? "").split(",").map((t) => t.trim()).filter(Boolean);

const str = (v) => (v == null ? "" : String(v).trim());

const plainText = (html) =>
  html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const clip = (text, n) => (text.length <= n ? text : text.slice(0, text.lastIndexOf(" ", n) > 0 ? text.lastIndexOf(" ", n) : n) + "…");

const xml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** Local images must exist, so a typo can never ship a broken picture. */
function checkLocalImage(file, src, label) {
  if (!src || /^(https?:)?\/\//.test(src) || src.startsWith("data:")) return;
  if (!src.startsWith("/")) {
    fail(file, `${label} "${src}" must start with "/" (e.g. /blog-images/my-post/cover.webp)`);
    return;
  }
  const onDisk = path.join(PUBLIC_DIR, decodeURI(src.split(/[?#]/)[0]));
  if (!fs.existsSync(onDisk)) {
    // /images/... live only on the Hostinger server (not in git), so they
    // can't be checked here. Everything else must be in public/.
    if (src.startsWith("/images/")) return;
    fail(file, `${label} "${src}" not found at public${src}`);
  }
}

// ---------------------------------------------------------------------------
// read posts
// ---------------------------------------------------------------------------
function readPosts() {
  if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => /\.(md|html)$/i.test(f) && !f.startsWith("_"))
    .sort();

  const posts = [];
  const seen = new Map();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    let parsed;
    try {
      parsed = matter(raw);
    } catch (e) {
      fail(file, `front matter is not valid YAML — ${e.message.split("\n")[0]}`);
      continue;
    }
    const fm = parsed.data;
    if (fm.draft === true) continue;
    // Read dates exactly as typed: the YAML parser silently turns 2026-13-01
    // into 2027-01-01, which would publish the post at a wrong URL.
    const rawField = (k) => parsed.matter.match(new RegExp(`^${k}:[ \\t]*['"]?([^'"\\n#]*?)['"]?[ \\t]*(#.*)?$`, "m"))?.[1];
    fm.date = rawField("date") ?? fm.date;
    if (fm.updated != null) fm.updated = rawField("updated") ?? fm.updated;

    const slug = str(fm.slug) || file.replace(/\.(md|html)$/i, "");
    const title = str(fm.title);
    const date = toDay(fm.date);
    const updated = toDay(fm.updated) || date;
    const author = str(fm.author) || "Elegantize";
    const category = str(fm.category);

    if (!title) fail(file, "missing title");
    if (!SLUG_RE.test(slug)) fail(file, `slug "${slug}" may only contain a-z, 0-9 and single hyphens`);
    if (!date) fail(file, `date must be YYYY-MM-DD (got "${fm.date ?? ""}")`);
    if (fm.updated && !toDay(fm.updated)) fail(file, `updated must be YYYY-MM-DD (got "${fm.updated}")`);
    if (!category) fail(file, "missing category");
    if (seen.has(slug)) fail(file, `slug "${slug}" is already used by ${seen.get(slug)}`);
    seen.set(slug, file);
    if (file.replace(/\.(md|html)$/i, "") !== slug)
      warn(file, `file name differs from slug "${slug}" (fine, but naming the file ${slug}.md avoids confusion)`);

    const body = parsed.content.trim();
    if (!body) fail(file, "the post has no body text");
    // The page title is the only <h1>; headings inside the article start at <h2>.
    const html = (/\.md$/i.test(file) ? marked.parse(body, { gfm: true, breaks: false }) : body)
      .replace(/<h1(\s|>)/gi, "<h2$1")
      .replace(/<\/h1>/gi, "</h2>");

    const metaDescription = str(fm.metaDescription);
    const excerpt = str(fm.excerpt) || metaDescription || clip(plainText(html), 220);
    if (!metaDescription) warn(file, "no metaDescription — Google will pick its own snippet");
    else if (metaDescription.length > 160) warn(file, `metaDescription is ${metaDescription.length} chars (aim for 150–160)`);
    const metaTitle = str(fm.metaTitle);
    if ((metaTitle || title).length > 65) warn(file, `title shown in Google is ${(metaTitle || title).length} chars (aim for under 60)`);

    const image = str(fm.image);
    if (!image) warn(file, "no featured image");
    checkLocalImage(file, image, "image");
    for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) checkLocalImage(file, m[1], "body image");
    if (/src=["']data:image\//i.test(html))
      fail(file, "has an image pasted inside the text (data:image). Save it as a file in public/blog-images/ and link it instead.");

    posts.push({
      slug,
      title,
      excerpt,
      createdAt: `${date}T12:00:00.000Z`,
      updatedAt: `${updated}T12:00:00.000Z`,
      author,
      category,
      tags: toList(fm.tags).join(", "),
      image,
      imageAlt: str(fm.imageAlt) || title,
      metaTitle,
      metaDescription,
      metaKeywords: toList(fm.metaKeywords ?? fm.keywords).join(", "),
      content: html,
    });
  }

  // Newest first; same-day posts by title so the order is stable.
  posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.title.localeCompare(b.title));
  return posts;
}

const postPath = (p) => `/blog/${p.slug}`;

// ---------------------------------------------------------------------------
// write outputs
// ---------------------------------------------------------------------------
function writeOutputs(posts) {
  // 1. per-post JSON (full body), cleared first so deleted posts disappear
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const p of posts) fs.writeFileSync(path.join(DATA_DIR, `${p.slug}.json`), JSON.stringify(p));

  // 2. index for the React app (no bodies, so it stays small)
  const index = posts.map(({ content: _content, metaKeywords: _k, ...rest }) => rest);
  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  fs.writeFileSync(
    INDEX_FILE,
    `// GENERATED by scripts/build-blog.mjs from content/blog/ — do not edit by hand.\n` +
      `import type { BlogSummary } from "../data/blogData";\n\n` +
      `export const blogIndex: BlogSummary[] = ${JSON.stringify(index, null, 1)};\n`,
  );

  // 3. sitemap
  const urls = [
    ...STATIC_PAGES.map(
      (p) => `  <url>\n    <loc>${SITE}${xml(p.loc)}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    ),
    ...posts.map(
      (p) =>
        `  <url>\n    <loc>${SITE}${xml(postPath(p))}</loc>\n    <lastmod>${p.updatedAt.slice(0, 10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    ),
  ];
  fs.writeFileSync(
    SITEMAP_FILE,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
  );
}

// ---------------------------------------------------------------------------
// Safety net: a post URL that is in the current sitemap (i.e. live and known
// to Google) must not silently vanish. Either its file is still here, or
// public/.htaccess redirects it somewhere. This is what stops an incomplete
// import or an accidentally deleted file from wiping pages off the live site.
function checkNothingLost(posts) {
  if (!fs.existsSync(SITEMAP_FILE)) return;
  // Matches both the current /blog/<slug> URLs and the older /YYYY/MM/DD/<slug>
  // ones; a post counts as kept if its slug is still published.
  const before = [...fs.readFileSync(SITEMAP_FILE, "utf8").matchAll(/<loc>\s*https?:\/\/[^/<]+(\/(?:blog|\d{4}\/\d{2}\/\d{2})\/([^<\s/]+))\/?\s*<\/loc>/g)].map((m) => ({ url: m[1], slug: m[2] }));
  const now = new Set(posts.map((p) => p.slug));
  const htaccess = fs.existsSync(path.join(PUBLIC_DIR, ".htaccess"))
    ? fs.readFileSync(path.join(PUBLIC_DIR, ".htaccess"), "utf8")
    : "";
  const lost = before
    .filter(({ url, slug }) => !now.has(slug) && !htaccess.includes(`^${url.slice(1)}/?$`))
    .map(({ url }) => url);
  if (!lost.length) return;
  const shown = lost.slice(0, 10).map((u) => `      ${SITE}${u}`).join("\n");
  fail(
    "sitemap.xml",
    `${lost.length} live post(s) would disappear from the site:\n${shown}${lost.length > 10 ? `\n      …and ${lost.length - 10} more` : ""}\n` +
      `    If the old posts haven't been imported yet: npm run import-live-blog\n` +
      `    If you removed a post on purpose: add a 301 redirect for its URL in public/.htaccess`,
  );
}

// ---------------------------------------------------------------------------
const posts = readPosts();
checkNothingLost(posts);

if (warnings.length) {
  console.log(`\nblog: ${warnings.length} warning(s) — the build continues, but worth fixing:`);
  warnings.forEach((w) => console.log(`  ! ${w}`));
}
if (errors.length) {
  console.error(`\nblog: ${errors.length} problem(s) must be fixed before the site can build:`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  console.error("");
  process.exit(1);
}

writeOutputs(posts);
console.log(`blog: ${posts.length} posts → src/generated/blogIndex.ts, public/blog-data/, public/sitemap.xml`);
