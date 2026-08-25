import { Helmet } from "react-helmet-async";

const SITE_URL = "https://elegantize.com";

/**
 * Build an absolute, production-domain URL from a path.
 *
 * Always resolves against SITE_URL, never against window.location, so the
 * canonical stays correct on localhost, on preview builds and on any staging
 * host. Query strings and hashes are dropped, duplicate slashes collapsed and
 * the trailing slash removed, so the output matches the URLs emitted by
 * scripts/generate-sitemap.js exactly. The site root keeps its slash.
 */
const absoluteUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = `/${path}`
    .split(/[?#]/)[0]
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "");
  return clean === "" ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
};

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  name?: string;
  type?: string;
  image?: string;
  /**
   * Path for this page, e.g. "/2026/01/20/ceiling-installation-wedding-nyc-2026".
   * Omit it and the current router pathname is used.
   */
  url?: string;
  /** Set on pages that must not be indexed (404, admin, thank-you). */
  noindex?: boolean;
}

export const SEO = ({
  title,
  description = "Luxury wedding decor and event design in New York & New Jersey. Elegantize specializes in custom mandaps, floral arrangements, and premium event styling.",
  keywords,
  name = "Elegantize Weddings",
  type = "website",
  image = "/og-image.jpg", // Ensure this default image exists or update path
  url,
  noindex = false,
}: SEOProps) => {
  // Prefer the explicit path a page passes in; fall back to the address the
  // visitor is actually on. Read from window rather than useLocation() so this
  // component stays usable outside a Router and safe under prerendering.
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const canonicalUrl = absoluteUrl(url ?? currentPath);
  const imageUrl = absoluteUrl(image);

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title} | Elegantize Weddings</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Canonical — one indexable URL per article, regardless of the date
          segment or trailing slash the visitor arrived on. */}
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      {/* Facebook tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={name} />

      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
};
