// ---------------------------------------------------------------------
// Events shown on /events. Add a new entry to EVENTS for each event —
// the page lists them in this order, so keep upcoming ones first.
// ---------------------------------------------------------------------

export interface EventItem {
  id: string;
  title: string;
  description: string;
  // Free-form so it can read "TBA" or "Mar 14–15, 2027".
  date: string;
  venue: string;
  tag: string;
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
    venue: "SRMIST",
    tag: "Coming Soon",
  },
];
