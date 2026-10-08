// ---------------------------------------------------------------------
// Events shown on /events. Events are added from /admin (the Events tab) and
// stored in Firestore — see eventsServer.ts. EVENTS below is only the
// fallback shown while there are no upcoming events.
// ---------------------------------------------------------------------

export type EventStatus = "upcoming" | "past";

export interface EventItem {
  id: string;
  title: string;
  description: string;
  // Free-form so it can read "TBA", "Mar 14–15, 2027" or "March 2027".
  date: string;
  // Optional YYYY-MM-DD used only to order events; "" when the date is vague.
  sortDate: string;
  venue: string;
  tag: string;
  status: EventStatus;
  // Photo URLs (served from /api/event-image/<id>), shown as a gallery.
  photos: string[];
  // Optional registration / details link.
  link?: string;
}

export const EVENTS: EventItem[] = [
  {
    id: "upcoming-event-placeholder",
    title: "Upcoming Events",
    description:
      "Details for E-Cell SRMIST's next events will be posted here. Check back soon.",
    date: "TBA",
    sortDate: "",
    venue: "SRMIST",
    tag: "Coming Soon",
    status: "upcoming",
    photos: [],
  },
];
