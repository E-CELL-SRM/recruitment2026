"use client";

import Link from "next/link";
import type { BlogPost } from "@/lib/blogs";
import { useMarquee } from "./useMarquee";
import styles from "./BlogsLanding.module.css";

// Horizontal banner of every post. It cycles sideways on its own until the
// pointer is on it; the newest post carries the green LATEST tag.
export default function BlogBanner({ posts }: { posts: BlogPost[] }) {
  const latestSlug = posts[0]?.slug;
  const { ref, loop, copies, handlers } = useMarquee<HTMLUListElement>({
    axis: "x",
    count: posts.length,
  });

  if (posts.length === 0) {
    return <p className={styles.empty}>No posts yet — check back soon.</p>;
  }

  return (
    <ul
      ref={ref}
      className={`${styles.banner} ${loop ? styles.bannerLoop : ""}`}
      data-lenis-prevent
      {...handlers}
    >
      {Array.from({ length: copies }, (_, c) =>
        posts.map((post, i) => {
          const dup = c > 0;
          return (
            <li
              key={`${post.slug}-${c}`}
              className={styles.bannerItem}
              aria-hidden={dup || undefined}
              data-dup={c === 1 && i === 0 ? "" : undefined}
            >
              <Link
                href={`/blogs/${post.slug}`}
                className={`${styles.bannerCard} ${
                  post.slug === latestSlug ? styles.bannerCardLatest : ""
                }`}
                tabIndex={dup ? -1 : undefined}
                data-cursor="READ"
              >
                <span className={styles.bannerImgWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.image} alt="" className={styles.bannerImg} />
                  {post.slug === latestSlug && (
                    <span className={styles.latestTag}>LATEST</span>
                  )}
                </span>
                <span className={styles.bannerMeta}>
                  {post.tags[0]} · {post.date}
                </span>
                <span className={styles.bannerTitle}>{post.title}</span>
              </Link>
            </li>
          );
        }),
      )}
    </ul>
  );
}
