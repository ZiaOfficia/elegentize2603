export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Full HTML/Markdown content
  image: string;
  date: string;
  author: string;
  category: string;
  tags?: string; // Comma-separated tags
  createdAt?: string; // Raw ISO date for URL generation
}

/**
 * Generate a WordPress-style date-based URL for a blog post.
 * e.g., /2026/01/21/ceiling-installation-wedding-nyc-2026
 *
 * The date segments MUST be derived in UTC. Local-time getters resolve the
 * date in the viewer's own timezone, so a post created near midnight UTC
 * produces one URL for a visitor in Delhi and a different one for Googlebot.
 * That mismatch is what generated the duplicate off-by-one-day permalinks
 * reported as soft 404s in Search Console.
 *
 * scripts/generate-sitemap.js must use identical UTC logic. Keep them in sync.
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
  // Fallback if no createdAt
  return `/blog/${cleanSlug}`;
};

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "10-trending-wedding-themes-2024",
    title: "10 Trending Wedding Themes for 2024",
    excerpt:
      "Discover the most popular wedding aesthetics taking over this year, from quiet luxury to maximalist blooms.",
    content: `
      <p>As we step into 2024, wedding aesthetics are shifting towards a blend of timeless elegance and bold personal statements. Here are the top trends we're seeing:</p>
      <h3>1. Quiet Luxury</h3>
      <p>Think understated opulence. Monochromatic color palettes, high-quality fabrics, and minimalist floral arrangements that speak volumes through texture rather than volume.</p>
      <h3>2. Maximalist Blooms</h3>
      <p>On the other end of the spectrum, many couples are opting for "more is more" with lush, overflowing floral installations that transform venues into secret gardens.</p>
      <h3>3. Sustainable Celebrations</h3>
      <p>Eco-conscious choices are no longer a niche but a standard. From locally sourced menus to digital invitations, sustainability is stylish.</p>
      <p>Whether you prefer the understated or the bold, the key for 2024 is authenticity—making choices that truly reflect your journey as a couple.</p>
    `,
    image: "/images/gallery/dsc00360.webp",
    date: "Feb 10, 2024",
    author: "Sarah Jenkins",
    category: "Trends",
  },
  {
    id: "2",
    slug: "choose-perfect-floral-arrangements",
    title: "How to Choose the Perfect Floral Arrangements",
    excerpt:
      "A comprehensive guide to selecting flowers that match your venue, season, and personal style.",
    content: `
      <p>Flowers are the heart of wedding decor. They set the tone, create fragrance, and add life to any space. But with so many options, how do you choose?</p>
      <h3>Consider Your Venue</h3>
      <p>A rustic barn calls for wildflowers and loose greenery, while a grand ballroom demands structured centerpieces and tall arrangements.</p>
      <h3>Seasonal Selection</h3>
      <p>Peonies in spring, Dahlias in late summer. Choosing in-season blooms ensures freshness and helps stay within budget.</p>
      <p>Don't be afraid to mix textures—pairing soft roses with architectural tropicals creates a modern visual interest.</p>
    `,
    image: "/images/gallery/dsc01108.webp",
    date: "Jan 25, 2024",
    author: "Elena Rodriguez",
    category: "Floral Design",
  },
  {
    id: "3",
    slug: "outdoor-wedding-lighting-tips",
    title: "Outdoor Wedding Lighting Tips",
    excerpt:
      "Create a magical ambiance with these essential lighting ideas for your open-air celebration.",
    content: `
      <p>When the sun goes down, lighting becomes the most critical decor element of your outdoor wedding.</p>
      <h3>Fairy Lights & Canopies</h3>
      <p>Draping string lights above dining tables creates an intimate, star-like ceiling that feels cozy even in a vast field.</p>
      <h3>Uplighting Trees</h3>
      <p>Don't ignore nature! Uplighting surrounding trees adds depth and drama to the perimeter of your reception.</p>
    `,
    image: "/images/gallery/dsc05988.webp",
    date: "Jan 12, 2024",
    author: "Michael Chang",
    category: "Lighting",
  },
  {
    id: "4",
    slug: "modern-minimalist-decor",
    title: "The Art of Modern Minimalist Decor",
    excerpt:
      "Why less is often more when it comes to creating a sophisticated wedding atmosphere.",
    content:
      "<p>Minimalism isn't about emptiness; it's about intentionality. Learn how to curate a space that feels open, airy, and incredibly chic.</p>",
    image: "/images/portfolio/whatsapp-image-2023-09-27-at-12.17.56-1.webp",
    date: "Dec 30, 2023",
    author: "Sarah Jenkins",
    category: "Decor",
  },
  {
    id: "5",
    slug: "luxury-table-settings",
    title: "Elevating Your Table Settings",
    excerpt:
      "From chargers to napkin rings, details regarding luxury table settings that impress guests.",
    content:
      "<p>The table is where your guests spend most of their evening. Elevate their experience with textured linens, crystal glassware, and bespoke menus.</p>",
    image: "/images/portfolio/dsc00122-1.webp",
    date: "Dec 15, 2023",
    author: "Elena Rodriguez",
    category: "Table scapes",
  },
  {
    id: "6",
    slug: "south-asian-wedding-mandaps",
    title: "Stunning Mandap Designs for 2024",
    excerpt:
      "A look at the most breathtaking Mandap structures we've designed for South Asian weddings.",
    content:
      "<p>The Mandap is the sacred center of a South Asian wedding. We explore designs ranging from traditional florals to modern acrylic structures.</p>",
    image: "/images/portfolio/kiranfritdjof-weddingphotos-1135-1.webp",
    date: "Nov 28, 2023",
    author: "Elegantize Team",
    category: "Ceremony",
  },
  {
    id: "7",
    slug: "winter-wonderland-weddings",
    title: "Creating a Winter Wonderland",
    excerpt:
      "Embrace the chill with cozy, elegant decor themes perfect for winter nuptials.",
    content:
      "<p>Velvet linens, candlelight, and white blooms can turn a cold day into a warm, romantic celebration.</p>",
    image: "/images/gallery/dsc09950-1.webp",
    date: "Nov 10, 2023",
    author: "Michael Chang",
    category: "Seasonal",
  },
  {
    id: "8",
    slug: "pantone-color-year-wedding",
    title: "Incorporating Pantone's Color of the Year",
    excerpt:
      "How to subtly—or boldly—weave the trendiest colors into your wedding palette.",
    content:
      "<p> Peach Fuzz was the color of the year. Here is how we used it in bouquets, napkins, and lighting washes.</p>",
    image: "/images/portfolio/whatsapp-image-2023-09-27-at-12.17.56-1.webp",
    date: "Oct 25, 2023",
    author: "Sarah Jenkins",
    category: "Trends",
  },
  {
    id: "9",
    slug: "lighting-transforms-spaces",
    title: "How Lighting Transforms Spaces",
    excerpt:
      "Before and after examples showing the dramatic impact of professional lighting.",
    content:
      "<p>Lighting is the paintbrush of event design. See how we turned a dark hall into a vibrant party space.</p>",
    image: "/images/gallery/dsc05988.webp",
    date: "Oct 12, 2023",
    author: "Michael Chang",
    category: "Lighting",
  },
  {
    id: "10",
    slug: "destination-wedding-logistics",
    title: "Logistics of Decor for Destination Weddings",
    excerpt:
      "What you need to know about bringing your dream vision to a faraway location.",
    content:
      "<p>Transporting custom builds and sourcing local flowers requires precision planning. Here is our checklist.</p>",
    image: "/images/portfolio/kiranfritdjof-weddingphotos-1135-1.webp",
    date: "Sep 30, 2023",
    author: "Elegantize Team",
    category: "Planning",
  },
];
