"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  addComment,
  subscribeToComments,
  MAX_COMMENT,
  MAX_NAME,
  type BlogComment,
} from "@/lib/comments";
import styles from "./BlogComments.module.css";

const NAME_KEY = "ecell_comment_name";
const LAST_POST_KEY = "ecell_last_comment_at";
// Minimum gap between a visitor's comments — a light brake on spam.
const POST_COOLDOWN_MS = 20_000;

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BlogComments({ slug }: { slug: string }) {
  const { user, userProfile } = useAuth();
  const signedInName = userProfile?.displayName || user?.displayName || "";

  const [comments, setComments] = useState<BlogComment[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  // Remembered name, falling back to the signed-in candidate's name.
  useEffect(() => {
    let saved = "";
    try {
      saved = localStorage.getItem(NAME_KEY) || "";
    } catch {
      // localStorage unavailable — just start with an empty name.
    }
    setName((current) => current || saved || signedInName);
  }, [signedInName]);

  useEffect(() => {
    setComments(null);
    setLoadError(false);
    return subscribeToComments(slug, setComments, () => setLoadError(true));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setPosted(false);

    const cleanName = name.trim();
    const cleanText = text.trim();
    if (!cleanName) return setFormError("Please enter your name.");
    if (!cleanText) return setFormError("Please write a comment.");

    let lastPost = 0;
    try {
      lastPost = Number(localStorage.getItem(LAST_POST_KEY)) || 0;
    } catch {
      // No stored timestamp — don't block the comment.
    }
    const wait = POST_COOLDOWN_MS - (Date.now() - lastPost);
    if (wait > 0) {
      return setFormError(`Please wait ${Math.ceil(wait / 1000)}s before posting another comment.`);
    }

    setSubmitting(true);
    try {
      await addComment(slug, cleanName, cleanText);
      try {
        localStorage.setItem(NAME_KEY, cleanName);
        localStorage.setItem(LAST_POST_KEY, String(Date.now()));
      } catch {
        // Not persisted — fine.
      }
      setText("");
      setPosted(true);
    } catch {
      setFormError("Couldn't post your comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.section} aria-label="Comments">
      <h2 className={styles.heading}>
        Comments{comments ? ` (${comments.length})` : ""}
        <span className={styles.rule} />
      </h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={MAX_NAME}
          className={styles.input}
          aria-label="Your name"
        />
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPosted(false);
          }}
          placeholder="Share your thoughts…"
          maxLength={MAX_COMMENT}
          rows={4}
          className={`${styles.input} ${styles.textarea}`}
          aria-label="Your comment"
        />
        <div className={styles.formFoot}>
          <span className={styles.count}>
            {text.length}/{MAX_COMMENT}
          </span>
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </div>
        {formError && (
          <p className={styles.error} role="alert">
            {formError}
          </p>
        )}
        {posted && (
          <p className={styles.success} role="status">
            ✓ Your comment has been posted.
          </p>
        )}
      </form>

      {loadError ? (
        <p className={styles.muted}>Comments aren&rsquo;t available right now. Please try again later.</p>
      ) : comments === null ? (
        <p className={styles.muted}>Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className={styles.muted}>No comments yet — be the first to share your thoughts.</p>
      ) : (
        <ul className={styles.list}>
          {comments.map((c) => (
            <li key={c.id} className={styles.comment}>
              <span className={styles.avatar} aria-hidden="true">
                {c.name.charAt(0).toUpperCase() || "?"}
              </span>
              <div className={styles.body}>
                <div className={styles.meta}>
                  <strong className={styles.author}>{c.name}</strong>
                  <span className={styles.time}>{timeAgo(c.createdAt)}</span>
                </div>
                <p className={styles.text}>{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
