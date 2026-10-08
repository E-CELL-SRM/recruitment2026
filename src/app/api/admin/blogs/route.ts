import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isValidAdminPassword } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { slugify } from "@/lib/blogUtils";
import { parsePdfBlog } from "@/lib/pdfBlog";
import { BLOGS } from "@/lib/blogs";
import { postDate } from "@/lib/dates";
import { UPLOAD_ID, deleteUploadChunks, readUploadChunks } from "@/lib/uploadChunks";
import sharp from "sharp";

// ---------------------------------------------------------------------
// POST /api/admin/blogs   (multipart/form-data)
//
//   password   the admin password (checked here, on the server)
//   file       the blog post as a PDF — or, for big PDFs, uploadId +
//              uploadChunks (see /api/admin/blog-upload)
//   dryRun     "1" to only read the PDF and return a preview
//   dateMode   "auto" (default: the day it's published) or "manual"
//   date       YYYY-MM-DD, required when dateMode is "manual"
//
// Reads the PDF (see lib/pdfBlog.ts) and publishes it to the `blogs`
// Firestore collection, with the cover image stored in `blogImages` and
// served from /api/blog-image/<slug>. Needs FIREBASE_SERVICE_ACCOUNT_KEY,
// same as /api/export-to-sheets.
// ---------------------------------------------------------------------

// NOTE: Vercel's serverless functions reject request bodies over ~4.5 MB
// before this code runs, so on Vercel the practical limit is lower than this.
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const ALREADY_EXISTS = 6; // gRPC status code
const FALLBACK_COVER = "/assets/hero.png";

const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form || !isValidAdminPassword(form.get("password"))) {
    return fail("Unauthorized", 401);
  }

  // The PDF arrives either whole (`file`) or as pieces already uploaded to
  // /api/admin/blog-upload (`uploadId` + `uploadChunks`).
  const uploadId = form.get("uploadId");
  const chunkCount = Number(form.get("uploadChunks"));
  const chunked =
    typeof uploadId === "string" &&
    UPLOAD_ID.test(uploadId) &&
    Number.isInteger(chunkCount) &&
    chunkCount >= 1 &&
    chunkCount <= 20;

  let bytes: Uint8Array;
  if (chunked) {
    const joined = await readUploadChunks(uploadId, chunkCount).catch(() => null);
    if (!joined) return fail("The upload expired — please choose the PDF again.");
    bytes = joined;
  } else {
    const file = form.get("file");
    if (!(file instanceof File)) return fail("Choose a PDF to upload.");
    bytes = new Uint8Array(await file.arrayBuffer());
  }
  if (bytes.length > MAX_PDF_BYTES) return fail("That PDF is over 10 MB. Please compress it.", 413);
  if (String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") {
    return fail("That file isn't a PDF.");
  }

  let parsed;
  try {
    parsed = await parsePdfBlog(bytes);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Couldn't read that PDF.");
  }
  if (parsed.title.length < 3 || parsed.title.length > 300) {
    return fail("Couldn't find a sensible title at the top of the PDF.");
  }

  if (form.get("dryRun") === "1") {
    const thumb = parsed.cover
      ? await sharp(parsed.cover).resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer()
      : null;
    return NextResponse.json({
      ok: true,
      preview: {
        title: parsed.title,
        excerpt: parsed.excerpt,
        tags: parsed.tags,
        body: parsed.body,
        cover: thumb ? `data:image/jpeg;base64,${thumb.toString("base64")}` : null,
      },
    });
  }

  // "auto" stamps the post with the moment it's published; "manual" uses the
  // date the admin picked.
  const when = postDate(form.get("dateMode"), form.get("date"));
  if (!when) return fail("Pick a valid publish date.");
  const { publishedAt, date } = when;

  const post = {
    title: parsed.title,
    excerpt: parsed.excerpt,
    author: "E-Cell SRMIST",
    tags: parsed.tags,
    body: parsed.body,
    publishedAt,
    date,
  };

  try {
    const db = getAdminDb();
    const base = slugify(parsed.title) || "post";
    const builtIn = new Set(BLOGS.map((b) => b.slug));
    let slug = builtIn.has(base) ? `${base}-${Date.now().toString(36)}` : base;

    for (let attempt = 0; ; attempt++) {
      try {
        // The post and its cover are written together or not at all.
        const batch = db.batch();
        batch.create(db.collection("blogs").doc(slug), {
          ...post,
          image: parsed.cover ? `/api/blog-image/${slug}` : FALLBACK_COVER,
        });
        if (parsed.cover) {
          batch.create(db.collection("blogImages").doc(slug), {
            contentType: "image/jpeg",
            data: parsed.cover,
          });
        }
        await batch.commit();
        break;
      } catch (err) {
        const code = (err as { code?: number }).code;
        if (code !== ALREADY_EXISTS || attempt >= 4) throw err;
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      }
    }

    if (chunked) await deleteUploadChunks(uploadId, chunkCount).catch(() => {});
    revalidatePath("/blogs", "layout");
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    console.error("publish blog failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
