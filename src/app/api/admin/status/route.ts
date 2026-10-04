import { NextRequest, NextResponse } from "next/server";
import { isValidAdminPassword } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";

// POST /api/admin/status  { password }
//
// Tells the admin page whether publishing can actually work right now, by
// really talking to Firestore with the service account — so a missing or
// wrong key shows up before anyone uploads a PDF. Never returns the key.

const CHECK_TIMEOUT_MS = 8000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !isValidAdminPassword(body.password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw || !raw.trim()) {
    return NextResponse.json({
      ready: false,
      problem:
        "FIREBASE_SERVICE_ACCOUNT_KEY isn't set. Paste the Firebase service-account JSON into .env.local (and into Vercel's environment variables), then restart the server.",
    });
  }

  try {
    const key = JSON.parse(raw);
    if (!key.client_email || !key.private_key) throw new Error("incomplete");
  } catch {
    return NextResponse.json({
      ready: false,
      problem:
        "FIREBASE_SERVICE_ACCOUNT_KEY is set but isn't a valid service-account JSON. Paste the whole downloaded file on one line, wrapped in single quotes.",
    });
  }

  try {
    await Promise.race([
      getAdminDb().collection("blogs").limit(1).get(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timed out")), CHECK_TIMEOUT_MS),
      ),
    ]);
    return NextResponse.json({ ready: true });
  } catch (err) {
    return NextResponse.json({
      ready: false,
      problem: `The key is set but Firestore rejected it: ${
        err instanceof Error ? err.message : "unknown error"
      }`,
    });
  }
}
