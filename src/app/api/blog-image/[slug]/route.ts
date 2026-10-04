import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

// GET /api/blog-image/<slug> — the cover image of a post published from
// /admin. The image lives in the (private) `blogImages` Firestore
// collection, so it's served through here with the Admin SDK.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const snap = await getAdminDb().collection("blogImages").doc(slug).get();
    const data = snap.data();
    if (!data?.data) return new NextResponse("Not found", { status: 404 });

    return new NextResponse(new Uint8Array(data.data), {
      headers: {
        "Content-Type": data.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("blog-image failed:", err);
    return new NextResponse("Unavailable", { status: 500 });
  }
}
