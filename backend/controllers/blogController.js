const BlogPost = require("../models/BlogPost");

// Slugs must never start or end with "/" or spaces. A trailing "/" typed in the
// admin panel made /2026/10/17/wedding-decor-cost-long-island show
// "Article Not Found" and broke the prerender build.
const cleanSlugOf = (slug = "") => String(slug).trim().replace(/^\/+|\/+$/g, "").trim();

// Trigger GitHub Actions sitemap workflow after blog changes
async function triggerSitemapUpdate() {
  try {
    const token = process.env.GITHUB_PAT;
    if (!token) return;
    const res = await fetch(
      "https://api.github.com/repos/ZiaOfficia/elegentize2603/actions/workflows/sitemap.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );
    if (res.ok) {
      console.log("Sitemap update triggered successfully");
    } else {
      console.error("Sitemap trigger failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Failed to trigger sitemap update:", err.message);
  }
}

// @desc Get all blogs (with pagination)
// @route GET /api/blogs?page=1&limit=10
// @access Public
const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const whereClause = search
      ? {
          [require("sequelize").Op.or]: [
            { title: { [require("sequelize").Op.like]: `%${search}%` } },
            { category: { [require("sequelize").Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const totalCount = await BlogPost.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / limit);

    const blogs = await BlogPost.findAll({
      where: whereClause,
      attributes: { exclude: ["content"] },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single blog by ID
// @route GET /api/blogs/id/:id
// @access Public
const getBlogById = async (req, res) => {
  try {
    const blog = await BlogPost.findByPk(req.params.id);
    if (blog) {
      res.json(blog);
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single blog by slug
// @route GET /api/blogs/:slug
// @access Public
const getBlogBySlug = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const cleanSlug = cleanSlugOf(req.params.slug);
    // Older posts may be stored with a stray leading or trailing "/"
    const blog = await BlogPost.findOne({
      where: { slug: { [Op.in]: [cleanSlug, `/${cleanSlug}`, `${cleanSlug}/`, `/${cleanSlug}/`] } },
    });
    if (blog) {
      res.json(blog);
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a new blog
// @route POST /api/blogs
// @access Private
const createBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      author,
      category,
      tags,
      image_url,
      image_alt_text,
      meta_title,
      meta_description,
      meta_keywords,
    } = req.body;

    const blog = await BlogPost.create({
      title,
      slug: cleanSlugOf(slug),
      excerpt,
      content,
      author,
      category,
      tags,
      image_url,
      image_alt_text,
      meta_title,
      meta_description,
      meta_keywords,
    });

    res.status(201).json(blog);

    // Trigger sitemap update in background (non-blocking)
    triggerSitemapUpdate();
  } catch (error) {
    console.error("Blog create error:", error.name, error.message, error.fields, "errno:", error.original?.errno, "sqlState:", error.original?.sqlState);
    const isDuplicateSlug =
      error.name === "SequelizeUniqueConstraintError" &&
      error.fields?.slug !== undefined;
    res.status(400).json({
      message: isDuplicateSlug
        ? "A post with this slug already exists. Please use a different slug."
        : `${error.name}: ${error.message}`,
    });
  }
};

// @desc Update a blog
// @route PUT /api/blogs/:id
// @access Private
const updateBlog = async (req, res) => {
  try {
    const blog = await BlogPost.findByPk(req.params.id);

    if (blog) {
      const updateData = { ...req.body };
      if (updateData.slug) updateData.slug = cleanSlugOf(updateData.slug);
      await blog.update(updateData);
      res.json(blog);

      // Trigger sitemap update in background (non-blocking)
      triggerSitemapUpdate();
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Delete a blog
// @route DELETE /api/blogs/:id
// @access Private
const deleteBlog = async (req, res) => {
  try {
    const blog = await BlogPost.findByPk(req.params.id);

    if (blog) {
      await blog.destroy();
      res.json({ message: "Blog removed" });

      // Trigger sitemap update in background (non-blocking)
      triggerSitemapUpdate();
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBlogs,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
};
