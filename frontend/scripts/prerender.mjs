/**
 * prerender.mjs — the missing build step for elegantize.com
 *
 * Run AFTER `vite build`. Walks every canonical route in public/sitemap.xml,
 * renders it in a real browser, and writes flat `dist/<route>.html` files that
 * the .htaccess prerender lookup (`%{DOCUMENT_ROOT}/$1.html -f`) will serve.
 *
 *   npm i -D puppeteer
 *   "build": "tsc -b && vite build && node scripts/prerender.mjs"
 *
 * DESIGN NOTES — these are deliberate, please read before editing.
 *
 * 1. Waits on a CONTENT SELECTOR, never networkidle. The Render API cold-starts
 *    (~50s on the free tier) and a networkidle wait will happily bake an empty
 *    shell into a file. That is worse than no prerender at all, because it is
 *    invisible: the file exists, returns 200, and contains nothing.
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
const API = "https://elegantize-zl57.onrender.com";
const ORIGIN = "https://elegantize.com";

const PORT = 4178;
const CONCURRENCY = 3;
const NAV_TIMEOUT = 90_000;   // generous: first paint can wait on a cold API
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
// Wake the API before rendering anything, so route 1 isn't the cold-start victim
// ---------------------------------------------------------------------------
async function warmApi() {
  process.stdout.write("  waking Render API… ");
  const t = Date.now();
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(`${API}/api/blogs?page=1&limit=1`, { signal: AbortSignal.timeout(30_000) });
      if (r.ok) { console.log(`awake in ${((Date.now() - t) / 1000).toFixed(1)}s`); return; }
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("API never woke up — aborting rather than baking empty shells");
}

// ---------------------------------------------------------------------------
// Render one route
// ---------------------------------------------------------------------------
const isPost = (r) => /^\/\d{4}\/\d{2}\/\d{2}\//.test(r);

async function render(browser, route) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 900 });
  page.setDefaultNavigationTimeout(NAV_TIMEOUT);
  try {
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: "domcontentloaded" });

    // A blog post only renders <h1> in its success branch. The loading and
    // "Article Not Found" branches render <h2>, so h1 is a real discriminator.
    await page.waitForSelector(isPost(route) ? "#root h1" : "#root h1, #root main, #root article", {
      timeout: NAV_TIMEOUT,
    });

    const probe = await page.evaluate(() => ({
      text: (document.getElementById("root")?.innerText ?? "").trim(),
      title: document.title,
      h1: document.querySelector("#root h1")?.innerText?.trim() ?? "",
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? "",
    }));

    if (probe.text.length < MIN_TEXT) throw new Error(`only ${probe.text.length} chars rendered`);
    if (/Article Not Found|Page Not Found/i.test(probe.h1)) throw new Error("rendered the not-found branch");

    const html = await page.content();
    const out = path.join(DIST, `${route === "/" ? "/index" : route}.html`);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, html, "utf-8");
    return { route, ok: true, chars: probe.text.length, title: probe.title, canonical: probe.canonical };
  } catch (err) {
    return { route, ok: false, error: err.message };
  } finally {
    await page.close();
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
  await warmApi();

  const server = serve(shell);
  await new Promise((r) => server.listen(PORT, r));
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });

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

  console.log(`Two .htaccess changes are required for these files to be used:

  1. SPA fallback must stop pointing at index.html (now the prerendered
     homepage) or every unknown URL serves homepage content with a 200:
         RewriteRule . /app-shell.html [L]
  2. Add a real 404 so unknown routes stop being soft 404s:
         ErrorDocument 404 /404.html

  Then re-run scripts/test-redirects.py against the live host (LiteSpeed
  behaves differently from stock Apache on the -f lookup).
`);
}

main().catch((e) => { console.error(e); process.exit(1); });
