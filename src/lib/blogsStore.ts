import { initializeApp, getApps } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";
import { BLOGS, type BlogPost } from "./blogs";

// Reads posts published from /admin (the `blogs` Firestore collection, which
// firestore.rules makes publicly readable) and merges them with the posts
// written in blogs.ts. Works on both the server and in the browser. It uses
// its own small Firebase app so server rendering never pulls in Auth.

const APP_NAME = "blogs-reader";
const READ_TIMEOUT_MS = 5000;

function getDb() {
  const app =
    getApps().find((a) => a.name === APP_NAME) ??
    initializeApp(
      {
        apiKey: firebaseConfigJson.apiKey,
        authDomain: firebaseConfigJson.authDomain,
        projectId: firebaseConfigJson.projectId,
        appId: firebaseConfigJson.appId,
      },
      APP_NAME,
    );
  return getFirestore(app, firebaseConfigJson.firestoreDatabaseId);
}

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
      getDocs(collection(getDb(), "blogs")),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), READ_TIMEOUT_MS),
      ),
    ]);
    return snap.docs
      .map((d) => toPost(d.id, d.data()))
      .filter((p): p is BlogPost => p !== null);
  } catch {
    // Offline, rules not deployed yet, etc. — the built-in posts still show.
    return [];
  }
}

// Every post, newest first.
export async function getAllBlogs(): Promise<BlogPost[]> {
  const stored = await fetchStoredBlogs();
  const builtInSlugs = new Set(BLOGS.map((b) => b.slug));
  return [...stored.filter((p) => !builtInSlugs.has(p.slug)), ...BLOGS].sort(
    (a, b) => (a.publishedAt < b.publishedAt ? 1 : -1),
  );
}
