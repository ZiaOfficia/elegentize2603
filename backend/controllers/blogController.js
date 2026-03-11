const BlogPost = require("../models/BlogPost");

// @desc    Get all blogs (with pagination)
// @route   GET /api/blogs?page=1&limit=10
// @access  Public
const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    // Build where clause for search
    const whereClause = search
      ? {
          [require("sequelize").Op.or]: [
            { title: { [require("sequelize").Op.like]: `%${search}%` } },
            { category: { [require("sequelize").Op.like]: `%${search}%` } },
          ],
        }
      : {};

    // Get total count for pagination
    const totalCount = await BlogPost.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated blogs
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

// @desc    Get single blog by ID
// @route   GET /api/blogs/id/:id
// @access  Public
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

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await BlogPost.findOne({ where: { slug: req.params.slug } });
    if (blog) {
      res.json(blog);
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new blog
// @route   POST /api/blogs
// @access  Private
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
    });

    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private
const updateBlog = async (req, res) => {
  try {
    const blog = await BlogPost.findByPk(req.params.id);

    if (blog) {
      await blog.update(req.body);
      res.json(blog);
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private
const deleteBlog = async (req, res) => {
  try {
    const blog = await BlogPost.findByPk(req.params.id);

    if (blog) {
      await blog.destroy();
      res.json({ message: "Blog removed" });
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
