/**
 * prerender.mjs — the missing build step for elegantize.com
 *
 * Run AFTER `vite build`. Walks every canonical route in public/sitemap.xml,
 * renders it in a real browser, and writes flat `dist/<route>.html` files that
 * the .htaccess prerender lookup (`%{DOCUMENT_ROOT}/$1.html -f`) will serve.
 *
 *   "build": "node scripts/build-blog.mjs && tsc -b && vite build && node scripts/prerender.mjs"
 *
 * DESIGN NOTES — these are deliberate, please read before editing.
 *
 * 1. Waits on a CONTENT SELECTOR, never networkidle. A networkidle wait will
 *    happily bake an empty shell into a file. That is worse than no prerender
 *    at all, because it is invisible: the file exists, returns 200, and
 *    contains nothing. Blog posts load their body from /blog-data/<slug>.json
 *    (written by build-blog.mjs), so a post waits for [data-content-ready].
 * 2. FAILS LOUDLY. A route that does not produce real content aborts the build.
 *    Never ship a half-working prerender.
 * 3. Preserves the raw SPA shell as dist/app-shell.html, because dist/index.html
 *    becomes the prerendered HOMEPAGE. If the .htaccess SPA fallback keeps
 *    pointing at index.html, every unknown URL will serve homepage content with
 *    a 200 — recreating the exact soft-404 problem this fixes. See OUTPUT below.
 * 4. Emits dist/404.html so unknown routes can return a real 404 status.
 */

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "../dist");
const SITEMAP = path.join(__dirname, "../public/sitemap.xml");
const ORIGIN = "https://elegantize.com";

const PORT = 4178;
const CONCURRENCY = 2;
const NAV_TIMEOUT = 60_000;
const MIN_TEXT = 400;         // chars of rendered text below which we call it empty

// ---------------------------------------------------------------------------
// Route list — the sitemap is the single source of canonical truth, matching
// the invariant in docs/soft-404-remediation.md.
// ---------------------------------------------------------------------------
async function routes() {
  const xml = await fs.readFile(SITEMAP, "utf-8");
  const found = [...xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g)]
    .map((m) => m[1].replace(ORIGIN, "").trim())
    .map((p) => (p === "" ? "/" : p.replace(/\/$/, "") || "/"));
  return [...new Set(found)];
}

// ---------------------------------------------------------------------------
// Static server with SPA fallback, serving the freshly built dist/
// ---------------------------------------------------------------------------
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png",
  ".jpg": "image/jpeg", ".json": "application/json", ".woff2": "font/woff2" };

function serve(shellHtml) {
  return http.createServer(async (req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(DIST, url);
    try {
      const stat = await fs.stat(file);
      if (stat.isFile()) {
        res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream" });
        return res.end(await fs.readFile(file));
      }
    } catch { /* fall through to SPA shell */ }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(shellHtml);
  });
}

// ---------------------------------------------------------------------------
// Render one route
// ---------------------------------------------------------------------------
const isPost = (r) => /^\/\d{4}\/\d{2}\/\d{2}\//.test(r);

async function render(browser, route) {
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1360, height: 900 });
    page.setDefaultNavigationTimeout(NAV_TIMEOUT);
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: "domcontentloaded" });

    // A post is done when its body has loaded ([data-content-ready]). Stop
    // early on the not-found page or a load error, so a broken post fails
    // fast with the real reason instead of burning the whole timeout.
    if (isPost(route)) {
      await page.waitForFunction(
        () => document.querySelector("#root [data-content-ready]") ||
              /Page Not Found|could not be loaded/i.test(document.getElementById("root")?.innerText ?? ""),
        { timeout: NAV_TIMEOUT },
      );
      const ok = await page.evaluate(() => !!document.querySelector("#root [data-content-ready]"));
      if (!ok) throw new Error("post did not load (not found, or its /blog-data JSON is missing)");
    } else {
      await page.waitForSelector("#root h1, #root main, #root article", { timeout: NAV_TIMEOUT });
    }
    // Let entrance animations and lazy sections settle.
    await new Promise((r) => setTimeout(r, 800));

    // react-helmet-async writes <title>/canonical/meta on an animation frame,
    // which a background tab may never get. Bring the tab forward and wait for
    // the canonical tag, so no page ships with the generic index.html title.
    await page.bringToFront();
    await page
      .waitForFunction(() => document.querySelector('link[rel="canonical"]'), { timeout: 15_000 })
      .catch(() => {});

    const probe = await page.evaluate(() => ({
      text: (document.getElementById("root")?.innerText ?? "").trim(),
      title: document.title,
      h1: document.querySelector("#root h1")?.innerText?.trim() ?? "",
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? "",
    }));

    if (probe.text.length < MIN_TEXT) throw new Error(`only ${probe.text.length} chars rendered`);
    if (/Article Not Found|Page Not Found/i.test(probe.h1)) throw new Error("rendered the not-found branch");
    if (!probe.canonical) throw new Error("no canonical tag — page SEO tags were not applied");

    const html = await page.content();
    const out = path.join(DIST, `${route === "/" ? "/index" : route}.html`);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, html, "utf-8");
    return { route, ok: true, chars: probe.text.length, title: probe.title, canonical: probe.canonical };
  } catch (err) {
    return { route, ok: false, error: err.message.split("\n")[0] };
  } finally {
    await page?.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
async function main() {
  if (!existsSync(DIST)) throw new Error("dist/ not found — run `vite build` first");

  // Preserve the untouched shell BEFORE index.html gets overwritten.
  const shell = await fs.readFile(path.join(DIST, "index.html"), "utf-8");
  await fs.writeFile(path.join(DIST, "app-shell.html"), shell, "utf-8");

  const list = await routes();
  console.log(`\nprerendering ${list.length} canonical routes\n`);

  const server = serve(shell);
  await new Promise((r) => server.listen(PORT, r));
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ],
    protocolTimeout: 180_000,
  });

  const results = [];
  const queue = [...list];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const route = queue.shift();
        const r = await render(browser, route);
        results.push(r);
        console.log(
          r.ok ? `  ok    ${r.route}  (${r.chars} chars)` : `  FAIL  ${r.route}  — ${r.error}`,
        );
      }
    }),
  );

  // 404 page, so unknown routes can be served with a real 404 status
  const p = await browser.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/__definitely-not-a-route__`, { waitUntil: "networkidle0" });
  await fs.writeFile(path.join(DIST, "404.html"), await p.content(), "utf-8");
  await p.close();

  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.ok);
  const titles = new Set(results.filter((r) => r.ok).map((r) => r.title));
  const noCanon = results.filter((r) => r.ok && !r.canonical).length;

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`  rendered        : ${results.length - failed.length}/${list.length}`);
  console.log(`  failed          : ${failed.length}`);
  console.log(`  distinct titles : ${titles.size}   ${titles.size < list.length * 0.9
      ? "<-- WARNING: pages are sharing titles. Add per-page <Helmet>." : ""}`);
  console.log(`  missing canonical: ${noCanon}`);
  console.log(`─────────────────────────────────────────────\n`);

  if (failed.length) {
    console.error("Prerender FAILED. Not shipping empty shells. Failures:");
    failed.forEach((f) => console.error(`   ${f.route} — ${f.error}`));
    process.exit(1);
  }

  console.log("Prerender complete. Upload the contents of dist/ to public_html (see docs/how-to-add-a-blog-post.md).");
}

main().catch((e) => { console.error(e); process.exit(1); });
