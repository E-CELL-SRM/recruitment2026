import type { Metadata } from "next";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import EventGallery from "@/components/events/EventGallery";
import { EVENTS, type EventItem } from "@/lib/events";
import { getAllEvents } from "@/lib/eventsServer";
import styles from "../blogs/blogs.module.css";
import eventStyles from "./events.module.css";

export const metadata: Metadata = {
  title: "Events — E-Cell SRMIST",
  description: "Events hosted by E-Cell SRMIST.",
};

// Events added from /admin show up within a minute (and immediately, since
// saving one also revalidates this page).
export const revalidate = 60;

function EventCard({ event }: { event: EventItem }) {
  return (
    <div className={styles.card}>
      <div className={styles.meta}>
        <span className={styles.tag}>{event.tag}</span>
        <span>{event.date}</span>
      </div>
      <h2 className={styles.cardTitle}>{event.title}</h2>
      {event.description && <p className={styles.excerpt}>{event.description}</p>}
      <EventGallery photos={event.photos} title={event.title} />
      {event.venue && <span className={styles.byline}>{event.venue}</span>}
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
  );
}

export default async function EventsPage() {
  const { upcoming, past } = await getAllEvents();
  // With nothing scheduled, show the "check back soon" card instead.
  const shownUpcoming = upcoming.length > 0 ? upcoming : EVENTS;

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`wrap ${styles.main}`}>
        <div className={styles.eyebrow}>E-CELL SRMIST / EVENTS</div>
        <h1 className={styles.heading}>Events</h1>
        <p className={styles.lede}>
          Summits, workshops, and meetups hosted by E-Cell SRMIST.
        </p>

        {past.length > 0 && (
          <h2 className={eventStyles.sectionHeading}>
            Upcoming <span className={eventStyles.rule} />
          </h2>
        )}
        <div className={styles.grid}>
          {shownUpcoming.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {past.length > 0 && (
          <>
            <h2 className={`${eventStyles.sectionHeading} ${eventStyles.pastHeading}`}>
              Past Events <span className={eventStyles.rule} />
            </h2>
            <div className={styles.grid}>
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
