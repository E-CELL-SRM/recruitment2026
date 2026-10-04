import { NextRequest, NextResponse } from "next/server";
import { isValidAdminPassword } from "@/lib/adminAuth";

// POST /api/admin/verify  { password }  ->  200 if it's the admin password.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !isValidAdminPassword(body.password)) {
    // Slow down guessing a little.
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
