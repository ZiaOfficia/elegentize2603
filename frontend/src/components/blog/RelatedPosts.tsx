import { relatedPosts, toCard } from "../../data/blogData";
import { BlogCard } from "./BlogCard";

interface RelatedPostsProps {
  slug: string;
}

export const RelatedPosts = ({ slug }: RelatedPostsProps) => {
  const posts = relatedPosts(slug, 3).map(toCard);
  if (posts.length === 0) return null;

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-display text-gray-900 mb-8 border-l-4 border-primary pl-4">
          You Might Also Like
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};
