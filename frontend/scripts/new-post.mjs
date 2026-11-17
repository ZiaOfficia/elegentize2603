/**
 * new-post.mjs — start a new blog post.
 *
 *   npm run new-post -- "How Much Does Wedding Decor Cost in NJ?"
 *
 * Creates content/blog/<slug>.md (pre-filled from content/blog/_TEMPLATE.md
 * with today's date) and an empty public/blog-images/<slug>/ folder for its
 * pictures. Then open the .md file and write.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const title = process.argv.slice(2).join(" ").trim();

if (!title) {
  console.error('Usage: npm run new-post -- "Your Post Title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 80)
  .replace(/-+$/, "");

const file = path.join(ROOT, "content/blog", `${slug}.md`);
if (fs.existsSync(file) || fs.existsSync(file.replace(/\.md$/, ".html"))) {
  console.error(`A post with the slug "${slug}" already exists: content/blog/${slug}.*`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const template = fs.readFileSync(path.join(ROOT, "content/blog/_TEMPLATE.md"), "utf8");
const body = template
  .replace(/^title: .*$/m, `title: ${JSON.stringify(title)}`)
  .replace(/^slug: .*$/m, `slug: ${slug}`)
  .replace(/^date: .*$/m, `date: ${today}`)
  .replace(/\/blog-images\/your-post-slug\//g, `/blog-images/${slug}/`);

fs.mkdirSync(path.join(ROOT, "public/blog-images", slug), { recursive: true });
fs.writeFileSync(file, body);

console.log(`
Created:
  content/blog/${slug}.md          <- write the post here
  public/blog-images/${slug}/      <- put its pictures here (cover.webp, 1.webp, ...)

The post will be published at:
  https://elegantize.com/${today.replace(/-/g, "/")}/${slug}

It starts as a draft. When it is ready, change  draft: true  to  draft: false
Preview it with:  npm run dev   (then open http://localhost:5173/blog)
`);
