"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { BlogPost } from "@/lib/blogs";
import { useMarquee } from "./useMarquee";
import styles from "./BlogView.module.css";

interface Props {
  // Newest first — the first entry is flagged as the latest post.
  posts: BlogPost[];
  activeSlug: string;
}

export default function BlogSidebar({ posts, activeSlug }: Props) {
  const [query, setQuery] = useState("");
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

  // The list cycles on its own, except while the visitor is searching.
  const { ref, loop, copies, handlers } = useMarquee<HTMLUListElement>({
    axis: "y",
    count: visible.length,
    enabled: !query.trim(),
  });

  const renderItem = (post: BlogPost, copy: number, index: number) => {
    const dup = copy > 0;
    return (
      <li
        key={`${post.slug}-${copy}`}
        aria-hidden={dup || undefined}
        data-dup={copy === 1 && index === 0 ? "" : undefined}
      >
        <Link
          href={`/blogs/${post.slug}`}
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
          ref={ref}
          className={`${styles.postList} ${loop ? styles.postListLoop : ""}`}
          data-lenis-prevent
          {...handlers}
        >
          {Array.from({ length: copies }, (_, c) =>
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
