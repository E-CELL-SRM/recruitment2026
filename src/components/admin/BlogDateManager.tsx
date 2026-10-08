"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------
// Admin "Post dates" list, shown under the blog uploader: change the date of
// any post that's already on the Blogs page — pick a date, or set it to today.
// ---------------------------------------------------------------------

interface Post {
  slug: string;
  title: string;
  date: string;
  publishedAt: string;
}

// The post's current day as YYYY-MM-DD in India, to prefill the date picker.
const toYmd = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : "";

export default function BlogDateManager({
  password,
  reloadKey,
}: {
  password: string;
  // Changes whenever a new post is published, so the list picks it up.
  reloadKey: number;
}) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [picked, setPicked] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const call = async (payload: Record<string, string>) => {
    const res = await fetch("/api/admin/blog-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  };

  useEffect(() => {
    let cancelled = false;
    call({ intent: "list" })
      .then((d) => !cancelled && setPosts(d.posts))
      .catch((err) => {
        if (cancelled) return;
        setPosts([]);
        setError(err instanceof Error ? err.message : "Couldn't load the posts.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const startEdit = (p: Post) => {
    setEditing(p.slug);
    setPicked(toYmd(p.publishedAt));
    setError(null);
    setNotice(null);
  };

  const save = async (post: Post, mode: "manual" | "auto") => {
    if (mode === "manual" && !picked) return setError("Pick a date first.");
    setSaving(true);
    setError(null);
    try {
      const d = await call({
        intent: "set",
        slug: post.slug,
        dateMode: mode,
        ...(mode === "manual" ? { date: picked } : {}),
      });
      // Keep the list in newest-first order, like the Blogs page.
      setPosts((prev) =>
        prev
          ?.map((p) => (p.slug === post.slug ? { ...p, date: d.date, publishedAt: d.publishedAt } : p))
          .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)) ?? null,
      );
      setEditing(null);
      setNotice(`Date updated to ${d.date}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change the date.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>Post dates</h2>
      <p style={styles.hint}>
        Change the date shown on a post that&rsquo;s already published. Posts
        are listed newest first by this date.
      </p>

      {notice && <p style={styles.notice} role="status">{notice}</p>}
      {error && <p style={styles.error} role="alert">{error}</p>}
      {posts === null && <p style={styles.hint}>Loading…</p>}

      <ul style={styles.list}>
        {posts?.map((p) => (
          <li key={p.slug} style={styles.item}>
            <div style={styles.row}>
              <div style={{ minWidth: 0 }}>
                <div style={styles.date}>{p.date || "No date"}</div>
                <div style={styles.name}>{p.title}</div>
              </div>
              {editing !== p.slug && (
                <button type="button" style={styles.btn} onClick={() => startEdit(p)}>
                  Change date
                </button>
              )}
            </div>
            {editing === p.slug && (
              <div style={styles.editRow}>
                <input
                  type="date"
                  value={picked}
                  onChange={(e) => setPicked(e.target.value)}
                  style={styles.input}
                  aria-label={`New date for ${p.title}`}
                />
                <button
                  type="button"
                  style={styles.primary}
                  disabled={saving}
                  onClick={() => void save(p, "manual")}
                >
                  {saving ? "Saving…" : "Save date"}
                </button>
                <button
                  type="button"
                  style={styles.btn}
                  disabled={saving}
                  onClick={() => void save(p, "auto")}
                >
                  Set to today
                </button>
                <button
                  type="button"
                  style={styles.btn}
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: "760px", margin: "40px auto 0", paddingTop: "28px", borderTop: "1px solid #222" },
  title: { fontSize: "18px", margin: 0 },
  hint: { fontSize: "12px", color: "#888", lineHeight: 1.5, margin: "6px 0 14px" },
  notice: { color: "#4ade80", fontSize: "13px", margin: "0 0 10px" },
  error: { color: "#f87171", fontSize: "13px", margin: "0 0 10px" },
  list: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" },
  item: { padding: "12px 14px", border: "1px solid #1c1c1c", borderRadius: "8px", background: "#0f0f0f" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" },
  date: { fontSize: "12px", color: "#888" },
  name: { fontSize: "14px", fontWeight: 600, marginTop: "4px", overflowWrap: "anywhere" },
  editRow: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "12px" },
  input: {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "#151515",
    color: "#fff",
    fontSize: "13px",
    fontFamily: "inherit",
    colorScheme: "dark",
  },
  btn: {
    padding: "7px 12px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "transparent",
    color: "#ccc",
    fontSize: "13px",
    cursor: "pointer",
    flexShrink: 0,
  },
  primary: {
    padding: "7px 14px",
    borderRadius: "6px",
    border: "none",
    background: "#fff",
    color: "#000",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },
};
