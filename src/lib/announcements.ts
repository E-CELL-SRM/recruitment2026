// ---------------------------------------------------------------------
// Recruitment announcements shown from the notification bell in the
// navbar. Add a new entry to ANNOUNCEMENTS for each new announcement —
// newest first. Each announcement can carry different copy/links per
// domain, since e.g. WhatsApp group invites differ per domain and some
// domains may not have one yet (set that domain's entry to `null`).
// ---------------------------------------------------------------------

export type DomainId = "technical" | "creative" | "corporate" | "legal";

export const DOMAIN_LABELS: Record<DomainId, string> = {
  technical: "Technical",
  creative: "Creative",
  corporate: "Corporate",
  legal: "Legal & Finance",
};

// Single brand accent (green) across every domain, kept inside the site's
// white / green / black palette rather than a rainbow per domain.
export const DOMAIN_ACCENTS: Record<DomainId, { color: string; glow: string }> = {
  technical: { color: "#00c853", glow: "rgba(0, 200, 83, 0.35)" },
  creative: { color: "#00c853", glow: "rgba(0, 200, 83, 0.35)" },
  corporate: { color: "#00c853", glow: "rgba(0, 200, 83, 0.35)" },
  legal: { color: "#00c853", glow: "rgba(0, 200, 83, 0.35)" },
};

// The visual treatment each domain's WhatsApp-group card renders with once
// resolved. "classic" (Legal & Finance) reuses the plain dark card since it
// has no group yet — no point theming a "coming soon" message.
export const DOMAIN_THEME: Record<DomainId, "cyberpunk" | "comic" | "office" | "classic"> = {
  technical: "cyberpunk",
  creative: "comic",
  corporate: "office",
  legal: "classic",
};

export interface DomainAnnouncementContent {
  heading: string;
  message: string;
  ctaLabel: string;
  // null = no link yet for this domain (show a "coming soon" state instead)
  link: string | null;
}

export interface Announcement {
  id: string;
  date: string;
  badge: string;
  title: string;
  teaser: string;
  perDomain: Partial<Record<DomainId, DomainAnnouncementContent>>;
  // Shown for a domain with no entry in perDomain (e.g. Legal & Finance,
  // which doesn't have a WhatsApp group yet).
  fallbackMessage: string;
}

// Invite links come from env vars (set in .env.local, documented in
// .env.example) rather than being hardcoded here. A domain resolves to
// `null` if its var isn't set, which shows the "coming soon" card instead
// of a broken link.
const WHATSAPP_LINKS = {
  technical: process.env.NEXT_PUBLIC_WHATSAPP_TECHNICAL || null,
  creative: process.env.NEXT_PUBLIC_WHATSAPP_CREATIVE || null,
  corporate: process.env.NEXT_PUBLIC_WHATSAPP_CORPORATE || null,
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "whatsapp-groups-2026-09-06",
    date: "Sep 6, 2026",
    badge: "New Announcement",
    title: "Domain WhatsApp Groups Are Live",
    teaser:
      "We've opened dedicated WhatsApp groups so every domain can start coordinating ahead of the next round.",
    perDomain: {
      technical: {
        heading: "UPLINK ESTABLISHED",
        message:
          "SECTOR: TECHNICAL. Task drops, deadlines, and doubt-solving now route through this channel. Jack in.",
        ctaLabel: "JOIN_CHANNEL.exe",
        link: WHATSAPP_LINKS.technical,
      },
      creative: {
        heading: "CREATIVE SQUAD, ASSEMBLE!",
        message:
          "Every designer, editor, and storyteller in one thread — briefs, references, and drops swing in here first.",
        ctaLabel: "Swing Into The Group",
        link: WHATSAPP_LINKS.creative,
      },
      corporate: {
        heading: "Re: Corporate Group Now Open",
        message:
          "Per our last meeting — sponsorship leads, outreach, and event ops updates now go through this channel effective immediately.",
        ctaLabel: "Join The Group",
        link: WHATSAPP_LINKS.corporate,
      },
    },
    fallbackMessage:
      "Your domain's WhatsApp group is still being set up — we'll notify you here the moment it's ready.",
  },
];
