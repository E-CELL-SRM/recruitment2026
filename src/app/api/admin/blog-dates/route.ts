import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isValidAdminPassword } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getAllBlogs } from "@/lib/blogsServer";
import { postDate } from "@/lib/dates";
import { BLOGS } from "@/lib/blogs";

// ---------------------------------------------------------------------
// POST /api/admin/blog-dates   (JSON)
//
//   password   the admin password
//   intent     "list" | "set"
//
// list: every post with its current date.
// set:  slug, dateMode ("auto" = today, "manual"), date (YYYY-MM-DD for
//       manual). Posts published from /admin get their `blogs` document
//       updated; the built-in posts (in blogs.ts) get an entry in
//       `blogDateOverrides` instead.
// ---------------------------------------------------------------------

const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !isValidAdminPassword(body.password)) return fail("Unauthorized", 401);

  try {
    if (body.intent === "list") {
      const posts = await getAllBlogs();
      return NextResponse.json({
        ok: true,
        posts: posts.map(({ slug, title, date, publishedAt }) => ({ slug, title, date, publishedAt })),
      });
    }

    if (body.intent === "set") {
      const slug = typeof body.slug === "string" ? body.slug : "";
      const when = postDate(body.dateMode, body.date);
      if (!when) return fail("Pick a valid date.");

      const db = getAdminDb();
      if (BLOGS.some((b) => b.slug === slug)) {
        await db.collection("blogDateOverrides").doc(slug).set(when);
      } else {
        const ref = db.collection("blogs").doc(slug);
        if (!slug || !(await ref.get()).exists) return fail("That post no longer exists.", 404);
        await ref.update(when);
      }
      revalidatePath("/blogs", "layout");
      return NextResponse.json({ ok: true, ...when });
    }

    return fail("Unknown request.");
  } catch (err) {
    console.error("blog dates failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
