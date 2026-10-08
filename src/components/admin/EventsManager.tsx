"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatYearMonth,
  formatYmd,
  formatYmdRange,
} from "@/lib/dates";
import type { EventItem, EventStatus } from "@/lib/events";

// ---------------------------------------------------------------------
// Admin "Events" section: add an upcoming event, or write up a past one with
// photos, then edit or delete anything already on the Events page.
//
// The admin password is sent with every request to /api/admin/events, which
// re-checks it on the server. Photos are shrunk in the browser first so a few
// of them still fit in one request.
// ---------------------------------------------------------------------

const MAX_PHOTOS = 8;
// Vercel rejects request bodies over ~4.5 MB.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

type DateMode = "exact" | "range" | "month" | "text";

interface Form {
  status: EventStatus;
  title: string;
  tag: string;
  venue: string;
  description: string;
  link: string;
  dateMode: DateMode;
  day: string;
  endDay: string;
  month: string;
  dateText: string;
  // Only for "text" dates: an optional day to order the event by.
  sortDay: string;
}

const EMPTY: Form = {
  status: "upcoming",
  title: "",
  tag: "",
  venue: "",
  description: "",
  link: "",
  dateMode: "exact",
  day: "",
  endDay: "",
  month: "",
  dateText: "",
  sortDay: "",
};

const DATE_MODES: { id: DateMode; label: string }[] = [
  { id: "exact", label: "Exact date" },
  { id: "range", label: "Date range" },
  { id: "month", label: "Month only" },
  { id: "text", label: "Custom text" },
];

// The date as it'll read on the site, plus a day to order by (or "").
// Returns an error message when the chosen option isn't filled in properly.
function resolveDate(f: Form): { date: string; sortDate: string } | { error: string } {
  switch (f.dateMode) {
    case "exact":
      if (!f.day) return { error: "Pick the event date." };
      return { date: formatYmd(f.day), sortDate: f.day };
    case "range":
      if (!f.day || !f.endDay) return { error: "Pick both the start and end date." };
      if (f.endDay < f.day) return { error: "The end date is before the start date." };
      return { date: formatYmdRange(f.day, f.endDay), sortDate: f.day };
    case "month":
      if (!f.month) return { error: "Pick a month." };
      return { date: formatYearMonth(f.month), sortDate: `${f.month}-01` };
    case "text":
      return { date: f.dateText.trim() || "TBA", sortDate: f.sortDay };
  }
}

// Downscales a photo to at most 1600px on its longest side as a JPEG. If the
// browser can't read it, the original is sent and the server decides.
async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

interface NewPhoto {
  file: File;
  preview: string;
}

export default function EventsManager({ password }: { password: string }) {
  const photoInput = useRef<HTMLInputElement>(null);
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keptPhotos, setKeptPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const call = async (fields: Record<string, string>, files: File[] = []) => {
    const body = new FormData();
    body.append("password", password);
    for (const [k, v] of Object.entries(fields)) body.append(k, v);
    for (const f of files) body.append("photos", f);
    const res = await fetch("/api/admin/events", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  };

  const load = async () => {
    try {
      const data = await call({ intent: "list" });
      setEvents(data.events);
    } catch (err) {
      setEvents([]);
      setError(err instanceof Error ? err.message : "Couldn't load events.");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearPhotos = () => {
    newPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    setNewPhotos([]);
    if (photoInput.current) photoInput.current.value = "";
  };

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setKeptPhotos([]);
    clearPhotos();
  };

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    if (photoInput.current) photoInput.current.value = "";
    if (chosen.length === 0) return;
    setError(null);

    const room = MAX_PHOTOS - keptPhotos.length - newPhotos.length;
    const images = chosen.filter((f) => f.type.startsWith("image/"));
    if (images.length < chosen.length) setError("Only image files can be added.");
    if (images.length > room) setError(`An event can have at most ${MAX_PHOTOS} photos.`);

    setProcessing(true);
    const shrunk = await Promise.all(images.slice(0, Math.max(room, 0)).map(shrink));
    setNewPhotos((prev) => [
      ...prev,
      ...shrunk.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    setProcessing(false);
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (form.title.trim().length < 2) return setError("Give the event a title.");
    const when = resolveDate(form);
    if ("error" in when) return setError(when.error);
    const total = newPhotos.reduce((n, p) => n + p.file.size, 0);
    if (total > MAX_UPLOAD_BYTES) {
      return setError("The new photos add up to over 4 MB — remove a few and add them in a second save.");
    }

    setSaving(true);
    try {
      await call(
        {
          intent: editingId ? "update" : "create",
          ...(editingId ? { id: editingId, keepPhotos: JSON.stringify(keptPhotos) } : {}),
          status: form.status,
          title: form.title,
          tag: form.tag,
          venue: form.venue,
          description: form.description,
          link: form.link,
          date: when.date,
          sortDate: when.sortDate,
        },
        newPhotos.map((p) => p.file),
      );
      setNotice(editingId ? "Event updated." : "Event added — it's on the Events page.");
      reset();
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the event.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (ev: EventItem) => {
    reset();
    setEditingId(ev.id);
    setKeptPhotos(ev.photos);
    // The stored date is just text, so it comes back as a custom date.
    setForm({
      status: ev.status,
      title: ev.title,
      tag: ev.tag,
      venue: ev.venue,
      description: ev.description,
      link: ev.link ?? "",
      dateMode: "text",
      day: "",
      endDay: "",
      month: "",
      dateText: ev.date,
      sortDay: ev.sortDate,
    });
    setError(null);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (ev: EventItem) => {
    if (!window.confirm(`Delete "${ev.title}" and its photos? This can't be undone.`)) return;
    setError(null);
    setNotice(null);
    try {
      await call({ intent: "delete", id: ev.id });
      if (editingId === ev.id) reset();
      setNotice("Event deleted.");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete the event.");
    }
  };

  const photoCount = keptPhotos.length + newPhotos.length;
  const isPast = form.status === "past";

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{editingId ? "Edit event" : "Add an event"}</h1>
      <p style={styles.subtitle}>
        Add something coming up, or write up a past event with its photos. Both
        appear on the Events page.
      </p>

      {notice && <p style={styles.noticeText} role="status">{notice}</p>}

      <form onSubmit={handleSave} style={styles.card}>
        <div style={styles.toggle} role="radiogroup" aria-label="Event type">
          {(["upcoming", "past"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={form.status === s}
              onClick={() => set("status", s)}
              style={{ ...styles.toggleBtn, ...(form.status === s ? styles.toggleActive : {}) }}
            >
              {s === "upcoming" ? "Upcoming event" : "Past event"}
            </button>
          ))}
        </div>

        <label style={styles.field}>
          <span style={styles.label}>Title</span>
          <input
            style={styles.input}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={200}
            placeholder="E-Summit 2027"
          />
        </label>

        <div style={styles.row}>
          <label style={{ ...styles.field, flex: 1 }}>
            <span style={styles.label}>Venue</span>
            <input
              style={styles.input}
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              maxLength={200}
              placeholder="SRMIST Auditorium"
            />
          </label>
          <label style={{ ...styles.field, flex: 1 }}>
            <span style={styles.label}>Tag</span>
            <input
              style={styles.input}
              value={form.tag}
              onChange={(e) => set("tag", e.target.value)}
              maxLength={40}
              placeholder={isPast ? "Past Event" : "Workshop"}
            />
          </label>
        </div>

        <fieldset style={styles.dateBox}>
          <legend style={styles.legend}>Date</legend>
          <div style={styles.chips}>
            {DATE_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => set("dateMode", m.id)}
                style={{ ...styles.chip, ...(form.dateMode === m.id ? styles.chipActive : {}) }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {form.dateMode === "exact" && (
            <input
              type="date"
              style={styles.dateInput}
              value={form.day}
              onChange={(e) => set("day", e.target.value)}
              aria-label="Event date"
            />
          )}
          {form.dateMode === "range" && (
            <div style={styles.row}>
              <label style={styles.inlineLabel}>
                From
                <input
                  type="date"
                  style={styles.dateInput}
                  value={form.day}
                  onChange={(e) => set("day", e.target.value)}
                />
              </label>
              <label style={styles.inlineLabel}>
                To
                <input
                  type="date"
                  style={styles.dateInput}
                  value={form.endDay}
                  min={form.day || undefined}
                  onChange={(e) => set("endDay", e.target.value)}
                />
              </label>
            </div>
          )}
          {form.dateMode === "month" && (
            <input
              type="month"
              style={styles.dateInput}
              value={form.month}
              onChange={(e) => set("month", e.target.value)}
              aria-label="Event month"
            />
          )}
          {form.dateMode === "text" && (
            <>
              <input
                style={styles.input}
                value={form.dateText}
                onChange={(e) => set("dateText", e.target.value)}
                maxLength={80}
                placeholder='Anything, e.g. "TBA", "Spring 2027", "Mar 14–15, 2027"'
              />
              <label style={styles.inlineLabel}>
                Order by (optional)
                <input
                  type="date"
                  style={styles.dateInput}
                  value={form.sortDay}
                  onChange={(e) => set("sortDay", e.target.value)}
                />
              </label>
            </>
          )}
          <p style={styles.hint}>
            Shown as:{" "}
            <strong style={{ color: "#ddd" }}>
              {(() => {
                const w = resolveDate(form);
                return "error" in w ? "—" : w.date;
              })()}
            </strong>
          </p>
        </fieldset>

        <label style={styles.field}>
          <span style={styles.label}>Description</span>
          <textarea
            style={{ ...styles.input, minHeight: "110px", resize: "vertical" }}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={3000}
            placeholder={
              isPast
                ? "What happened — highlights, speakers, turnout…"
                : "What it is and who it's for"
            }
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Link (optional)</span>
          <input
            style={styles.input}
            value={form.link}
            onChange={(e) => set("link", e.target.value)}
            placeholder="https://… registration or details page"
            inputMode="url"
          />
        </label>

        <div style={styles.field}>
          <span style={styles.label}>
            Photos ({photoCount}/{MAX_PHOTOS})
            {!isPast && " — optional, e.g. a poster"}
          </span>
          {(keptPhotos.length > 0 || newPhotos.length > 0) && (
            <div style={styles.photoGrid}>
              {keptPhotos.map((src) => (
                <div key={src} style={styles.photo}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" style={styles.photoImg} />
                  <button
                    type="button"
                    style={styles.photoRemove}
                    onClick={() => setKeptPhotos((k) => k.filter((p) => p !== src))}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
              {newPhotos.map((p, i) => (
                <div key={p.preview} style={styles.photo}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" style={styles.photoImg} />
                  <span style={styles.newBadge}>new</span>
                  <button
                    type="button"
                    style={styles.photoRemove}
                    onClick={() => removeNewPhoto(i)}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <label
            style={{
              ...styles.dropzone,
              ...(photoCount >= MAX_PHOTOS ? { opacity: 0.4, pointerEvents: "none" } : {}),
            }}
          >
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotos}
              style={{ display: "none" }}
            />
            <strong>{processing ? "Preparing photos…" : "Add photos"}</strong>
            <span style={styles.hint}>JPG, PNG or WebP · resized automatically</span>
          </label>
        </div>

        {error && <p style={styles.errorText} role="alert">{error}</p>}

        <div style={styles.btnRow}>
          <button type="submit" style={styles.primaryBtn} disabled={saving || processing}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Add event"}
          </button>
          {(editingId || form.title) && (
            <button type="button" style={styles.secondaryBtn} onClick={reset} disabled={saving}>
              {editingId ? "Cancel editing" : "Clear"}
            </button>
          )}
        </div>
      </form>

      <h2 style={styles.listTitle}>Events on the site</h2>
      {events === null && <p style={styles.hint}>Loading…</p>}
      {events?.length === 0 && (
        <p style={styles.hint}>Nothing added yet — events you add will be listed here.</p>
      )}
      <ul style={styles.list}>
        {events?.map((ev) => (
          <li key={ev.id} style={styles.listItem}>
            <div style={{ minWidth: 0 }}>
              <div style={styles.listMeta}>
                <span style={ev.status === "past" ? styles.pillPast : styles.pillUpcoming}>
                  {ev.status}
                </span>
                {ev.date}
                {ev.photos.length > 0 && ` · ${ev.photos.length} photo${ev.photos.length > 1 ? "s" : ""}`}
              </div>
              <div style={styles.listName}>{ev.title}</div>
            </div>
            <div style={styles.listActions}>
              <button type="button" style={styles.smallBtn} onClick={() => startEdit(ev)}>
                Edit
              </button>
              <button
                type="button"
                style={{ ...styles.smallBtn, color: "#f87171", border: "1px solid #5b2323" }}
                onClick={() => void handleDelete(ev)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const inputBase: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid #333",
  background: "#151515",
  color: "#fff",
  fontSize: "14px",
  fontFamily: "inherit",
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "760px", margin: "0 auto" },
  title: { fontSize: "22px", margin: 0 },
  subtitle: { fontSize: "13px", color: "#888", margin: "6px 0 24px", lineHeight: 1.6 },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "18px",
    border: "1px solid #222",
    borderRadius: "10px",
    background: "#0f0f0f",
  },
  toggle: { display: "flex", gap: "6px" },
  toggleBtn: {
    flex: 1,
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "transparent",
    color: "#aaa",
    fontSize: "14px",
    cursor: "pointer",
  },
  toggleActive: { background: "#fff", color: "#000", border: "1px solid #fff", fontWeight: 600 },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" },
  input: inputBase,
  row: { display: "flex", gap: "12px", flexWrap: "wrap" },
  dateBox: {
    margin: 0,
    padding: "12px 14px 14px",
    border: "1px solid #222",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  legend: { fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", padding: "0 6px" },
  chips: { display: "flex", gap: "6px", flexWrap: "wrap" },
  chip: {
    padding: "6px 12px",
    borderRadius: "999px",
    border: "1px solid #333",
    background: "transparent",
    color: "#aaa",
    fontSize: "13px",
    cursor: "pointer",
  },
  chipActive: { background: "#4ade80", color: "#000", border: "1px solid #4ade80", fontWeight: 600 },
  dateInput: { ...inputBase, alignSelf: "flex-start", colorScheme: "dark" },
  inlineLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#aaa" },
  hint: { fontSize: "12px", color: "#888", lineHeight: 1.5, margin: "4px 0 0" },
  photoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px" },
  photo: {
    position: "relative",
    aspectRatio: "4 / 3",
    borderRadius: "6px",
    overflow: "hidden",
    border: "1px solid #222",
    background: "#111",
  },
  photoImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  photoRemove: {
    position: "absolute",
    top: "4px",
    right: "4px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.75)",
    color: "#fff",
    fontSize: "16px",
    lineHeight: 1,
    cursor: "pointer",
  },
  newBadge: {
    position: "absolute",
    left: "4px",
    bottom: "4px",
    padding: "1px 6px",
    borderRadius: "999px",
    background: "#4ade80",
    color: "#000",
    fontSize: "10px",
    fontWeight: 700,
  },
  dropzone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "20px 16px",
    border: "1px dashed #444",
    borderRadius: "10px",
    background: "#111",
    cursor: "pointer",
    textAlign: "center",
  },
  btnRow: { display: "flex", gap: "10px" },
  primaryBtn: {
    padding: "11px 18px",
    borderRadius: "6px",
    border: "none",
    background: "#fff",
    color: "#000",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "11px 18px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "transparent",
    color: "#ccc",
    fontSize: "14px",
    cursor: "pointer",
  },
  errorText: { color: "#f87171", fontSize: "13px", margin: 0 },
  noticeText: { color: "#4ade80", fontSize: "13px", margin: "0 0 14px" },
  listTitle: { fontSize: "16px", margin: "32px 0 12px" },
  list: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 14px",
    border: "1px solid #1c1c1c",
    borderRadius: "8px",
    background: "#0f0f0f",
  },
  listMeta: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#888", flexWrap: "wrap" },
  listName: { fontSize: "14px", fontWeight: 600, marginTop: "4px", overflowWrap: "anywhere" },
  pillUpcoming: { padding: "1px 8px", borderRadius: "999px", background: "rgba(74,222,128,0.15)", color: "#4ade80", fontSize: "11px" },
  pillPast: { padding: "1px 8px", borderRadius: "999px", background: "#222", color: "#aaa", fontSize: "11px" },
  listActions: { display: "flex", gap: "6px", flexShrink: 0 },
  smallBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "transparent",
    color: "#ccc",
    fontSize: "13px",
    cursor: "pointer",
  },
};
