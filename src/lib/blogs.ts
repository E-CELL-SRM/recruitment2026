// ---------------------------------------------------------------------
// Blog posts shown on /blogs. Add a new entry to BLOGS for each new post —
// newest first. The newest posts also surface in the navbar notification
// bell (see NotificationCenter), so a new entry here is all it takes to
// publish and announce a post.
// ---------------------------------------------------------------------

// A plain string is a paragraph; the objects give a post some structure.
export type BlogBlock =
  | string
  | { heading: string }
  | { takeaway: string }
  | { hashtags: string[] };

export interface BlogPost {
  // URL slug (/blogs/<slug>) — also used to track which posts were seen.
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
  // Cover image, served from /public (e.g. "/assets/hero.png").
  image: string;
  body: BlogBlock[];
}

export const BLOGS: BlogPost[] = [
  {
    slug: "ob-and-gob-quick-commerce",
    title:
      "From Scoops to Streams: How Ob & Gob Is Rewriting the FMCG Playbook on Quick Commerce",
    excerpt:
      "A sundae-in-a-can built for quick commerce — three startup lessons from Dairy Day's Ob & Gob.",
    date: "Oct 2, 2026",
    author: "E-Cell SRMIST",
    tags: ["Entrepreneurship", "Startups", "Quick Commerce"],
    image: "/assets/blog-ob-gob.jpg",
    body: [
      "Ice Creams — a dairy product, served in scoops, tubs or frozen on sticks, instantly bringing a smile to the face of a consumer. That is exactly how a frozen dessert has been performing in the markets for decades. But in 2026, with the influx of quick commerce, impulse cravings, and visual packaging, consumer habits have never been further apart from the traditional consumer habits the former dairy giants catered to. With lives speeding up, attention spans shortening, and quick commerce fundamentally reshaping consumer behavior, the handbook for distribution of goods most definitely needed an update.",
      "That is the gap where Ob & Gob steps in: a visually enthralling, premium sundae-in-a-can launched specifically to win on quick-commerce platforms like Zepto by ditching traditional FMCG distribution rules for a fresh entrepreneurial playbook. Building on decades of industry expertise, Dairy Day's leadership, spearheaded by founders M.N. Jaganath and A. Balaraju, recognized that capturing the modern, fast-moving consumer required incubating an entirely new, agile sub-brand designed around evolving retailing channels and primary consumer habits.",
      "Here are 3 core startup lessons behind Ob & Gob's strategy:",
      { heading: "1. Channel-First Product Design" },
      "Most brands start by building a product, and then scramble to market it. Ob & Gob took the exact opposite approach: they built a product specifically tailored for quick commerce.",
      {
        takeaway:
          "When launching a startup or new brand line, map out your core consuming population. Then trace out their habits. With the habits come into play the commercial platforms of choice. Designing for your primary distribution channel — from packaging to delivery resilience — gives you an immediate unfair advantage.",
      },
      { heading: "2. Differentiating on Experience, Not Just Category" },
      "Ice creams, as a product that has been ruling the markets for decades, do not fall under \"low turnover items\", but rather form a legacy category. Ob & Gob did not change the essential, chilling yet comfortable mouth-feel of an ice cream; they repositioned the product as a layered, textured \"sundae in a can\" — making the packaging visual, fun, sublimely premium and inherently shareable.",
      {
        takeaway:
          "In an already saturated and familiar market, competing on feature parity is a race to the bottom. Instead, compete on experience and positioning. Elevating a familiar product into a distinct ritual can pay back in heaps.",
      },
      { heading: "3. Intrapreneurship within Established Infrastructure" },
      "Ob & Gob shows the power of \"intrapreneurship\" — incubating an agile, fast-moving sub-brand backed by the manufacturing and supply chain engine of an established parent company (Dairy Day).",
      {
        takeaway:
          "Startups bring speed and brand voice; legacy players bring scale and supply chain strength. The sweetest spot in modern entrepreneurship often sits right at the intersection of both.",
      },
      { heading: "The Bottom Line" },
      "Whether you're building a standalone startup or launching a new product line within an existing enterprise, the game has changed. Winning requires speed, precise channel alignment, and an obsession with customer delight.",
      "What traditional category do you think is ripe for a quick-commerce disruption next? Let's discuss in the comments below! 👇",
      {
        hashtags: [
          "Entrepreneurship",
          "Startups",
          "QuickCommerce",
          "D2C",
          "ProductStrategy",
          "FMCG",
          "Innovation",
          "BuildInPublic",
        ],
      },
    ],
  },
  {
    slug: "welcome-to-the-ecell-blog",
    title: "Welcome to the E-Cell Blog",
    excerpt:
      "Updates, stories, and lessons from E-Cell SRMIST will land here first.",
    date: "Oct 2, 2026",
    author: "E-Cell SRMIST",
    tags: ["Announcement", "E-Cell"],
    image: "/assets/hero.png",
    body: [
      "This is the home for everything E-Cell SRMIST wants to say at more length than a social post allows — recruitment updates, event recaps, founder stories, and what we're learning along the way.",
      "Whenever a new post goes up, you'll see it show up under the bell in the header. Check back often.",
    ],
  },
];

export function getBlog(slug: string): BlogPost | undefined {
  return BLOGS.find((b) => b.slug === slug);
}
