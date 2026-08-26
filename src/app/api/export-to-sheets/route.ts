import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { google } from "googleapis";

// ---------------------------------------------------------------------
// GET /api/export-to-sheets
//
// Pulls every doc from the `applications` Firestore collection and
// overwrites a Google Sheet with the current data. Meant to be called
// on a schedule by Vercel Cron (see vercel.json) — not by end users.
//
// Required environment variables (set in Vercel Project Settings ->
// Environment Variables, NOT committed to the repo):
//
//   FIREBASE_SERVICE_ACCOUNT_KEY   full JSON key, as a single-line string
//   GOOGLE_SHEET_ID                the ID from the sheet's URL
//   CRON_SECRET                    any random string you choose
//
// The same service account is used for both Firestore and Sheets, so:
//   1. Enable the "Google Sheets API" for that service account's GCP
//      project (console.cloud.google.com -> APIs & Services -> Library).
//   2. Share the target Google Sheet with the service account's
//      client_email (found inside the key JSON) as an Editor.
// ---------------------------------------------------------------------

const FIRESTORE_DATABASE_ID =
  "ai-studio-recruitment2026-19ddb4c5-2033-4dcd-be80-d274215eed06";

const COLUMNS = [
  "id",
  "submittedAt",
  "fullName",
  "applicantEmail",
  "regNumber",
  "domain",
  "subDomain",
  "year",
  "phone",
  "skillsOrExperience",
  "portfolioUrl",
  "reason",
  "userId",
] as const;

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY env var");
  }
  return JSON.parse(raw);
}

function getFirestoreDb() {
  const serviceAccount = getServiceAccount();
  const appName = "export-to-sheets-admin";
  const existing = getApps().find((a) => a.name === appName);
  const app =
    existing ||
    initializeApp({ credential: cert(serviceAccount) }, appName);
  return getFirestore(app, FIRESTORE_DATABASE_ID);
}

async function getSheetsClient() {
  const serviceAccount = getServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function GET(req: NextRequest) {
  // Verify this call came from Vercel Cron (or someone with the secret),
  // not a random public request hitting the route.
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    return NextResponse.json(
      { error: "Missing GOOGLE_SHEET_ID env var" },
      { status: 500 }
    );
  }

  try {
    const db = getFirestoreDb();
    const snap = await db.collection("applications").get();
    const rows = snap.docs.map((d) => d.data());
    rows.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

    const values = [
      [...COLUMNS],
      ...rows.map((row) => COLUMNS.map((col) => row[col] ?? "")),
    ];

    const sheets = await getSheetsClient();

    // Clear the sheet first so removed/edited docs don't leave stale rows.
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: "Sheet1",
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Sheet1!A1",
      valueInputOption: "RAW",
      requestBody: { values },
    });

    return NextResponse.json({
      ok: true,
      exported: rows.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("export-to-sheets failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
