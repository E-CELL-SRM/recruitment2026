"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BlogBlock } from "@/lib/blogs";

// ---------------------------------------------------------------------
// Admin "Publish Blog" section: upload a PDF, check the preview, publish.
//
// The admin password is sent with every upload to /api/admin/blogs, which
// re-checks it on the server before doing anything. Choosing a PDF first
// reads it (dry run) and shows a preview; the post only goes live when
// "Publish" is pressed.
// ---------------------------------------------------------------------

const MAX_PDF_BYTES = 10 * 1024 * 1024;

interface Published {
  slug: string;
  title: string;
  cover: string | null;
}

// "checking" while we confirm the post is showing on the public Blogs page.
type LiveStatus = "checking" | "live" | "pending";

// Today's date in the browser as YYYY-MM-DD (what <input type="date"> uses).
const todayYmd = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// True once the post's own page loads AND it's listed on the Blogs page.
async function isLive(slug: string) {
  try {
    const [post, list] = await Promise.all([
      fetch(`/blogs/${slug}`, { cache: "no-store" }),
      fetch("/blogs", { cache: "no-store" }),
    ]);
    if (!post.ok || !list.ok) return false;
    return (await list.text()).includes(`/blogs/${slug}`);
  } catch {
    return false;
  }
}

interface Preview {
  title: string;
  excerpt: string;
  tags: string[];
  body: BlogBlock[];
  cover: string | null;
}

export default function BlogPublisher({ password }: { password: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [reading, setReading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Whether the server can really save posts (key set + Firestore reachable).
  // null = still checking.
  const [setup, setSetup] = useState<{ ready: boolean; problem?: string } | null>(null);
  const [published, setPublished] = useState<Published | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("checking");
  // "auto" dates the post the day it's published; "manual" uses `manualDate`.
  const [dateMode, setDateMode] = useState<"auto" | "manual">("auto");
  const [manualDate, setManualDate] = useState(todayYmd);

  const checkSetup = async () => {
    setSetup(null);
    try {
      const res = await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      setSetup(res.ok ? await res.json() : { ready: false, problem: "Couldn't check the publishing setup." });
    } catch {
      setSetup({ ready: false, problem: "Couldn't reach the server to check the publishing setup." });
    }
  };

  useEffect(() => {
    void checkSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (pdf: File, dryRun: boolean) => {
    const form = new FormData();
    form.append("password", password);
    form.append("file", pdf);
    if (dryRun) form.append("dryRun", "1");
    else {
      form.append("dateMode", dateMode);
      if (dateMode === "manual") form.append("date", manualDate);
    }
    return fetch("/api/admin/blogs", { method: "POST", body: form });
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const confirmLive = async (slug: string) => {
    setLiveStatus("checking");
    // The page refreshes the moment a post is published, but give it a few
    // tries in case the server is a little slow.
    for (let attempt = 0; attempt < 6; attempt++) {
      if (await isLive(slug)) {
        setLiveStatus("live");
        return;
      }
      await sleep(2000);
    }
    setLiveStatus("pending");
  };

  const handleChoose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    setPublished(null);
    setPreview(null);
    setError(null);

    if (chosen.type !== "application/pdf" && !chosen.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Please choose a PDF file.");
      return;
    }
    if (chosen.size > MAX_PDF_BYTES) {
      setFile(null);
      setError("That PDF is over 10 MB. Please compress it and try again.");
      return;
    }

    setFile(chosen);
    setReading(true);
    try {
      const res = await send(chosen, true);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Couldn't read that PDF.");
      else setPreview(data.preview);
    } catch {
      setError("Network error — couldn't read the PDF.");
    } finally {
      setReading(false);
    }
  };

  const handlePublish = async () => {
    if (!file) return;
    if (dateMode === "manual" && !manualDate) {
      setError("Pick the date to show on the post.");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const res = await send(file, false);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not publish the post.");
        return;
      }
      setPublished({
        slug: data.slug,
        title: preview?.title ?? "Your post",
        cover: preview?.cover ?? null,
      });
      reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
      void confirmLive(data.slug);
    } catch {
      setError("Network error — the post was not published.");
    } finally {
      setPublishing(false);
    }
  };

  const count = (test: (b: BlogBlock) => boolean) => preview?.body.filter(test).length ?? 0;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Publish a Blog Post</h1>
      <p style={styles.subtitle}>
        Upload the post as a PDF. The title is the large text at the top, bold
        lines become headings, &ldquo;The Takeaway:&rdquo; becomes a callout, a
        line of #hashtags becomes the tags, and the biggest image is the cover.
      </p>

      {setup && !setup.ready && (
        <div style={styles.setupBox} role="alert">
          <strong>Publishing isn&rsquo;t set up yet.</strong>
          <p style={{ margin: "6px 0 10px", lineHeight: 1.5 }}>{setup.problem}</p>
          <p style={{ ...styles.hint, margin: "0 0 10px" }}>
            You can still choose a PDF to preview how it will look, but the
            Publish button stays off until this is fixed.
          </p>
          <button type="button" onClick={() => void checkSetup()} style={styles.secondaryBtn}>
            Check again
          </button>
        </div>
      )}
      {setup?.ready && (
        <p style={styles.readyText}>● Publishing is connected to the database.</p>
      )}

      {published && (
        <div style={styles.successBox} role="status">
          <div style={styles.successHead}>
            <span style={styles.checkCircle}>✓</span>
            <div>
              <strong style={{ fontSize: "16px" }}>Blog published</strong>
              <p style={{ ...styles.hint, margin: "2px 0 0" }}>
                {liveStatus === "live"
                  ? "It's saved and showing on the Blogs page."
                  : "It's saved to the database."}
              </p>
            </div>
          </div>

          <div style={styles.successPost}>
            {published.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={published.cover} alt="" style={styles.successThumb} />
            )}
            <span style={styles.successTitle}>{published.title}</span>
          </div>

          <ul style={styles.steps}>
            <li style={styles.step}>
              <span style={styles.stepDone}>✓</span> Saved to the database
            </li>
            <li style={styles.step}>
              {liveStatus === "checking" ? (
                <span style={styles.stepWait}>…</span>
              ) : liveStatus === "live" ? (
                <span style={styles.stepDone}>✓</span>
              ) : (
                <span style={styles.stepWarn}>!</span>
              )}
              {liveStatus === "checking" && "Checking it appears on the Blogs page…"}
              {liveStatus === "live" && "Live on the Blogs page — confirmed"}
              {liveStatus === "pending" &&
                "Saved, but not showing on the Blogs page yet — it can take up to a minute"}
            </li>
          </ul>

          <div style={styles.btnRow}>
            <Link href={`/blogs/${published.slug}`} target="_blank" style={styles.linkBtn}>
              View the post →
            </Link>
            <Link href="/blogs" target="_blank" style={styles.linkBtnGhost}>
              Open the Blogs page
            </Link>
            {liveStatus === "pending" && (
              <button
                type="button"
                onClick={() => void confirmLive(published.slug)}
                style={styles.secondaryBtn}
              >
                Check again
              </button>
            )}
          </div>
        </div>
      )}

      <label style={styles.dropzone}>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleChoose}
          style={{ display: "none" }}
        />
        {file ? (
          <>
            <strong>{file.name}</strong>
            <span style={styles.hint}>
              {(file.size / 1024).toFixed(0)} KB · click to choose a different PDF
            </span>
          </>
        ) : (
          <>
            <strong>Choose a PDF</strong>
            <span style={styles.hint}>Up to 10 MB</span>
          </>
        )}
      </label>

      {reading && <p style={styles.hint}>Reading the PDF…</p>}
      {error && <p style={styles.errorText}>{error}</p>}

      {preview && (
        <div style={styles.previewBox}>
          <p style={styles.previewLabel}>Preview — check this looks right</p>
          {preview.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.cover} alt="Cover" style={styles.cover} />
          ) : (
            <p style={styles.hint}>
              No image found in the PDF — the default cover will be used.
            </p>
          )}
          <h2 style={styles.previewTitle}>{preview.title}</h2>
          {preview.tags.length > 0 && (
            <p style={styles.hint}>Tags: {preview.tags.join(", ")}</p>
          )}
          <p style={styles.hint}>
            {count((b) => typeof b === "string")} paragraphs ·{" "}
            {count((b) => typeof b === "object" && "heading" in b)} headings ·{" "}
            {count((b) => typeof b === "object" && "takeaway" in b)} takeaways
          </p>
          <div style={styles.bodyPreview}>
            {preview.body.map((b, i) =>
              typeof b === "string" ? (
                <p key={i} style={styles.para}>{b}</p>
              ) : "heading" in b ? (
                <h3 key={i} style={styles.previewHeading}>{b.heading}</h3>
              ) : "takeaway" in b ? (
                <p key={i} style={styles.takeaway}>
                  <strong>The Takeaway:</strong> {b.takeaway}
                </p>
              ) : (
                <p key={i} style={styles.hashtags}>
                  {b.hashtags.map((h) => `#${h}`).join(" ")}
                </p>
              ),
            )}
          </div>
          <fieldset style={styles.dateBox}>
            <legend style={styles.dateLegend}>Post date</legend>
            <label style={styles.radioRow}>
              <input
                type="radio"
                name="blog-date-mode"
                checked={dateMode === "auto"}
                onChange={() => setDateMode("auto")}
              />
              Use the day it&rsquo;s published
            </label>
            <label style={styles.radioRow}>
              <input
                type="radio"
                name="blog-date-mode"
                checked={dateMode === "manual"}
                onChange={() => setDateMode("manual")}
              />
              Enter a date manually
            </label>
            {dateMode === "manual" && (
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                style={styles.dateInput}
                aria-label="Post date"
              />
            )}
          </fieldset>
          <div style={styles.btnRow}>
            <button
              type="button"
              onClick={handlePublish}
              style={styles.primaryBtn}
              disabled={publishing || setup?.ready === false}
              title={setup?.ready === false ? "Publishing isn't set up yet" : undefined}
            >
              {publishing ? "Publishing…" : "Publish post"}
            </button>
            <button
              type="button"
              onClick={reset}
              style={styles.secondaryBtn}
              disabled={publishing}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "760px", margin: "0 auto" },
  title: { fontSize: "22px", margin: 0 },
  subtitle: { fontSize: "13px", color: "#888", margin: "6px 0 24px", lineHeight: 1.6 },
  dropzone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "36px 16px",
    border: "1px dashed #444",
    borderRadius: "10px",
    background: "#111",
    cursor: "pointer",
    textAlign: "center",
    marginBottom: "16px",
  },
  hint: { fontSize: "12px", color: "#888", lineHeight: 1.5, margin: "4px 0" },
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
  btnRow: { display: "flex", gap: "10px", marginTop: "18px" },
  errorText: { color: "#f87171", fontSize: "13px", margin: "8px 0" },
  setupBox: {
    border: "1px solid #f87171",
    borderRadius: "10px",
    padding: "16px 18px",
    marginBottom: "20px",
    background: "rgba(248, 113, 113, 0.07)",
    color: "#fecaca",
    fontSize: "13px",
  },
  readyText: { color: "#4ade80", fontSize: "12px", margin: "0 0 14px" },
  successBox: {
    border: "1px solid #4ade80",
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "20px",
    background: "rgba(74, 222, 128, 0.06)",
  },
  successHead: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" },
  checkCircle: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#4ade80",
    color: "#000",
    fontWeight: 700,
    flexShrink: 0,
  },
  successPost: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px",
    background: "#0a0a0a",
    border: "1px solid #1c1c1c",
    borderRadius: "8px",
    marginBottom: "14px",
  },
  successThumb: { width: "88px", height: "56px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 },
  successTitle: { fontSize: "14px", fontWeight: 600, lineHeight: 1.35 },
  steps: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" },
  step: { display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#ddd" },
  stepDone: { color: "#4ade80", fontWeight: 700, width: "16px", textAlign: "center" },
  stepWait: { color: "#888", fontWeight: 700, width: "16px", textAlign: "center" },
  stepWarn: { color: "#facc15", fontWeight: 700, width: "16px", textAlign: "center" },
  linkBtn: {
    padding: "10px 16px",
    borderRadius: "6px",
    background: "#4ade80",
    color: "#000",
    fontWeight: 600,
    fontSize: "13px",
    textDecoration: "none",
  },
  linkBtnGhost: {
    padding: "10px 16px",
    borderRadius: "6px",
    border: "1px solid #4ade80",
    color: "#4ade80",
    fontSize: "13px",
    textDecoration: "none",
  },
  previewBox: {
    border: "1px solid #222",
    borderRadius: "10px",
    padding: "18px",
    background: "#0f0f0f",
  },
  previewLabel: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#4ade80",
    margin: "0 0 12px",
  },
  cover: {
    width: "100%",
    maxHeight: "260px",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #222",
  },
  previewTitle: { fontSize: "20px", margin: "14px 0 6px", lineHeight: 1.25 },
  bodyPreview: {
    maxHeight: "340px",
    overflowY: "auto",
    marginTop: "12px",
    padding: "12px 14px",
    background: "#0a0a0a",
    border: "1px solid #1c1c1c",
    borderRadius: "6px",
  },
  para: { fontSize: "13px", color: "#ccc", lineHeight: 1.6, margin: "0 0 10px" },
  previewHeading: { fontSize: "15px", margin: "14px 0 6px" },
  takeaway: {
    fontSize: "13px",
    lineHeight: 1.6,
    margin: "0 0 10px",
    padding: "8px 12px",
    borderLeft: "2px solid #4ade80",
    background: "rgba(74, 222, 128, 0.06)",
  },
  hashtags: { fontSize: "12px", color: "#4ade80", margin: "10px 0 0" },
  dateBox: {
    margin: "16px 0 0",
    padding: "12px 14px",
    border: "1px solid #222",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  dateLegend: { fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", padding: "0 6px" },
  radioRow: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#ddd", cursor: "pointer" },
  dateInput: {
    alignSelf: "flex-start",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "#151515",
    color: "#fff",
    fontSize: "13px",
    fontFamily: "inherit",
    colorScheme: "dark",
  },
};
