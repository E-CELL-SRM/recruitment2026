import { getAdminDb } from "./firebaseAdmin";
import { BLOGS, type BlogPost } from "./blogs";

// Server-only: reads the posts published from /admin (the `blogs` Firestore
// collection) with the service account — so it works without any public
// Firestore rule — and merges them with the posts written in blogs.ts.
// Never import this from client code; the browser gets posts via /api/blogs.

const READ_TIMEOUT_MS = 8000;

const isString = (v: unknown): v is string => typeof v === "string";

function toPost(slug: string, d: Record<string, unknown>): BlogPost | null {
  if (!isString(d.title) || !isString(d.image) || !Array.isArray(d.body)) {
    return null;
  }
  return {
    slug,
    title: d.title,
    excerpt: isString(d.excerpt) ? d.excerpt : "",
    date: isString(d.date) ? d.date : "",
    publishedAt: isString(d.publishedAt) ? d.publishedAt : "",
    author: isString(d.author) ? d.author : "E-Cell SRMIST",
    tags: Array.isArray(d.tags) ? d.tags.filter(isString) : [],
    image: d.image,
    body: d.body as BlogPost["body"],
  };
}

async function fetchStoredBlogs(): Promise<BlogPost[]> {
  try {
    const snap = await Promise.race([
      getAdminDb().collection("blogs").get(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), READ_TIMEOUT_MS),
      ),
    ]);
    return snap.docs
      .map((d) => toPost(d.id, d.data()))
      .filter((p): p is BlogPost => p !== null);
  } catch (err) {
    // No service-account key (e.g. a fresh checkout), offline, etc. — the
    // built-in posts still show.
    console.error("Couldn't read published blogs:", err);
    return [];
  }
}

// Every post, newest first, each one once. The same PDF uploaded twice gets
// two slugs but the same title, so posts are also matched by title and only
// the newest copy is kept.
export async function getAllBlogs(): Promise<BlogPost[]> {
  const stored = await fetchStoredBlogs();
  const builtInSlugs = new Set(BLOGS.map((b) => b.slug));
  const sorted = [...stored.filter((p) => !builtInSlugs.has(p.slug)), ...BLOGS].sort(
    (a, b) => (a.publishedAt < b.publishedAt ? 1 : -1),
  );
  const seen = new Set<string>();
  return sorted.filter((p) => {
    const key = p.title.trim().toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
