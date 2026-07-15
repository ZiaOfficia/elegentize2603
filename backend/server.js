const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const sequelize = require("./config/db");
// Import routes (to be created)
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  "https://elegantize.com",
  "https://elegantize.com/",
  "https://www.elegantize.com",
  "https://www.elegantize.com/",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Redirect broken/malformed URLs from the 404 list to the YouTube channel
app.use((req, res, next) => {
  const p = req.path;
  const q = req.query;
  if (
    p.includes("youtube.com") ||         // YouTube-appended URLs
    p.includes("https:/elegantize.com") || // malformed https:/ paths
    p.endsWith("/feed") ||               // /feed/ URLs
    p.endsWith("/feed/") ||
    q.amp === "1" ||                     // ?amp=1
    q.et_blog !== undefined ||           // ?et_blog
    q.noamp === "mobile"                 // ?noamp=mobile
  ) {
    return res.redirect(301, "https://www.youtube.com/@elegantize");
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

// Dynamic Sitemap
app.get("/sitemap.xml", async (req, res) => {
  try {
    const BlogPost = require("./models/BlogPost");
    const posts = await BlogPost.findAll({
      attributes: ["slug", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
    });

    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/about", priority: "0.8", changefreq: "monthly" },
      { loc: "/services", priority: "0.9", changefreq: "monthly" },
      { loc: "/services/floral-design", priority: "0.8", changefreq: "monthly" },
      { loc: "/services/ceiling-design", priority: "0.8", changefreq: "monthly" },
      { loc: "/services/centerpiece-design", priority: "0.8", changefreq: "monthly" },
      { loc: "/services/vinyl-floor-wrap", priority: "0.8", changefreq: "monthly" },
      { loc: "/services/ceremony-decor", priority: "0.8", changefreq: "monthly" },
      { loc: "/services/draping-services", priority: "0.8", changefreq: "monthly" },
      { loc: "/services/mandap-design", priority: "0.8", changefreq: "monthly" },
      { loc: "/services/stage-design", priority: "0.8", changefreq: "monthly" },
      { loc: "/gallery", priority: "0.8", changefreq: "weekly" },
      { loc: "/portfolio", priority: "0.8", changefreq: "monthly" },
      { loc: "/blog", priority: "0.7", changefreq: "weekly" },
      { loc: "/contact", priority: "0.8", changefreq: "monthly" },
      { loc: "/faq", priority: "0.6", changefreq: "monthly" },
    ];

    const BASE = "https://elegantize.com";

    // XML-encode a string so special characters don't break the sitemap.
    const xmlEncode = (str) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    // Validate that a slug is safe to include in a URL.
    // Rejects: empty, contains spaces, contains ":" (unresolved CMS variables),
    // still has a date prefix (should have been cleaned by fixSlugs.js).
    const isValidSlug = (slug) => {
      if (!slug || slug.trim() === "") return false;
      if (/\s/.test(slug)) return false;          // spaces → broken URL
      if (/:/.test(slug)) return false;            // "slug: …" artifact
      if (/^\d{4}-\d{2}-\d{2}-/.test(slug)) return false; // date prefix not yet cleaned
      return true;
    };

    const staticUrls = staticPages
      .map(
        (p) => `  <url>
    <loc>${BASE}${xmlEncode(p.loc)}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
      )
      .join("\n");

    const seenUrls = new Set();
    const blogUrlEntries = [];

    for (const post of posts) {
      const rawSlug = post.slug.replace(/^\/+/, "").trim().toLowerCase();

      if (!isValidSlug(rawSlug)) {
        console.warn(`[sitemap] Skipping malformed slug: "${post.slug}"`);
        continue;
      }

      const d = new Date(post.createdAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const lastmod = new Date(post.updatedAt).toISOString().split("T")[0];
      const loc = `${BASE}/${year}/${month}/${day}/${xmlEncode(rawSlug)}`;

      // Skip exact duplicate URLs (e.g. two posts with same date + slug)
      if (seenUrls.has(loc)) {
        console.warn(`[sitemap] Skipping duplicate URL: ${loc}`);
        continue;
      }
      seenUrls.add(loc);

      blogUrlEntries.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${blogUrlEntries.join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("[sitemap] Error generating sitemap:", err.message);
    res.status(500).send("Error generating sitemap");
  }
});

// Database Connection and Sync
sequelize
  .authenticate()
  .then(async () => {
    console.log("MySQL Database Connected...");

    // Fix id column: upgrade to BIGINT (INT counter was overflowed by failed UUID inserts)
    await sequelize.query(
      "ALTER TABLE BlogPosts MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT"
    ).catch((err) => console.log("ALTER id warning:", err.message));
    // Reset auto_increment to max(id)+1 in case counter is corrupted
    await sequelize.query(
      "SET @max_id = (SELECT COALESCE(MAX(id), 0) + 1 FROM BlogPosts); ALTER TABLE BlogPosts AUTO_INCREMENT = @max_id;"
    ).catch(() => sequelize.query(
      "ALTER TABLE BlogPosts AUTO_INCREMENT = 1"
    ).catch((err) => console.log("AUTO_INCREMENT reset warning:", err.message)));
    console.log("id column upgraded to BIGINT, AUTO_INCREMENT reset");

    // Drop ALL duplicate slug unique indexes (sync alter adds a new one every restart)
    const [indexes] = await sequelize.query(
      "SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME='BlogPosts' AND TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='slug' AND INDEX_NAME != 'PRIMARY'"
    ).catch(() => [[]]);
    const indexNames = indexes.map((r) => r.INDEX_NAME);
    console.log(`Found ${indexNames.length} slug indexes:`, indexNames);
    // Keep one, drop the rest
    for (let i = 1; i < indexNames.length; i++) {
      await sequelize.query(
        `ALTER TABLE \`BlogPosts\` DROP INDEX \`${indexNames[i]}\``
      ).catch((err) => console.log(`DROP INDEX warning: ${err.message}`));
    }
    if (indexNames.length > 1) {
      console.log(`Cleaned up ${indexNames.length - 1} duplicate slug indexes`);
    }

    // Repair table to fix any metadata corruption from too-many-keys errors
    await sequelize.query("REPAIR TABLE `BlogPosts`")
      .then(([r]) => console.log("REPAIR TABLE:", r[0]?.Msg_text))
      .catch((err) => console.log("REPAIR warning:", err.message));

    // Use sync without alter to prevent duplicate index buildup
    await sequelize.sync();
    console.log("Database Synced");
  })
  .catch((err) => console.log("Error: " + err));

// Serve static assets in production
if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging") {
  // Check if dist folder exists (it won't on Render if only deploying backend)
  const distPath = path.join(__dirname, "dist");

  if (fs.existsSync(distPath)) {
    // Set static folder
    app.use(express.static(distPath));

    // Any other route that isn't an API route should be handled by the React app
    app.get(/(.*)/, (req, res) => {
      // Check if the request is for an API endpoint to avoid returning HTML for 404 API calls
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ message: "API Endpoint not found" });
      }

      // Check if dist/index.html exists before sending it
      const indexPath = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).send("Frontend build found but index.html is missing.");
      }
    });
  } else {
    // API-Only Mode (e.g. Render Backend)
    app.get("/", (req, res) => {
      res.send("Elegantize Backend API Running (No Frontend Build Found)");
    });
  }
} else {
  app.get("/", (req, res) => {
    res.send("Elegantize Backend Running (Dev Mode)");
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
