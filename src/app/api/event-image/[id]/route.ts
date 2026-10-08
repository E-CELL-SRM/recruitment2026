import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

// GET /api/event-image/<id> — a photo uploaded with an event from /admin.
// Photos live in the (private) `eventImages` Firestore collection, so they're
// served through here with the Admin SDK. An id never changes what it points
// to, so responses can be cached for a long time.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[A-Za-z0-9]{1,40}$/.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const snap = await getAdminDb().collection("eventImages").doc(id).get();
    const data = snap.data();
    if (!data?.data) return new NextResponse("Not found", { status: 404 });

    return new NextResponse(new Uint8Array(data.data), {
      headers: {
        "Content-Type": data.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("event-image failed:", err);
    return new NextResponse("Unavailable", { status: 500 });
  }
}
