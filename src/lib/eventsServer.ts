import { getAdminDb } from "./firebaseAdmin";
import type { EventItem, EventStatus } from "./events";

// Server-only: reads the events added from /admin (the `events` Firestore
// collection) with the service account. Photos live in the private
// `eventImages` collection and are served by /api/event-image/<id>.

const READ_TIMEOUT_MS = 8000;

const isString = (v: unknown): v is string => typeof v === "string";

export interface StoredEvent extends EventItem {
  createdAt: string;
}

export function toEvent(id: string, d: Record<string, unknown>): StoredEvent | null {
  if (!isString(d.title) || !isString(d.date)) return null;
  return {
    id,
    title: d.title,
    description: isString(d.description) ? d.description : "",
    date: d.date,
    sortDate: isString(d.sortDate) ? d.sortDate : "",
    venue: isString(d.venue) ? d.venue : "",
    tag: isString(d.tag) ? d.tag : "",
    status: (d.status === "past" ? "past" : "upcoming") satisfies EventStatus,
    photos: Array.isArray(d.photos) ? d.photos.filter(isString) : [],
    link: isString(d.link) && d.link ? d.link : undefined,
    createdAt: isString(d.createdAt) ? d.createdAt : "",
  };
}

export async function fetchStoredEvents(): Promise<StoredEvent[]> {
  try {
    const snap = await Promise.race([
      getAdminDb().collection("events").get(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), READ_TIMEOUT_MS),
      ),
    ]);
    return snap.docs
      .map((d) => toEvent(d.id, d.data()))
      .filter((e): e is StoredEvent => e !== null);
  } catch (err) {
    // No service-account key (e.g. a fresh checkout), offline, etc.
    console.error("Couldn't read events:", err);
    return [];
  }
}

// Upcoming: soonest first, undated ones last. Past: most recent first.
export async function getAllEvents(): Promise<{
  upcoming: EventItem[];
  past: EventItem[];
}> {
  const all = await fetchStoredEvents();
  const key = (e: StoredEvent) => e.sortDate || "";
  const byNewest = (a: StoredEvent, b: StoredEvent) =>
    (key(b) || b.createdAt).localeCompare(key(a) || a.createdAt);

  const upcoming = all
    .filter((e) => e.status === "upcoming")
    .sort((a, b) => {
      if (!key(a) && !key(b)) return byNewest(a, b);
      if (!key(a)) return 1;
      if (!key(b)) return -1;
      return key(a).localeCompare(key(b));
    });
  const past = all.filter((e) => e.status === "past").sort(byNewest);
  return { upcoming, past };
}
