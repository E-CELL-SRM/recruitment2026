import { NextRequest, NextResponse } from "next/server";
import { isValidAdminPassword } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { UPLOAD_ID, deleteUploadChunks } from "@/lib/uploadChunks";

// ---------------------------------------------------------------------
// POST /api/admin/blog-upload   (multipart/form-data)
//
// Hosts like Vercel reject request bodies over ~4.5 MB, so the admin page
// sends a blog PDF in small pieces. Each piece is parked in the private
// `uploadChunks` Firestore collection until /api/admin/blogs reads the whole
// PDF back with the same uploadId.
//
//   password   the admin password
//   uploadId   a random id (UUID) chosen by the page for this PDF
//   intent     "chunk" (default) or "discard" (throw away a PDF's pieces)
//
// chunk:   index (0-based), total (number of pieces), chunk (the bytes)
// discard: total
// ---------------------------------------------------------------------

const MAX_CHUNK_BYTES = 900 * 1024; // Firestore documents are capped at 1 MiB
const MAX_CHUNKS = 20;
const STALE_MS = 60 * 60 * 1000;

const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form || !isValidAdminPassword(form.get("password"))) {
    return fail("Unauthorized", 401);
  }

  const uploadId = form.get("uploadId");
  const total = Number(form.get("total"));
  if (typeof uploadId !== "string" || !UPLOAD_ID.test(uploadId)) return fail("Bad upload id.");
  if (!Number.isInteger(total) || total < 1 || total > MAX_CHUNKS) return fail("Bad chunk count.");

  try {
    if (form.get("intent") === "discard") {
      await deleteUploadChunks(uploadId, total);
      return NextResponse.json({ ok: true });
    }

    const index = Number(form.get("index"));
    const chunk = form.get("chunk");
    if (!Number.isInteger(index) || index < 0 || index >= total) return fail("Bad chunk index.");
    if (!(chunk instanceof File)) return fail("Missing chunk.");
    if (chunk.size > MAX_CHUNK_BYTES) return fail("Chunk too large.", 413);

    const db = getAdminDb();
    const col = db.collection("uploadChunks");

    // Tidy up pieces left behind by uploads that were never finished.
    if (index === 0) {
      const stale = await col
        .where("createdAt", "<", Date.now() - STALE_MS)
        .limit(100)
        .get();
      if (!stale.empty) {
        const batch = db.batch();
        stale.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }

    await col.doc(`${uploadId}-${index}`).set({
      data: Buffer.from(await chunk.arrayBuffer()),
      createdAt: Date.now(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("blog upload chunk failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
