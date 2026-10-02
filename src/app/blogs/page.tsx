import type { Metadata } from "next";
import BlogView from "@/components/blogs/BlogView";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { BLOGS } from "@/lib/blogs";
import styles from "./blogs.module.css";

export const metadata: Metadata = {
  title: "Blogs — E-Cell SRMIST",
  description: "Updates, stories, and lessons from E-Cell SRMIST.",
};

// /blogs opens the latest post; the sidebar lists every post.
export default function BlogsPage() {
  if (BLOGS.length === 0) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={`wrap ${styles.main}`}>
          <h1 className={styles.heading}>Blogs</h1>
          <p className={styles.empty}>No posts yet — check back soon.</p>
        </main>
        <Footer />
      </div>
    );
  }
  return <BlogView post={BLOGS[0]} />;
}
