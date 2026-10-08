"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { BlogPost } from "@/lib/blogs";
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
        <ul className={styles.postList} data-lenis-prevent>
          {visible.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blogs/${post.slug}`}
                className={`${styles.postItem} ${
                  post.slug === activeSlug ? styles.postItemActive : ""
                } ${post.slug === latestSlug ? styles.postItemLatest : ""}`}
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
          ))}
          {visible.length === 0 && (
            <li className={styles.noResults}>No posts match &ldquo;{query}&rdquo;.</li>
          )}
        </ul>
      </div>
    </aside>
  );
}
