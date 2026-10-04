import Image from "next/image";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { BLOGS_INTRO, type BlogPost } from "@/lib/blogs";
import BlogBanner from "./BlogBanner";
import styles from "./BlogsLanding.module.css";

// The /blogs landing page: a welcome, with a banner of every post below it.
export default function BlogsLanding({ posts }: { posts: BlogPost[] }) {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`wrap ${styles.main}`}>
        <section className={styles.intro}>
          <div className={styles.introText}>
            <div className={styles.eyebrow}>E-CELL SRMIST / BLOGS</div>
            <h1 className={styles.title}>{BLOGS_INTRO.title}</h1>
            {BLOGS_INTRO.body.map((p, i) => (
              <p key={i} className={styles.lede}>
                {p}
              </p>
            ))}
          </div>
          <div className={styles.introImage}>
            <Image
              src={BLOGS_INTRO.image}
              alt={BLOGS_INTRO.title}
              fill
              priority
              sizes="(max-width: 960px) 100vw, 45vw"
              className={styles.introImg}
            />
          </div>
        </section>

        <section className={styles.bannerSection} aria-label="All posts">
          <h2 className={styles.bannerHeading}>
            All Posts <span className={styles.rule} />
          </h2>
          <BlogBanner posts={posts} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
