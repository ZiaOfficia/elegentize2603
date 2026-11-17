import { Search, Facebook, Instagram, Youtube } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "../common/Button";
import {
  allPosts,
  formatPostDate,
  getBlogPostUrl,
  FALLBACK_POST_IMAGE,
} from "../../data/blogData";

export const BlogSidebar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const recentPosts = allPosts.slice(0, 4);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/blog?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="space-y-12 relative">
      {/* Search */}
      <div className="bg-stone-50 p-6 border border-stone-200">
        <h3 className="font-display text-xl mb-4">Search</h3>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 pl-4 pr-10 py-3 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
          >
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Recent Posts */}
      <div className="bg-stone-50 p-6 border border-stone-200">
        <h3 className="font-display text-xl mb-6">Recent Posts</h3>
        <div className="space-y-6">
          {recentPosts.map((post) => (
            <Link
              key={post.slug}
              to={getBlogPostUrl(post.slug, post.createdAt)}
              className="flex gap-4 group"
            >
              <div className="w-20 h-20 shrink-0 overflow-hidden">
                <img
                  loading="lazy"
                  decoding="async"
                  src={post.image || FALLBACK_POST_IMAGE}
                  alt={post.imageAlt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-display text-sm leading-tight text-gray-900 group-hover:text-primary transition-colors break-words">
                  {post.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {formatPostDate(post.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories (Optional, adding for completeness) */}
      {/* <div className="bg-stone-50 p-6 border border-stone-200">
        <h3 className="font-display text-xl mb-4">Categories</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="hover:text-primary cursor-pointer transition-colors border-b border-gray-100 pb-2 flex justify-between">
            <span>Wedding Trends</span>
            <span className="text-gray-400">(4)</span>
          </li>
          <li className="hover:text-primary cursor-pointer transition-colors border-b border-gray-100 pb-2 flex justify-between">
            <span>Floral Design</span>
            <span className="text-gray-400">(2)</span>
          </li>
          <li className="hover:text-primary cursor-pointer transition-colors border-b border-gray-100 pb-2 flex justify-between">
            <span>Lighting & Decor</span>
            <span className="text-gray-400">(3)</span>
          </li>
          <li className="hover:text-primary cursor-pointer transition-colors pb-2 flex justify-between">
            <span>Planning Tips</span>
            <span className="text-gray-400">(5)</span>
          </li>
        </ul>
      </div> */}

      {/* Get In Touch */}
      <div className="bg-stone-900 text-white p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="font-display text-2xl mb-2">Need Advice?</h3>
          <p className="text-stone-400 text-sm mb-6 leading-relaxed">
            Planning a luxury wedding? Let our expert team guide you through the
            design process.
          </p>
          <Link to="/contact">
            <Button variant="outline" className="w-full">
              Get In Touch
            </Button>
          </Link>
        </div>
      </div>

      {/* Socials */}
      <div>
        <h3 className="font-display text-xl mb-4">Follow Us</h3>
        <div className="flex gap-4">
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/people/Elegantize-Productions/100083099336478/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-stone-100 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-all duration-300 rounded-full"
            >
              <Facebook size={18} />
            </a>
            <a
              href="https://www.instagram.com/elegantizeevents/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-stone-100 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-all duration-300 rounded-full"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://in.pinterest.com/elegantizeevents/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-stone-100 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-all duration-300 rounded-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="shrink-0"
              >
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.399.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.173 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.246.957-.899 2.152-1.341 2.889.36.109.734.166 1.117.166 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.62 0 12.017 0z" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@elegantize"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-stone-100 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-all duration-300 rounded-full"
            >
              <Youtube size={18} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
