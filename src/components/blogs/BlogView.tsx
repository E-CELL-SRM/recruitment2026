import Image from "next/image";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { BLOGS, type BlogPost } from "@/lib/blogs";
import BlogSidebar from "./BlogSidebar";
import styles from "./BlogView.module.css";

// Shared layout for /blogs (latest post) and /blogs/[slug]: the open post on
// the left, a scrolling list of every post on the right.
export default function BlogView({ post }: { post: BlogPost }) {
  const isLatest = post.slug === BLOGS[0]?.slug;

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`wrap ${styles.layout}`}>
        <article className={styles.article}>
          <div className={styles.cover}>
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 960px) 100vw, 68vw"
              className={styles.coverImg}
            />
            {isLatest && <span className={styles.latestBadge}>LATEST POST</span>}
          </div>

          <h1 className={styles.title}>{post.title}</h1>

          <div className={styles.metaRow}>
            <div className={styles.tags}>
              {post.tags.map((t) => (
                <span key={t} className={styles.tag}>
                  {t}
                </span>
              ))}
            </div>
            <div className={styles.byline}>
              <strong>{post.author}</strong>
              <span>{post.date}</span>
            </div>
          </div>

          <div className={styles.body}>
            {post.body.map((block, i) => {
              if (typeof block === "string") return <p key={i}>{block}</p>;
              if ("heading" in block)
                return (
                  <h2 key={i} className={styles.subheading}>
                    {block.heading}
                  </h2>
                );
              if ("takeaway" in block)
                return (
                  <p key={i} className={styles.takeaway}>
                    <strong>The Takeaway:</strong> {block.takeaway}
                  </p>
                );
              return (
                <p key={i} className={styles.hashtags}>
                  {block.hashtags.map((h) => `#${h}`).join(" ")}
                </p>
              );
            })}
          </div>
        </article>

        <BlogSidebar posts={BLOGS} activeSlug={post.slug} />
      </main>
      <Footer />
    </div>
  );
}
