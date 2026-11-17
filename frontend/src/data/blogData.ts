/**
 * Blog data types and helpers.
 *
 * Posts live as files in content/blog/. scripts/build-blog.mjs turns them into
 * src/generated/blogIndex.ts (the list, imported below) and
 * public/blog-data/<slug>.json (each post's full body, fetched by the post page).
 * There is no backend.
 */

import { blogIndex } from "../generated/blogIndex";

/** A post as listed on the blog page, homepage, sidebar and related posts. */
export interface BlogSummary {
  slug: string;
  title: string;
  excerpt: string;
  createdAt: string; // ISO, always 12:00 UTC on the publish day
  updatedAt: string;
  author: string;
  category: string;
  tags: string; // comma-separated
  image: string;
  imageAlt: string;
  metaTitle: string;
  metaDescription: string;
}

/** A full post, as stored in public/blog-data/<slug>.json. */
export interface BlogPostFull extends BlogSummary {
  metaKeywords: string;
  content: string; // HTML
}

/** Shape used by <BlogCard>. */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  imageAlt?: string;
  date: string;
  author: string;
  category: string;
  createdAt?: string;
}

export const FALLBACK_POST_IMAGE = "/images/portfolio/dsc00085.webp";

/** Every published post, newest first. */
export const allPosts: BlogSummary[] = blogIndex;

/**
 * WordPress-style date URL, e.g. /2026/01/21/ceiling-installation-wedding-nyc-2026
 *
 * The date segments MUST be derived in UTC, or a visitor in another timezone
 * gets a different URL than Googlebot (see docs/soft-404-remediation.md).
 * scripts/build-blog.mjs builds sitemap URLs the same way.
 */
export const getBlogPostUrl = (slug: string, createdAt?: string): string => {
  const cleanSlug = slug.replace(/^\/+/, "");
  if (createdAt) {
    const d = new Date(createdAt);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `/${year}/${month}/${day}/${cleanSlug}`;
  }
  return `/blog/${cleanSlug}`;
};

/** "October 17, 2026" — fixed locale and UTC so every visitor sees the same date. */
export const formatPostDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

export const findPost = (slug: string): BlogSummary | undefined => {
  const clean = slug.replace(/^\/+|\/+$/g, "").toLowerCase();
  return allPosts.find((p) => p.slug === clean);
};

export const toCard = (p: BlogSummary): BlogPost => ({
  id: p.slug,
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  image: p.image || FALLBACK_POST_IMAGE,
  imageAlt: p.imageAlt,
  date: formatPostDate(p.createdAt),
  author: p.author,
  category: p.category,
  createdAt: p.createdAt,
});

/** Case-insensitive search over title, category, tags and excerpt. */
export const searchPosts = (query: string): BlogSummary[] => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return allPosts;
  return allPosts.filter((p) => {
    const hay = `${p.title} ${p.category} ${p.tags} ${p.excerpt}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
};

/** Posts sharing the most tags/category with this one, newest first on ties. */
export const relatedPosts = (slug: string, count = 3): BlogSummary[] => {
  const current = findPost(slug);
  if (!current) return allPosts.slice(0, count);
  const tagSet = new Set(
    current.tags.toLowerCase().split(",").map((t) => t.trim()).filter(Boolean),
  );
  const cat = current.category.toLowerCase();
  return allPosts
    .filter((p) => p.slug !== current.slug)
    .map((p, i) => {
      let score = p.category.toLowerCase() === cat ? 2 : 0;
      for (const t of p.tags.toLowerCase().split(",")) if (tagSet.has(t.trim())) score += 1;
      return { p, score, i };
    })
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, count)
    .map((x) => x.p);
};
