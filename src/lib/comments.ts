import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// Blog comments live in the `blogComments` Firestore collection — one doc
// per comment, tagged with the post's slug. firestore.rules lets anyone read
// and add comments (within the length limits below) but never edit or delete.

export const MAX_NAME = 60;
export const MAX_COMMENT = 1000;

const COLLECTION = "blogComments";

export interface BlogComment {
  id: string;
  name: string;
  text: string;
  createdAt: Date;
}

// Calls `onData` now and again whenever the post's comments change (including
// the visitor's own new comment, instantly), newest first.
export function subscribeToComments(
  slug: string,
  onData: (comments: BlogComment[]) => void,
  onError: (error: Error) => void,
): () => void {
  // Filtered by slug only and sorted here, so no composite index is needed.
  return onSnapshot(
    query(collection(db, COLLECTION), where("slug", "==", slug)),
    (snap) => {
      const comments = snap.docs.map((d) => {
        const data = d.data({ serverTimestamps: "estimate" });
        return {
          id: d.id,
          name: String(data.name ?? ""),
          text: String(data.text ?? ""),
          createdAt:
            data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        };
      });
      comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(comments);
    },
    onError,
  );
}

export async function addComment(slug: string, name: string, text: string) {
  await addDoc(collection(db, COLLECTION), {
    slug,
    name: name.trim(),
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
}
