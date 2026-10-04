import { NextResponse } from "next/server";
import { getAllBlogs } from "@/lib/blogsServer";

// GET /api/blogs — a short summary of every post, newest first. Used by the
// navbar notification bell, which runs in the browser and so can't read the
// posts itself. Cached briefly so it isn't a database read per page view.
export async function GET() {
  const posts = await getAllBlogs();
  return NextResponse.json(
    posts.map(({ slug, title, date, publishedAt }) => ({
      slug,
      title,
      date,
      publishedAt,
    })),
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
