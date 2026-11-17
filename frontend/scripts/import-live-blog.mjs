/**
 * import-live-blog.mjs — ONE-TIME migration of the existing blog into files.
 *
 *   npm run import-live-blog              import every post not imported yet
 *   npm run import-live-blog -- --force   re-import and overwrite all posts
 *   npm run import-live-blog -- --only <slug>
 *
 * The old backend (Render + MySQL) is gone, but every post still exists on
 * elegantize.com as a prerendered HTML page. This script opens each post URL
 * listed in the live sitemap.xml (JavaScript off, so it reads exactly the
 * saved HTML), and writes:
 *
 *   content/blog/<slug>.html            front matter (title, date, SEO fields,
 *                                       category, tags, image) + the article HTML
 *   public/blog-images/<slug>/*.webp    every image the post uses, downloaded
 *                                       and compressed (max 1600px wide)
 *
 * Images that were pasted straight into the text (huge data:image blobs — the
 * reason Render ran out of bandwidth) and images on Cloudinary/ImageKit/old
 * WordPress are all saved locally, so the site depends on no outside service.
 * Images under elegantize.com/images/... are left as /images/... links.
 *
 * Needs internet. Run it on your own computer from the frontend/ folder.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import sharp from "sharp";
import matter from "gray-matter";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = (process.env.ELEGANTIZE_URL || "https://elegantize.com").replace(/\/$/, "");
const CONTENT_DIR = path.join(ROOT, "content/blog");
const IMAGE_DIR = path.join(ROOT, "public/blog-images");
const MAX_WIDTH = 1600;
const QUALITY = 80;
const CONCURRENCY = 3;

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ONLY = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

const warnings = [];
let imageBytes = 0;
let imageCount = 0;

// ---------------------------------------------------------------------------
// Extraction — runs inside the page. Mirrors the markup of BlogPostPage.tsx.
// ---------------------------------------------------------------------------
function extract() {
  const root = document.getElementById("root");
  const h1 = root?.querySelector("h1");
  if (!h1) return null;
  const meta = (n) => document.querySelector(`meta[name="${n}"]`)?.content || "";
  const og = (n) => document.querySelector(`meta[property="${n}"]`)?.content || "";
  const fixAmp = (t) => t.replace(/&amp;/g, "&").trim();

  const category = fixAmp(h1.parentElement.querySelector("span.rounded-full")?.textContent || "");
  const metaRow = h1.nextElementSibling;
  const author = metaRow ? (metaRow.querySelector(":scope > span")?.textContent || "").trim() : "";

  const tagLabel = [...root.querySelectorAll("div")].find(
    (x) => x.children.length <= 2 && /^\s*Tags:\s*$/.test(x.textContent),
  );
  const tags = tagLabel
    ? [...tagLabel.parentElement.querySelectorAll(":scope > span")].map((s) => fixAmp(s.textContent))
    : [];

  let metaTitle = document.title.trim();
  const stripped = metaTitle.replace(/ \| Elegantize Weddings$/, "");
  if (stripped !== metaTitle && !stripped.includes("Elegantize")) metaTitle = stripped;

  const prose = root.querySelector('[class*="prose"]');
  return {
    title: fixAmp(h1.textContent),
    metaTitle,
    metaDescription: meta("description").replace(/\s+/g, " ").trim(),
    metaKeywords: meta("keywords"),
    author,
    category,
    tags,
    image: og("og:image"),
    content: prose ? prose.innerHTML : "",
  };
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------
function isLocalSiteImage(src) {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const u = new URL(src);
    return /(^|\.)elegantize\.com$/.test(u.hostname) && u.pathname.startsWith("/images/");
  } catch {
    return false;
  }
}

async function loadImage(src) {
  if (src.startsWith("data:")) {
    const m = src.match(/^data:image\/[a-z0-9.+-]+;base64,(.*)$/is);
    if (!m) throw new Error("unreadable data:image");
    return Buffer.from(m[1].replace(/\s/g, ""), "base64");
  }
  const r = await fetch(src, { signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Saves one image as WebP and returns its public path, or null on failure. */
async function saveImage(src, slug, name) {
  try {
    const input = await loadImage(src);
    const out = await sharp(input, { animated: true, failOn: "none" })
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    const dir = path.join(IMAGE_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${name}.webp`), out);
    imageBytes += out.length;
    imageCount++;
    return `/blog-images/${slug}/${name}.webp`;
  } catch (e) {
    const shown = src.startsWith("data:") ? "embedded image" : src;
    warnings.push(`${slug}: could not save ${shown} (${e.message}) — left as it was`);
    return null;
  }
}

async function localiseImages(post, slug) {
  const saved = new Map(); // original src -> local path, so each image is stored once

  // Featured image
  let image = post.image;
  if (!image || image.includes("images.unsplash.com/photo-1499750310159")) image = "";
  else if (isLocalSiteImage(image)) image = image.replace(/^https?:\/\/(www\.)?elegantize\.com/, "");
  else {
    const local = await saveImage(image, slug, "cover");
    if (local) saved.set(image, local);
    image = local || image;
  }

  // Body images — each distinct src saved once, then swapped in place
  let content = post.content;
  const srcs = [...new Set([...content.matchAll(/<img\b[^>]*?\ssrc="([^"]+)"/gi)].map((m) => m[1]))];
  let n = 0;
  for (const raw of srcs) {
    const src = raw.replace(/&amp;/g, "&");
    if (isLocalSiteImage(src)) continue;
    let local = saved.get(src);
    if (!local) {
      n++;
      local = await saveImage(src, slug, String(n));
      if (local) saved.set(src, local);
    }
    if (local) content = content.split(`src="${raw}"`).join(`src="${local}"`);
  }
  return { image, content };
}

// ---------------------------------------------------------------------------
async function postPaths() {
  const r = await fetch(`${SITE}/sitemap.xml`, { cache: "no-store" });
  if (!r.ok) throw new Error(`could not read ${SITE}/sitemap.xml (HTTP ${r.status})`);
  const xml = await r.text();
  return [...xml.matchAll(/<loc>\s*https?:\/\/[^/<]+\/(\d{4}\/\d{2}\/\d{2}\/[^<\s]+?)\/?\s*<\/loc>/g)].map((m) => m[1]);
}

async function importOne(browser, p) {
  const [y, mo, d, ...rest] = p.split("/");
  const slug = rest.join("/");
  const file = path.join(CONTENT_DIR, `${slug}.html`);
  if (!FORCE && (fs.existsSync(file) || fs.existsSync(file.replace(/\.html$/, ".md")))) return "skipped";

  const page = await browser.newPage();
  try {
    await page.setJavaScriptEnabled(false);
    const res = await page.goto(`${SITE}/${p}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    if (!res || res.status() !== 200) throw new Error(`HTTP ${res?.status()}`);
    const post = await page.evaluate(extract);
    if (!post) throw new Error("no <h1> — this URL has no prerendered page");
    if (!post.content) throw new Error("article body not found");

    post.content = post.content.replace(/<!--\s*\/?wp:[\s\S]*?-->\n?/g, ""); // WordPress block comments
    const { image, content } = await localiseImages(post, slug);
    const data = {
      title: post.title,
      slug,
      date: `${y}-${mo}-${d}`,
      author: post.author || "Elegantize",
      category: post.category || "Wedding",
      tags: post.tags,
      image: image || undefined,
      metaTitle: post.metaTitle !== post.title ? post.metaTitle : undefined,
      metaDescription: post.metaDescription || undefined,
      metaKeywords: post.metaKeywords || undefined,
    };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    fs.writeFileSync(file, matter.stringify(`\n${content.trim()}\n`, data));
    return "imported";
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  let paths = await postPaths();
  if (ONLY) paths = paths.filter((p) => p.endsWith(`/${ONLY}`));
  console.log(`\nimporting ${paths.length} posts from ${SITE}${FORCE ? " (overwriting)" : ""}\n`);

  const browser = await puppeteer.launch({ args: ["--no-sandbox"], protocolTimeout: 300_000 });
  const tally = { imported: 0, skipped: 0, failed: 0 };
  const failures = [];
  const queue = [...paths];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const p = queue.shift();
        try {
          const r = await importOne(browser, p);
          tally[r]++;
          if (r === "imported") console.log(`  ok    ${p}`);
        } catch (e) {
          tally.failed++;
          failures.push(`${p} — ${e.message.split("\n")[0]}`);
          console.log(`  FAIL  ${p} — ${e.message.split("\n")[0]}`);
        }
      }
    }),
  );
  await browser.close();

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`  imported : ${tally.imported}`);
  console.log(`  skipped  : ${tally.skipped} (already in content/blog — use --force to redo)`);
  console.log(`  failed   : ${tally.failed}`);
  console.log(`  images   : ${imageCount} saved, ${(imageBytes / 1e6).toFixed(1)} MB`);
  console.log(`─────────────────────────────────────────────`);
  if (warnings.length) {
    console.log(`\n${warnings.length} image warning(s):`);
    warnings.forEach((w) => console.log(`  ! ${w}`));
  }
  if (failures.length) {
    console.log(`\nFailed posts (run again to retry just these):`);
    failures.forEach((f) => console.log(`  ✗ ${f}`));
    process.exitCode = 1;
  }
  console.log(`\nNext: npm run blog   (checks every post and rebuilds the sitemap)\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
