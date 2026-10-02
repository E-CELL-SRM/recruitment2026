import type { Metadata } from "next";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { EVENTS } from "@/lib/events";
import styles from "../blogs/blogs.module.css";

export const metadata: Metadata = {
  title: "Events — E-Cell SRMIST",
  description: "Events hosted by E-Cell SRMIST.",
};

export default function EventsPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`wrap ${styles.main}`}>
        <div className={styles.eyebrow}>E-CELL SRMIST / EVENTS</div>
        <h1 className={styles.heading}>Events</h1>
        <p className={styles.lede}>
          Summits, workshops, and meetups hosted by E-Cell SRMIST.
        </p>

        {EVENTS.length === 0 ? (
          <p className={styles.empty}>No events scheduled — check back soon.</p>
        ) : (
          <div className={styles.grid}>
            {EVENTS.map((event) => (
              <div key={event.id} className={styles.card}>
                <div className={styles.meta}>
                  <span className={styles.tag}>{event.tag}</span>
                  <span>{event.date}</span>
                </div>
                <h2 className={styles.cardTitle}>{event.title}</h2>
                <p className={styles.excerpt}>{event.description}</p>
                <span className={styles.byline}>{event.venue}</span>
                {event.link && (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.readMore}
                    data-cursor="OPEN"
                  >
                    VIEW DETAILS →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
