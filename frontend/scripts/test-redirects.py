#!/usr/bin/env python3
"""
Redirect verification harness for elegantize.com

Routes every URL through a real Apache with the candidate .htaccess loaded and
asserts two invariants:

  A. COVERAGE — every URL in the Search Console soft-404 export resolves to a
     URL that exists in sitemap.xml AND returns 200 (directly, or after 301s).
     Sitemap membership alone is not evidence the destination is served.
  B. SAFETY   — every canonical URL in sitemap.xml returns 200 and is NOT
     caught by any redirect rule.

B is the one that matters most. A rule that accidentally matches a live post
is how the olive-green 410 happened.

DEPLOYMENT GATE — all of these must hold before uploading .htaccess:
    0 canonical URLs caught by a rule
    0 unresolved URLs from the export
    0 off-domain redirects
    longest redirect chain <= MAX_CHAIN
The script exits non-zero if any of them fails.

Regenerate sitemap.xml from the live API FIRST. Testing a redirect map against
a stale canonical set proves nothing.

KNOWN BLIND SPOT: an internal rewrite (no R flag) that serves the wrong file
returns 200 at the same address, so neither check catches it. Once prerendered
files exist, assert on served content, not just status.

NOTE: the prerender lookup in section 8 of .htaccess is inert until
dist/<route>.html files exist. Until then every route falls through to the SPA
handler, which is expected.

SETUP (Debian/Ubuntu)
    apt-get update && apt-get install -y apache2 && a2enmod rewrite

    DR=/var/www/eleg; mkdir -p $DR
    cp path/to/.htaccess $DR/.htaccess
    echo '<!doctype html><title>SPA SHELL</title>' > $DR/index.html

    cat > /etc/apache2/sites-available/eleg.conf <<'CONF'
    Listen 8080
    <VirtualHost *:8080>
      ServerName elegantize.com
      DocumentRoot /var/www/eleg
      <Directory /var/www/eleg>
        AllowOverride All
        Require all granted
        Options -MultiViews
      </Directory>
    </VirtualHost>
    CONF
    a2dissite 000-default; a2ensite eleg; apachectl restart

    To exercise the prerender lookup, drop a file at
    $DR/<route>.html and confirm the route serves it instead of the SPA shell.

USAGE
    python3 test-redirects.py sitemap.xml gsc-export.csv
"""
import subprocess, re, sys, csv, typing, urllib.parse, collections

MAX_CHAIN = 2   # deployment gate: no old URL may take more than this many hops
BASE = "http://127.0.0.1:8080"
HOST = "elegantize.com"
# urlparse().hostname never includes the port, so compare against a bare host.
HOSTNAME = HOST.split(":")[0].lower()
ORIGIN = f"https://{HOST}"


def canonical_set(sitemap_path):
    xml = open(sitemap_path, encoding="utf-8").read()
    out = set()
    for u in re.findall(r"<loc>\s*(.*?)\s*</loc>", xml):
        out.add(u.replace(ORIGIN, "").rstrip("/") or "/")
    # routes defined in App.tsx but deliberately kept out of the sitemap
    out |= {"/privacy-policy", "/terms-of-service", "/thank-you"}
    return out


class Result(typing.NamedTuple):
    """Outcome of walking a URL to the end of its redirect chain.

    status is the HTTP status of the FINAL response — 0 when the walk ended
    without one (off-domain jump, redirect loop, unparseable reply). Callers
    must check status as well as path: landing on a canonical address that
    returns 404 is not a resolved URL.
    """
    hops: list
    path: str
    status: int
    offsite: typing.Optional[str] = None   # genuine off-domain destination
    error: typing.Optional[str] = None     # loop, or no reply from the server

    @property
    def resolved(self):
        return self.offsite is None and self.error is None and self.status == 200


def follow(path, limit=10):
    cur, hops = urllib.parse.quote(path, safe="/?&=%"), []
    for _ in range(limit):
        head = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-D", "-", "-H", f"Host: {HOST}", BASE + cur],
            capture_output=True, text=True).stdout
        m = re.search(r"HTTP/1\.\d (\d+)", head)
        if not m:
            return Result(hops, urllib.parse.unquote(cur), 0, error="NO RESPONSE — is the server up?")
        code, loc = int(m.group(1)), re.search(r"(?im)^location:\s*(\S+)", head)
        if 300 <= code < 400:
            if not loc:
                # A 3xx with no Location is a broken response, not a destination.
                return Result(hops, urllib.parse.unquote(cur), code,
                              error=f"REDIRECT WITHOUT LOCATION (HTTP {code})")
            target = loc.group(1)
            # Compare the hostname exactly. A substring test would treat
            # https://elegantize.com.attacker.example/ as same-origin.
            host = (urllib.parse.urlparse(target).hostname or "").lower()
            if host and host != HOSTNAME:        # empty host => relative => same origin
                return Result(hops, urllib.parse.unquote(cur), 0, offsite=target)
            hops.append(urllib.parse.unquote(cur))
            cur = re.sub(r"^https?://[^/]+", "", target) or "/"
        else:
            return Result(hops, urllib.parse.unquote(cur), code, None)
    return Result(hops, urllib.parse.unquote(cur), 0, error="REDIRECT LOOP")


def main(sitemap, export):
    canon = canonical_set(sitemap)
    fail = 0

    print(f"SAFETY — {len(canon)} canonical URLs: one request, 200, no redirect")
    print("=" * 72)
    caught = []
    for p in sorted(canon):
        r = follow(p)
        # Assert the invariant directly rather than inferring it from a status
        # code: zero redirect hops, no off-domain jump, the request ends on the
        # same address it started from, and that address answers 200.
        if r.error:
            caught.append((p, r.error))
        elif r.offsite or r.hops or r.path.split("?")[0].rstrip("/") != p.rstrip("/"):
            caught.append((p, f"{len(r.hops)} hop(s) -> {r.offsite or r.path}"))
        elif r.status != 200:
            caught.append((p, f"status {r.status}"))
    if caught:
        fail += len(caught)
        print(f"  FAIL — {len(caught)} live URL(s) caught by a rule:")
        for p, why in caught:
            print(f"    {p}\n        {why}")
    else:
        print("  PASS — every canonical URL resolves in one request with no redirect.")

    print(f"\nCOVERAGE — every exported URL must land on a canonical URL")
    print("=" * 72)
    buckets = collections.defaultdict(list)
    for row in csv.DictReader(open(export)):
        raw = row["URL"].replace(ORIGIN, "")
        r = follow(raw)
        dest = r.path.split("?")[0].rstrip("/") or "/"
        if r.error:
            buckets["error"].append((raw, r.error))
        elif r.offsite:
            buckets["offsite"].append((raw, r.offsite))
        elif dest not in canon:
            buckets["unresolved"].append((raw, f"{dest} (not in sitemap)", len(r.hops)))
        elif r.status != 200:
            # Canonical path, but the server does not actually serve it.
            buckets["unresolved"].append((raw, f"{dest} (status {r.status})", len(r.hops)))
        else:
            buckets["redirected" if r.hops else "already_canonical"].append((raw, dest, len(r.hops)))

    total = sum(len(v) for v in buckets.values())
    print(f"  already canonical : {len(buckets['already_canonical']):>4}")
    print(f"  301'd to canonical: {len(buckets['redirected']):>4}")
    print(f"  off-domain        : {len(buckets['offsite']):>4}")
    print(f"  UNRESOLVED        : {len(buckets['unresolved']):>4}")
    print(f"  ERRORED           : {len(buckets['error']):>4}")
    print(f"  total             : {total:>4}")
    longest = max((h for _, _, h in buckets["redirected"]), default=0)
    print(f"  longest chain     : {longest} hop(s)")
    if longest > MAX_CHAIN:
        fail += 1
        print(f"    FAIL — chain exceeds the {MAX_CHAIN}-hop deployment gate")

    for raw, dest, _ in buckets["unresolved"]:
        print(f"    UNRESOLVED  {raw}\n                -> {dest}")
    for raw, target in buckets["offsite"]:
        print(f"    OFFSITE     {raw} -> {target}")
    for raw, why in buckets["error"][:3]:
        print(f"    ERROR       {raw} -> {why}")

    fail += len(buckets["unresolved"]) + len(buckets["offsite"]) + len(buckets["error"])
    print("\n" + ("=" * 72))
    print("RESULT:", "PASS" if fail == 0 else f"{fail} issue(s)")
    return 1 if fail else 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
