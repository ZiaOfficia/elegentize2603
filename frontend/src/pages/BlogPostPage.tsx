import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { SEO } from "../components/common/SEO";

import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Tag,
  Facebook,
  Twitter,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { BlogPostFull } from "../data/blogData";
import {
  findPost,
  formatPostDate,
  getBlogPostUrl,
  FALLBACK_POST_IMAGE,
} from "../data/blogData";
import { RelatedPosts } from "../components/blog/RelatedPosts";
import { HorizontalEnquiryForm } from "../components/common/HorizontalEnquiryForm";
import { ContactSection } from "../components/sections/ContactSection";
import NotFound from "./NotFound";

/** Same clean-up the site has always applied to post bodies. */
const cleanContent = (html: string) =>
  html
    .replace(/\u00AD/g, "") // soft hyphens
    .replace(/&shy;/gi, "")
    .replace(/<wbr\s*\/?>/gi, "")
    .replace(/[\u200B\u200C\u200D]/g, "") // zero-width characters
    .replace(/\s+style\s*=\s*"[^"]*"/gi, "") // inline styles
    .replace(/\s+style\s*=\s*'[^']*'/gi, "");

/** Rough reading time at 220 words per minute. */
const readingMinutes = (html: string) =>
  Math.max(
    1,
    Math.round(html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 220),
  );

export const BlogPostPage = () => {
  const { slug = "" } = useParams<{
    year?: string;
    month?: string;
    day?: string;
    slug: string;
  }>();
  const { pathname } = useLocation();
  const summary = findPost(slug);
  const [full, setFull] = useState<BlogPostFull | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!summary) return;
    let cancelled = false;
    fetch(`/blog-data/${summary.slug}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: BlogPostFull) => {
        if (!cancelled) setFull({ ...data, content: cleanContent(data.content) });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [summary]);

  if (!summary) return <NotFound />;

  // One address per post: old links with a drifted date or /blog/<slug>
  // are sent to the canonical date URL (the same one in sitemap.xml).
  const canonicalPath = getBlogPostUrl(summary.slug, summary.createdAt);
  if (pathname.replace(/\/+$/, "") !== canonicalPath) {
    return <Navigate to={canonicalPath} replace />;
  }

  const post = {
    ...summary,
    content: full?.content ?? "",
    metaKeywords: full?.metaKeywords ?? "",
    image: summary.image || FALLBACK_POST_IMAGE,
    date: formatPostDate(summary.createdAt),
  };

  return (
    <div className="pt-[60px] md:pt-[50px] pb-24 bg-white">
      <SEO
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        keywords={post.metaKeywords || undefined}
        image={post.image}
        url={canonicalPath}
        type="article"
        article={{
          publishedAt: post.createdAt,
          modifiedAt: post.updatedAt,
          author: post.author,
        }}
      />
      <div className="max-w-4xl mx-auto px-6 mb-12 text-center">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500 mb-6 font-medium">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/blog" className="hover:text-primary transition-colors">
            Journal
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 truncate max-w-[200px]">
            {post.title}
          </span>
        </div>

        {/* Category */}
        <span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-900 text-[10px] uppercase tracking-widest font-bold mb-6 rounded-full">
          {post.category}
        </span>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-gray-900 leading-tight mb-8">
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-gray-500 text-sm font-medium border-t border-b border-gray-100 py-6">
          <span className="flex items-center gap-2">
            <User size={16} className="text-primary" />
            <span className="text-gray-900">{post.author}</span>
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
          <span className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <time dateTime={post.createdAt.slice(0, 10)}>{post.date}</time>
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
          <span className="flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            <span>
              {post.content ? readingMinutes(post.content) : 5} min read
            </span>
          </span>
        </div>
      </div>

      {/* Featured Image */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-16">
        <div className="w-full overflow-hidden rounded-2xl shadow-sm">
          <img
            loading="eager"
            fetchPriority="high"
            decoding="async"
            src={post.image}
            alt={post.imageAlt}
            className="w-full h-auto"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-24">
        {/* Main Content */}
        <article
          className="w-full"
          data-content-ready={post.content ? "true" : undefined}
        >
          {!post.content && (
            <p className="text-center text-gray-400 py-12">
              {loadError
                ? "Sorry, this article could not be loaded. Please refresh the page."
                : "Loading article..."}
            </p>
          )}
          {/* Content Injection */}
          <div
            className="prose prose-lg prose-stone w-full max-w-none wrap-break-word [hyphens:none] [word-break:normal]
                        prose-headings:font-display prose-headings:font-normal prose-headings:text-gray-900
                        prose-p:font-sans prose-p:text-gray-700 prose-p:leading-loose prose-p:mb-6
                        prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                        prose-strong:font-semibold prose-strong:text-gray-900
                        prose-ul:list-disc prose-ul:font-sans prose-ul:text-gray-700 prose-ul:pl-6 prose-ul:ml-4 [&_ul]:list-disc [&_ul]:list-outside! [&_ul]:pl-6
                        prose-ol:list-decimal prose-ol:font-sans prose-ol:text-gray-700 prose-ol:pl-6 prose-ol:ml-4 [&_ol]:list-decimal [&_ol]:list-outside! [&_ol]:pl-6
                        prose-li:marker:text-primary prose-li:my-2 [&_li]:list-item [&_li]:ml-4
                        prose-img:rounded-xl prose-img:shadow-md prose-img:w-full prose-img:h-auto prose-img:my-10
                        [&_img]:my-10! [&_img]:block!
                        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-gray-50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:my-8 prose-blockquote:not-italic prose-blockquote:font-display prose-blockquote:text-xl prose-blockquote:text-gray-800
                        **:max-w-full! **:min-w-0!
                        [&_iframe]:w-full [&_video]:w-full"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Social Share & Tags */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 uppercase tracking-widest mr-2">
                  <Tag size={16} /> Tags:
                </div>
                {(post.tags
                  ? post.tags
                      .split(",")
                      .map((t: string) => t.trim())
                      .filter(Boolean)
                  : [post.category]
                ).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-50 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors cursor-default"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-900">Share:</span>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                          window.location.href,
                        )}`,
                        "_blank",
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all"
                  >
                    <Facebook size={16} />
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                          window.location.href,
                        )}&text=${encodeURIComponent(post.title)}`,
                        "_blank",
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white transition-all"
                  >
                    <Twitter size={16} />
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                          window.location.href,
                        )}&title=${encodeURIComponent(post.title)}`,
                        "_blank",
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-all"
                  >
                    <span className="font-bold text-xs">in</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Link
              to="/blog"
              className="inline-flex items-center text-primary font-bold hover:underline"
            >
              <ArrowLeft size={16} className="mr-2" /> Back to Journal
            </Link>
          </div>
        </article>
      </div>

      <RelatedPosts slug={post.slug} />
      <HorizontalEnquiryForm />
      <ContactSection />
    </div>
  );
};
