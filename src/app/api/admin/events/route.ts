import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { isValidAdminPassword } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { isValidYmd } from "@/lib/dates";
import { fetchStoredEvents } from "@/lib/eventsServer";

// ---------------------------------------------------------------------
// POST /api/admin/events   (multipart/form-data)
//
//   password   the admin password (checked here, on the server)
//   intent     "list" | "create" | "update" | "delete"
//   id         the event to update / delete
//
// create / update also take:
//   title, description, venue, tag, link   text fields
//   status     "upcoming" | "past"
//   date       the date exactly as it should read on the site ("Mar 14–15,
//              2027", "March 2027", "TBA", …)
//   sortDate   optional YYYY-MM-DD used only to order events
//   keepPhotos JSON array of existing photo URLs to keep (update only)
//   photos     new image files to add
//
// Events go to the `events` Firestore collection; each photo is shrunk and
// stored in `eventImages`, served from /api/event-image/<id>. Needs
// FIREBASE_SERVICE_ACCOUNT_KEY, same as the blog route.
// ---------------------------------------------------------------------

// NOTE: Vercel rejects request bodies over ~4.5 MB, so the admin page shrinks
// photos in the browser before sending them.
const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
// Firestore documents are capped at 1 MiB, so every stored photo stays below.
const MAX_STORED_BYTES = 900 * 1024;
const PHOTO_URL = /^\/api\/event-image\/([A-Za-z0-9]{1,40})$/;

const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

const text = (form: FormData, key: string, max: number) => {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};

// Shrinks a photo to something that fits in a Firestore document.
async function compress(input: Buffer): Promise<Buffer> {
  for (const [size, quality] of [[1600, 78], [1400, 65], [1100, 55], [800, 50]]) {
    const out = await sharp(input)
      .rotate()
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
    if (out.length <= MAX_STORED_BYTES) return out;
  }
  throw new Error("A photo is too detailed to store — try a smaller one.");
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form || !isValidAdminPassword(form.get("password"))) {
    return fail("Unauthorized", 401);
  }

  try {
    const intent = form.get("intent");
    if (intent === "list") return await list();
    if (intent === "delete") return await remove(form);
    if (intent === "create" || intent === "update") return await save(form, intent);
    return fail("Unknown request.");
  } catch (err) {
    console.error("admin events failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

async function list() {
  const events = await fetchStoredEvents();
  events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ ok: true, events });
}

async function remove(form: FormData) {
  const id = text(form, "id", 100);
  if (!id) return fail("Missing event id.");
  const db = getAdminDb();
  const ref = db.collection("events").doc(id);
  const snap = await ref.get();
  const batch = db.batch();
  for (const url of (snap.data()?.photos ?? []) as string[]) {
    const photoId = PHOTO_URL.exec(url)?.[1];
    if (photoId) batch.delete(db.collection("eventImages").doc(photoId));
  }
  batch.delete(ref);
  await batch.commit();
  revalidatePath("/events");
  return NextResponse.json({ ok: true });
}

async function save(form: FormData, intent: "create" | "update") {
  const title = text(form, "title", 200);
  if (title.length < 2) return fail("Give the event a title.");

  const status = form.get("status") === "past" ? "past" : "upcoming";
  const date = text(form, "date", 80) || "TBA";
  const sortDate = text(form, "sortDate", 10);
  if (sortDate && !isValidYmd(sortDate)) return fail("The date used for ordering isn't valid.");

  const link = text(form, "link", 500);
  if (link && !/^https?:\/\//i.test(link)) {
    return fail("The link must start with http:// or https://");
  }

  const eventId = text(form, "id", 100);
  if (intent === "update" && !eventId) return fail("Missing event id.");

  const db = getAdminDb();
  const events = db.collection("events");
  const ref = intent === "update" ? events.doc(eventId) : events.doc();

  let existing: { photos: string[]; createdAt?: string } = { photos: [] };
  if (intent === "update") {
    const snap = await ref.get();
    if (!snap.exists) return fail("That event no longer exists.", 404);
    existing = snap.data() as typeof existing;
  }

  // Photos to keep: only ones this event already has.
  let keep: string[] = [];
  if (intent === "update") {
    try {
      const asked = JSON.parse(String(form.get("keepPhotos") ?? "[]"));
      keep = existing.photos.filter((p) => Array.isArray(asked) && asked.includes(p));
    } catch {
      return fail("Couldn't read which photos to keep.");
    }
  }
  const removed = existing.photos.filter((p) => !keep.includes(p));

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (keep.length + files.length > MAX_PHOTOS) {
    return fail(`An event can have at most ${MAX_PHOTOS} photos.`);
  }

  const batch = db.batch();
  const added: string[] = [];
  for (const file of files) {
    if (file.size > MAX_PHOTO_BYTES) return fail(`"${file.name}" is over 4 MB.`, 413);
    let data: Buffer;
    try {
      data = await compress(Buffer.from(await file.arrayBuffer()));
    } catch (err) {
      return fail(
        err instanceof Error && err.message.includes("too detailed")
          ? err.message
          : `"${file.name}" isn't an image we can read.`,
      );
    }
    const photoRef = db.collection("eventImages").doc();
    batch.create(photoRef, { eventId: ref.id, contentType: "image/jpeg", data });
    added.push(`/api/event-image/${photoRef.id}`);
  }
  for (const url of removed) {
    const photoId = PHOTO_URL.exec(url)?.[1];
    if (photoId) batch.delete(db.collection("eventImages").doc(photoId));
  }

  batch.set(ref, {
    title,
    description: text(form, "description", 3000),
    venue: text(form, "venue", 200),
    tag: text(form, "tag", 40) || (status === "past" ? "Past Event" : "Event"),
    link,
    status,
    date,
    sortDate,
    photos: [...keep, ...added],
    createdAt: existing.createdAt ?? new Date().toISOString(),
  });
  await batch.commit();

  revalidatePath("/events");
  return NextResponse.json({ ok: true, id: ref.id });
}
