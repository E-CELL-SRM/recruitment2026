import { timingSafeEqual } from "crypto";

// Server-only: imported by the /api/admin/* route handlers, never by client
// code, so the password is checked on the server and isn't shipped in the
// site's JavaScript.
const ADMIN_PASSWORD = "ecellrocks";

export function isValidAdminPassword(candidate: unknown): boolean {
  if (typeof candidate !== "string") return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}
