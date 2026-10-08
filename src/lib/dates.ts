// Small date helpers shared by the admin forms and API routes. Dates travel as
// "YYYY-MM-DD" strings (what <input type="date"> gives) and are formatted by
// hand, so the day never shifts with the viewer's time zone.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

function parts(ymd: string) {
  const m = YMD.exec(ymd);
  return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null;
}

export function isValidYmd(ymd: unknown): ymd is string {
  if (typeof ymd !== "string") return false;
  const p = parts(ymd);
  if (!p || p.y < 1970 || p.y > 2100) return false;
  const check = new Date(Date.UTC(p.y, p.m - 1, p.d));
  return check.getUTCFullYear() === p.y && check.getUTCMonth() === p.m - 1 && check.getUTCDate() === p.d;
}

// "2026-10-02" -> "Oct 2, 2026"
export function formatYmd(ymd: string): string {
  const p = parts(ymd)!;
  return `${MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
}

// "2027-03" -> "March 2027"
export function formatYearMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

// "Mar 14–15, 2027", "Mar 30 – Apr 2, 2027" or "Dec 30, 2026 – Jan 2, 2027".
export function formatYmdRange(start: string, end: string): string {
  if (start === end) return formatYmd(start);
  const a = parts(start)!;
  const b = parts(end)!;
  if (a.y !== b.y) return `${formatYmd(start)} – ${formatYmd(end)}`;
  if (a.m !== b.m) return `${MONTHS[a.m - 1]} ${a.d} – ${MONTHS[b.m - 1]} ${b.d}, ${a.y}`;
  return `${MONTHS[a.m - 1]} ${a.d}–${b.d}, ${a.y}`;
}

// Noon in India on that day, as an ISO timestamp (used to order posts).
export function ymdToIso(ymd: string): string {
  return new Date(`${ymd}T12:00:00+05:30`).toISOString();
}

// The two ways an admin dates a post: "auto" is the moment it's saved (shown
// in India's calendar day), "manual" is a picked YYYY-MM-DD. Null if a manual
// date is missing or invalid.
export function postDate(
  mode: unknown,
  picked: unknown,
): { publishedAt: string; date: string } | null {
  if (mode === "manual") {
    if (!isValidYmd(picked)) return null;
    return { publishedAt: ymdToIso(picked), date: formatYmd(picked) };
  }
  const now = new Date();
  return {
    publishedAt: now.toISOString(),
    date: now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }),
  };
}
