import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "../../data/blogData";
import { getBlogPostUrl } from "../../data/blogData";

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard = ({ post }: BlogCardProps) => {
  return (
    <article className="group border border-primary p-4 border-r-3 rounded-lg h-full flex flex-col bg-white">
      <Link
        to={getBlogPostUrl(post.slug, post.createdAt)}
        className="block overflow-hidden mb-6 aspect-[3/2] relative rounded-md"
      >
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
        <img loading="lazy" decoding="async"
          src={post.image}
          alt={post.imageAlt || post.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-4 uppercase tracking-widest">
        <span>{post.date}</span>
        <span className="w-px h-3 bg-gray-300"></span>
        <span className="text-primary font-medium">{post.category}</span>
      </div>

      <Link
        to={getBlogPostUrl(post.slug, post.createdAt)}
        className="block mb-3"
      >
        <h2 className="text-xl md:text-2xl font-display text-gray-900 group-hover:text-primary transition-colors leading-tight line-clamp-2">
          {post.title}
        </h2>
      </Link>

      <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3 text-sm md:text-base flex-grow">
        {post.excerpt}
      </p>

      <Link
        to={getBlogPostUrl(post.slug, post.createdAt)}
        className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-primary hover:text-stone-900 transition-colors"
      >
        <span>Read Full Article</span>
        <ArrowRight
          size={16}
          className="ml-2 group-hover:translate-x-1 transition-transform"
        />
      </Link>
    </article>
  );
};
