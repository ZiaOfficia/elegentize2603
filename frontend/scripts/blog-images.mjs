/**
 * blog-images.mjs — make blog pictures web-ready.
 *
 *   npm run blog-images
 *
 * Finds every .jpg / .jpeg / .png in public/blog-images/ (all post folders),
 * saves a .webp next to it (max 1600px wide, quality 80 — usually 5–10x
 * smaller), and removes the original so it isn't uploaded too.
 * Then link the .webp in your post, e.g. /blog-images/my-post/cover.webp
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/blog-images");

const walk = (d) =>
  fs.existsSync(d)
    ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
      )
    : [];

const files = walk(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));
if (!files.length) {
  console.log("No .jpg/.png files in public/blog-images/ — nothing to do.");
  process.exit(0);
}

let before = 0;
let after = 0;
for (const f of files) {
  const out = f.replace(/\.(jpe?g|png)$/i, ".webp");
  const input = fs.readFileSync(f);
  const buf = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  fs.writeFileSync(out, buf);
  fs.unlinkSync(f);
  before += input.length;
  after += buf.length;
  console.log(
    `  ${path.relative(DIR, f)} → ${path.basename(out)}  (${(input.length / 1024).toFixed(0)} KB → ${(buf.length / 1024).toFixed(0)} KB)`,
  );
}
console.log(`\n${files.length} image(s): ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB`);
