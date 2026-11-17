import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BlogSidebar } from "../components/blog/BlogSidebar";
import { BlogCard } from "../components/blog/BlogCard";
import { motion } from "framer-motion";
import {
  allPosts,
  formatPostDate,
  getBlogPostUrl,
  searchPosts,
  toCard,
} from "../data/blogData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SEO } from "../components/common/SEO";

const ITEMS_PER_PAGE = 10;

export const BlogListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const pageParam = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);

  const matches = useMemo(() => searchPosts(searchQuery), [searchQuery]);
  const totalPages = Math.max(1, Math.ceil(matches.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(pageParam, totalPages);
  const blogPosts = matches
    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    .map(toCard);
  const pagination = {
    currentPage,
    totalPages,
    totalCount: matches.length,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, searchQuery]);

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };

  // Generate page numbers for mobile (show limited pages)
  const getVisiblePages = () => {
    const { currentPage, totalPages } = pagination;
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      // Show all pages if 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="pt-15 md:pt-12.5 pb-24 px-4 md:px-6 bg-white">
      <SEO
        title="Wedding Blog - Trends & Inspiration"
        description="Explore our latest wedding stories, trends, decor tips, and expert advice to help you plan your dream wedding."
      />
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-16 text-center">
        <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4">
          Our Journal
        </p>
        <h1 className="text-4xl md:text-6xl font-display text-gray-900 mb-6">
          Wedding Inspiration & Tips
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Explore our latest stories, trends, and expert advice to help you plan
          your dream luxury wedding.
        </p>
        {searchQuery ? (
          <p className="text-sm text-gray-400 mt-4">
            {pagination.totalCount} article
            {pagination.totalCount === 1 ? "" : "s"} matching &ldquo;
            {searchQuery}&rdquo; &middot;{" "}
            <Link to="/blog" className="text-primary hover:underline">
              show all
            </Link>
          </p>
        ) : (
          <p className="text-sm text-gray-400 mt-4">
            {allPosts.length} articles
          </p>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
        {/* Main Content (Articles) */}
        <main className="lg:col-span-2">
          {blogPosts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No articles found.
            </div>
          ) : (
            <div className="space-y-12 md:space-y-16">
              {blogPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <BlogCard post={post} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination - Mobile Optimized */}
          {pagination.totalPages > 1 && (
            <div className="mt-12 md:mt-16">
              <div className="flex items-center justify-center gap-1 md:gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getVisiblePages().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="w-8 h-9 flex items-center justify-center text-gray-400 text-sm"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-sm font-medium rounded-lg border transition-all ${
                          pagination.currentPage === page
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Page Info */}
              <p className="text-center text-xs text-gray-400 mt-4">
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-32">
            <BlogSidebar />
          </div>
        </div>
      </div>

      {/* Full archive: plain links to every post, so every article is
          reachable from this page in the prerendered HTML Google reads. */}
      {!searchQuery && (
        <section className="max-w-7xl mx-auto mt-24 pt-12 border-t border-gray-100">
          <h2 className="text-2xl md:text-3xl font-display text-gray-900 mb-8">
            All Articles
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
            {allPosts.map((p) => (
              <li key={p.slug} className="flex gap-4 text-sm">
                <time
                  dateTime={p.createdAt.slice(0, 10)}
                  className="shrink-0 w-32 text-gray-400"
                >
                  {formatPostDate(p.createdAt)}
                </time>
                <Link
                  to={getBlogPostUrl(p.slug, p.createdAt)}
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
