"use client";

import { useEffect, useState } from "react";
import styles from "./EventGallery.module.css";

// A strip of an event's photos; clicking one opens it full-size, with
// previous / next, arrow keys and Escape to close.
export default function EventGallery({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % photos.length));
      else if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className={styles.grid} data-count={Math.min(photos.length, 4)}>
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            className={`${styles.thumb} ${i === 0 ? styles.cover : ""}`}
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1} of ${photos.length} from ${title}`}
            data-cursor="VIEW"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          onClick={() => setOpen(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open]} alt="" onClick={(e) => e.stopPropagation()} />
          {photos.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.nav} ${styles.prev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open - 1 + photos.length) % photos.length);
                }}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                className={`${styles.nav} ${styles.next}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open + 1) % photos.length);
                }}
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          )}
          <button
            type="button"
            className={styles.close}
            onClick={() => setOpen(null)}
            aria-label="Close"
          >
            ×
          </button>
          <span className={styles.counter}>
            {open + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  );
}
