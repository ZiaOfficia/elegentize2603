import { Button } from "../common/Button";
import { ArrowRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { BlogCard } from "../blog/BlogCard";
import { Link } from "react-router-dom";
import { allPosts, toCard } from "../../data/blogData";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export const BlogSection = () => {
  const recentPosts = allPosts.slice(0, 3).map(toCard);

  if (recentPosts.length === 0) return null;

  return (
    <motion.section
      id="blog"
      className="py-24 px-6 bg-texture-floral"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <motion.p
              variants={itemVariants}
              className="text-primary text-xs font-bold uppercase tracking-widest mb-2"
            >
              From the Journal
            </motion.p>
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-5xl font-display text-gray-900"
            >
              Wedding Inspiration
            </motion.h2>
          </div>
          <motion.div variants={itemVariants} className="hidden md:block">
            <Link to="/blog">
              <Button variant="text" icon={ArrowRight}>
                View All Articles
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {recentPosts.map((post) => (
            <motion.div key={post.id} variants={itemVariants}>
              <BlogCard post={post} />
            </motion.div>
          ))}
        </div>

        <motion.div variants={itemVariants} className="mt-12 text-center">
          <Link to="/blog">
            <Button variant="primary" icon={ArrowRight}>
              Read All Blogs
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
};
