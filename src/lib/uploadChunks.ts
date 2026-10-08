import { getAdminDb } from "./firebaseAdmin";

// Server-only: a big upload arrives in pieces (see /api/admin/blog-upload)
// stored in the `uploadChunks` Firestore collection as `<uploadId>-<index>`.

export const UPLOAD_ID = /^[a-f0-9-]{36}$/;

const refs = (uploadId: string, total: number) => {
  const col = getAdminDb().collection("uploadChunks");
  return Array.from({ length: total }, (_, i) => col.doc(`${uploadId}-${i}`));
};

// The whole upload, joined back together, or null if any piece is missing
// (never uploaded, or cleared out as stale).
export async function readUploadChunks(
  uploadId: string,
  total: number,
): Promise<Uint8Array | null> {
  const snaps = await getAdminDb().getAll(...refs(uploadId, total));
  const parts: Buffer[] = [];
  for (const s of snaps) {
    const data = s.data()?.data;
    if (!data) return null;
    parts.push(Buffer.from(data));
  }
  return new Uint8Array(Buffer.concat(parts));
}

export async function deleteUploadChunks(uploadId: string, total: number) {
  const db = getAdminDb();
  const batch = db.batch();
  refs(uploadId, total).forEach((r) => batch.delete(r));
  await batch.commit();
}
