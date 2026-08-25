# Soft 404 remediation — elegantize.com

Written 24–25 Aug 2026. This is the rationale behind `frontend/public/.htaccess`,
`frontend/scripts/test-redirects.py` and the UTC changes in
`frontend/src/data/blogData.ts` / `frontend/scripts/generate-sitemap.js`.

Google Search Console reported **222 soft 404s**; validation started 20 Jul 2026 and
failed 05 Aug 2026. There were two independent causes.

---

## Cause 1 — client-side rendering (81 URLs)

Every URL returns HTTP 200 with a near-empty shell: identical `<title>`, no `<h1>`,
no body copy, no canonical tag. That includes the homepage, the blog index, live
posts, and URLs that don't exist. Content is drawn entirely by JavaScript, so the
first crawl sees identical blank pages.

**81 of the 222 were current, live, sitemap-listed pages.** There is nothing to
redirect them to — they *are* the destination. Only prerendering fixes these, and
prerendering is not yet implemented. Redirects and canonical tags do not help here.

## Cause 2 — timezone-dependent permalinks (80 URLs)

`getBlogPostUrl()` and `generate-sitemap.js` both built the date path from **local**
time (`getFullYear` / `getMonth` / `getDate`). Post URLs are generated client-side,
so the address a reader was handed depended on *their* timezone:

```
createdAt = 2025-03-12T20:00:00Z
  local, TZ=Asia/Kolkata -> /2025/03/13/navy-blue-and-burgundy-wedding-decor
  UTC                    -> /2025/03/12/navy-blue-and-burgundy-wedding-decor
```

An IST reader and a UTC crawler got different URLs for the same article. Because the
route `/:year/:month/:day/:slug` looks the post up by **slug only** and ignores the
date, both returned the same article with a 200 — two live, canonical-less addresses
per post.

Both files now use `getUTCFullYear` / `getUTCMonth` / `getUTCDate`. **They must stay
in sync.** Regenerating the sitemap after the fix moved zero dates, which confirmed
the sitemap had always been built in a UTC context — the rendered links were the
unstable side, not the sitemap.

---

## Why the previous `.htaccess` made things worse

The file that shipped before this work contained rules that actively harmed indexing.
Recording them here so they are not reintroduced:

| Rule | Problem |
|---|---|
| `410` on `/2025/07/20/olive-green-wedding-decor-ideas` | **The post is live and in the sitemap.** The 410 was instructing Google to deindex a real article. Removed — it must have *no* rule and fall through to the SPA/prerender handlers. |
| `410` on four other posts | All four slugs exist in the sitemap under a different date. Someone hit the date-drift bug above, could not find the post, and concluded it was gone. All four are now 301s: `10-creative-ideas-for-cocktail-table-…` (01/11→01/10), `bridal-shower-decorations-trends` (05/05→09/18), `emerald-green-wedding-decor-…` (08/07→08/06), `creative-wedding-floor-wrap-designs` (07/30→07/29). |
| `→ /2025/09/19/best-time-of-year-…` | Target does not exist; live post is `09/18`. Redirected one soft 404 into another. |
| `→ /2024/10/01/how-to-plan-a-dream` | Target does not exist; live post is `2024/09/30`. |
| `→ /2025/02/06/indian-wedding-events-…` | Live post is `2025/02/05`. |
| `→ /2025/02/12/simple-valentines-…` | Live post is `2025/02/11`. |
| `centerpiece-design-3 → /centerpiece-design` | Target is not a route. The app defines only `/services/:id`. Same for `/vinyl-floor-wraps` and `/draping-services`. |
| *(missing)* `/vinyl-floor-wraps`, `/stage-design` | Both appear in the soft-404 export with **no rule at all** — they fell through to a 200 SPA shell. Now 301 to `/services/vinyl-floor-wrap` (singular "wrap", matching the route) and `/services/stage-design`. |
| Blanket query rule → `youtube.com` | Any URL carrying `?amp=1`, `?noamp=mobile` or `?et_blog` was 301'd **off-domain**, as was `/feed/`. Replaced with a parameter strip that keeps visitors on elegantize.com. |
| *(missing)* trailing-slash canonicalisation | Every canonical URL served 200 at both `/x` and `/x/` — 165 duplicate pairs. |

### Rule ordering that matters

- The **trailing-slash strip sits after the redirect block**, not before. The redirect
  rules already match `/?$` and resolve a slashed legacy URL in one hop; a global strip
  earlier adds a hop to every one of them and breaches the 2-hop limit.
- The **prerender lookup** (`%{DOCUMENT_ROOT}/$1.html -f`) sits between the redirects
  and the SPA fallback. It is inert until `dist/<route>.html` files exist.
- The **SPA fallback must stay last.**
- Query-cleanup targets are absolute (`https://elegantize.com/$1`). A root-relative
  target inherits the request scheme, which can emit `http://` redirects on a host that
  terminates TLS at a proxy.

### Rules deliberately left alone

Recorded so a later audit does not "fix" them:

- **The two malformed-path rules** (old L17, L20) are narrow and harmless. Kept, because
  removing them without knowing where the bad inbound links came from trades a working
  rule for an unknown. Revisit only with referrer data.
- **`RewriteRule . /index.html [L]`** (old L78) was flagged by the audit purely because
  `/index.html` is not a sitemap route. That is a **false positive** — it is the SPA
  fallback and is correct. It must stay last.
- **The two narrow AMP rules** (old L9–L14) are now **redundant**: the parameter-strip
  rule that replaced the blanket YouTube redirect already covers them. Harmless, but do
  not extend the pattern — add to the strip instead.

---

## Provenance of the redirect map

The 24 Aug audit ran against a sitemap of **166 `<loc>` entries — 150 dated posts + 16
static routes**; every redirect target below was checked for existence in that set.

Rules were generated by **exact slug lookup against `sitemap.xml`**, never by computing
a date offset. Direction is an output of the lookup: 59 rules move back one day, one
moves forward one day, two move forward 136 days (posts republished in September), nine
also change the slug. Targets not found in the sitemap: zero.

`frontend/scripts/fixtures/redirect-map.csv` holds the 136 `old_url,new_url` pairs.
**It is not regenerable** — the sitemap contains only current canonical URLs, so the
old side (e.g. the wrong-date `/2024/11/08/…` variant of a post living at `/2024/11/07/…`)
cannot be derived from it. It came from the Search Console export. Most of those old URLs
do not appear literally in `.htaccess` because generic rules catch them; this file is the
record of intent.

### Two decisions that were made on judgement, not evidence

1. **`/2024/09/30/how-to-plan-a-dream`** is live with a *truncated* slug — the article is
   "How to Plan a Dream Winter Wedding in New York". The redirect points at the truncated
   URL because that is what the sitemap says. If the full slug is restored in the CMS,
   both the sitemap and this rule change.
2. **`/2025/09/19/best-time-of-year-for-outdoor-weddings-in-the-usa` →
   `/2025/09/18/best-time-of-year-for-outdoor-weddings`.** The slug was shortened, not
   just date-shifted, so this is inference rather than an exact match. Isolated from the
   generated rules for that reason.

---

## The gate

```bash
# setup (Debian/Ubuntu)
apt-get update && apt-get install -y apache2 && a2enmod rewrite
DR=/var/www/eleg; mkdir -p $DR
cp frontend/public/.htaccess $DR/.htaccess
echo '<!doctype html><title>SPA SHELL</title>' > $DR/index.html
# vhost with AllowOverride All on :8080 — see the script's docstring

python3 frontend/scripts/test-redirects.py \
        frontend/public/sitemap.xml \
        frontend/scripts/fixtures/gsc-soft404-export.csv
```

Two invariants, non-zero exit on failure:

- **SAFETY** — every canonical URL: no error, no redirect hop, same path, HTTP 200.
- **COVERAGE** — every exported URL lands on a URL that is in the sitemap *and* returns
  200. Sitemap membership alone is not evidence the destination is served.

Gate thresholds: 0 canonical URLs caught, 0 unresolved, 0 off-domain, 0 errored,
chain ≤ `MAX_CHAIN` (2).

Last run (25 Aug 2026, against the refreshed sitemap): **PASS** — 176 canonical direct
200s, 84 already canonical, 138 redirected, 0 off-domain / errored / unresolved,
longest chain 2.

Each assertion was verified by injecting the fault it catches: a canonical URL 301'd
away, a canonical URL returning 410, a redirect into that 410, a redirect to the
lookalike host `elegantize.com.attacker.example`, a 3xx with no `Location`, a redirect
loop, and a dead server.

### Known blind spots

- An **internal rewrite** (no `R` flag) that serves the wrong file returns 200 at the
  correct address, so neither invariant catches it. That is exactly the shape of the
  prerender lookup. Once static HTML exists, content integrity needs its own test:
  map each canonical URL to its expected post and verify the returned title, `<h1>`,
  canonical tag and JSON-LD. Keep it separate so failures stay attributable.
- The harness **normalises trailing slashes** before comparing, and SAFETY only ever
  requests the unslashed canonical forms. A trailing-slash regression would not be caught.
- The gate runs against **stock Apache**. Hostinger runs **LiteSpeed**, and
  `%{DOCUMENT_ROOT}/$1.html` is the line most likely to behave differently. Re-run the
  gate against the live host after upload.

---

## Still outstanding

- **Build and upload.** Nothing here has reached the server.
- **Prerendering.** The 81 URLs from Cause 1 stay soft 404s until posts ship real HTML.
  Plan: Puppeteer over the canonical route list after `vite build`, writing flat
  `dist/<route>.html` files (not `<route>/index.html`, which fights `DirectorySlash`).
  Import `getBlogPostUrl()` for output filenames rather than recomputing them. Wait on a
  content selector, not `networkidle` — the Render API cold-starts, and a prerender that
  half-works bakes an empty shell into a file.
- **`generate-sitemap.js` is not running on publish.** Seven posts were missing from the
  sitemap when it was regenerated on 25 Aug. This will silently reopen with the next post.
- **Do not press *Validate Fix*** in Search Console until a plain `curl` of a post URL
  shows the article text, the canonical tag and the JSON-LD.

## The invariant worth keeping

Every URL produced by the application, the sitemap, the canonical tag, a redirect target
and the prerender output must resolve to the same canonical string. One UTC-based
function now feeds all of them.
