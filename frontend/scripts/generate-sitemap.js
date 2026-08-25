import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_URL = "https://elegantize-zl57.onrender.com";
const BASE_URL = "https://elegantize.com";
const OUTPUT = path.join(__dirname, "../public/sitemap.xml");

const staticPages = [
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

async function fetchAllPosts() {
  let allPosts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`${API_URL}/api/blogs?page=${page}&limit=100`);
    const data = await res.json();
    allPosts = allPosts.concat(data.blogs || []);
    hasMore = data.pagination?.hasNextPage || false;
    page++;
  }

  return allPosts;
}

async function generate() {
  console.log("Fetching blog posts...");
  const posts = await fetchAllPosts();
  console.log(`Found ${posts.length} blog posts`);

  const staticUrls = staticPages
    .map(
      (p) => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    )
    .join("\n");

  const blogUrls = posts
    .map((post) => {
      // UTC getters only — must match getBlogPostUrl() in src/data/blogData.ts.
      // Local-time getters make the permalink depend on the timezone of the
      // machine running the build, which produced the duplicate off-by-one-day
      // URLs reported as soft 404s in Search Console.
      const d = new Date(post.createdAt);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      const cleanSlug = post.slug.replace(/^\/+/, "").trim().toLowerCase();
      const lastmod = new Date(post.updatedAt).toISOString().split("T")[0];
      return `  <url>
    <loc>${BASE_URL}/${year}/${month}/${day}/${cleanSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${blogUrls}
</urlset>`;

  fs.writeFileSync(OUTPUT, xml, "utf-8");
  console.log(`✅ sitemap.xml updated — ${posts.length} blog posts included`);
}

generate().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
