/**
 * src/components/common/SEO.tsx
 *
 * Backward-compatible with every existing call site in src/pages:
 *   <SEO title description />                              (11 pages)
 *   <SEO title description image />                        (ServiceDetailPage, PortfolioDetailPage)
 *   <SEO title description keywords image url type />      (BlogPostPage)
 *
 * Only `title` and `description` are required — exactly as before. Everything
 * else stays optional, so no existing page needs editing.
 *
 * What this version adds on top of the original:
 *   - a canonical <link>, derived from `url` when passed and otherwise from the
 *     current route, so prerendered pages ship a canonical tag
 *   - Open Graph + Twitter card tags
 *   - optional Article JSON-LD when `article` is supplied
 *
 * Why it matters now: these tags are written by react-helmet-async at runtime,
 * so the HTML the server sends still carries only the title from index.html.
 * Once scripts/prerender.mjs runs, the captured DOM includes everything Helmet
 * has written — which is what finally puts real per-page metadata in the served
 * HTML. The metadata was never missing; it was just never reaching the crawler.
 *
 * CANONICAL INVARIANT: for blog posts, `url` must come from getBlogPostUrl(),
 * the same function that feeds sitemap.xml, the redirect targets and the
 * prerender output filenames. One function, one string, everywhere.
 */

import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const ORIGIN = "https://elegantize.com";
const BRAND = "Elegantize Weddings";

type Props = {
  title: string;
  /** Optional: BlogPostPage's not-found branch passes title only. */
  description?: string;
  /** Comma-separated. Passed by BlogPostPage from post.metaKeywords. */
  keywords?: string;
  /** Absolute URL or site-relative path. */
  image?: string;
  /** Canonical URL or path. Defaults to the current route. */
  url?: string;
  /** Open Graph type. Defaults to "website"; BlogPostPage passes "article". */
  type?: string;
  /** Supply on posts to emit Article JSON-LD. */
  article?: { publishedAt: string; modifiedAt?: string; author?: string };
  noindex?: boolean;
};

const absolute = (v?: string) =>
  !v ? undefined : v.startsWith("http") ? v : `${ORIGIN}${v.startsWith("/") ? "" : "/"}${v}`;

export const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type,
  article,
  noindex,
}: Props) => {
  const { pathname } = useLocation();

  const canonical = absolute(url ?? pathname) ?? ORIGIN;
  const img = absolute(image);
  const ogType = type ?? (article ? "article" : "website");
  const fullTitle = title.includes("Elegantize") ? title : `${title} | ${BRAND}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      {img && <meta property="og:image" content={img} />}

      <meta name="twitter:card" content={img ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {img && <meta name="twitter:image" content={img} />}

      {article && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description,
            image: img ? [img] : undefined,
            datePublished: article.publishedAt,
            dateModified: article.modifiedAt ?? article.publishedAt,
            author: { "@type": "Person", name: article.author ?? BRAND },
            publisher: {
              "@type": "Organization",
              name: BRAND,
              logo: {
                "@type": "ImageObject",
                url: `${ORIGIN}/faviconlogo/elegantize-logo-fav.webp`,
              },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
