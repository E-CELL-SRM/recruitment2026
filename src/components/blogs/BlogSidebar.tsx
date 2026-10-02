"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { BlogPost } from "@/lib/blogs";
import styles from "./BlogView.module.css";

interface Props {
  // Newest first — the first entry is flagged as the latest post.
  posts: BlogPost[];
  activeSlug: string;
}

// Auto-scroll speed of the post list, in px per second.
const SCROLL_SPEED = 28;

export default function BlogSidebar({ posts, activeSlug }: Props) {
  const [query, setQuery] = useState("");
  // How many times the list is rendered. Extra copies let the auto-scroll
  // cycle endlessly, and enough of them are used to always fill the box.
  const [copies, setCopies] = useState(2);
  const listRef = useRef<HTMLUListElement>(null);
  const pausedRef = useRef(false);
  const latestSlug = posts[0]?.slug;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [posts, query]);

  // Cycle through the posts whenever there's more than one — but not while
  // the visitor is searching, since the list is then a set of results.
  const loop = !query.trim() && visible.length > 1;

  // Height of one full pass through the list (distance from an item to its
  // duplicate when looping, otherwise the whole content height).
  const getCycle = () => {
    const el = listRef.current;
    if (!el) return 0;
    const dup = el.querySelector<HTMLElement>("[data-dup]");
    const first = el.firstElementChild as HTMLElement | null;
    if (dup && first) return dup.offsetTop - first.offsetTop;
    return el.scrollHeight;
  };

  // A short list (e.g. two posts) is repeated until one pass is at least as
  // tall as the box, so there's always something to scroll into view.
  useEffect(() => {
    const measure = () => {
      const el = listRef.current;
      if (!loop || !el) return;
      const cycle = getCycle();
      if (cycle <= 0) return;
      const needed = Math.max(2, Math.ceil(el.clientHeight / cycle) + 1);
      setCopies((c) => (c === needed ? c : needed));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [loop, visible, copies]);

  // Vertical auto-scroll that runs until the pointer is over the list.
  useEffect(() => {
    const el = listRef.current;
    if (!loop || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = performance.now();
    let pos = el.scrollTop;

    const step = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      if (!pausedRef.current) {
        const cycle = getCycle();
        pos += (SCROLL_SPEED * dt) / 1000;
        if (cycle > 0 && pos >= cycle) pos -= cycle;
        el.scrollTop = pos;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // After a manual scroll, pick the animation up from where the user left off.
    const syncPos = () => {
      if (pausedRef.current) pos = el.scrollTop;
    };
    el.addEventListener("scroll", syncPos, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", syncPos);
    };
  }, [loop]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  const renderItem = (post: BlogPost, copy: number, index: number) => {
    const dup = copy > 0;
    return (
    <li
      key={`${post.slug}-${copy}`}
      aria-hidden={dup || undefined}
      data-dup={copy === 1 && index === 0 ? "" : undefined}
    >
      <Link
        href={post.slug === latestSlug ? "/blogs" : `/blogs/${post.slug}`}
        className={`${styles.postItem} ${
          post.slug === activeSlug ? styles.postItemActive : ""
        } ${post.slug === latestSlug ? styles.postItemLatest : ""}`}
        tabIndex={dup ? -1 : undefined}
        data-cursor="READ"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt="" className={styles.thumb} />
        <span className={styles.postText}>
          <span className={styles.postMeta}>
            {post.slug === latestSlug && (
              <span className={styles.latestTag}>LATEST</span>
            )}
            {post.date}
          </span>
          <span className={styles.postTitle}>{post.title}</span>
        </span>
      </Link>
    </li>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <label className={styles.search}>
        <input
          type="search"
          placeholder="Search posts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search posts"
        />
        <Search size={14} />
      </label>

      <div className={styles.widget}>
        <h3 className={styles.widgetTitle}>
          All Posts <span className={styles.rule} />
        </h3>
        <ul
          ref={listRef}
          className={`${styles.postList} ${loop ? styles.postListLoop : ""}`}
          data-lenis-prevent
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={resume}
          onTouchStart={pause}
          onTouchEnd={resume}
        >
          {Array.from({ length: loop ? copies : 1 }, (_, c) =>
            visible.map((post, i) => renderItem(post, c, i)),
          )}
          {visible.length === 0 && (
            <li className={styles.noResults}>No posts match &ldquo;{query}&rdquo;.</li>
          )}
        </ul>
      </div>
    </aside>
  );
}
