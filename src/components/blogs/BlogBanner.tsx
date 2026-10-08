"use client";

import Link from "next/link";
import type { BlogPost } from "@/lib/blogs";
import styles from "./BlogsLanding.module.css";

// Horizontal banner of every post, each shown exactly once — scroll sideways
// if they don't all fit. The newest post carries the green LATEST tag.
export default function BlogBanner({ posts }: { posts: BlogPost[] }) {
  const latestSlug = posts[0]?.slug;

  if (posts.length === 0) {
    return <p className={styles.empty}>No posts yet — check back soon.</p>;
  }

  return (
    <ul className={styles.banner} data-lenis-prevent>
      {posts.map((post) => (
        <li key={post.slug} className={styles.bannerItem}>
          <Link
            href={`/blogs/${post.slug}`}
            className={`${styles.bannerCard} ${
              post.slug === latestSlug ? styles.bannerCardLatest : ""
            }`}
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
      ))}
    </ul>
  );
}
