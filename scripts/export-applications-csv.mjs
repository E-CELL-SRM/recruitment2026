/**
 * Exports every document in the `applications` Firestore collection to a
 * CSV file that you can open directly in Google Sheets (File -> Import).
 *
 * SETUP (one-time)
 * -----------------
 * 1. Firebase Console -> Project settings (gear icon) -> Service accounts
 *    -> "Generate new private key". This downloads a JSON file.
 * 2. Save it into this project as: scripts/service-account.json
 *    (this filename is already gitignored-safe — do NOT commit it or
 *    share it, it grants full admin access to your Firebase project)
 * 3. Install the one dependency this script needs:
 *      npm install firebase-admin
 *
 * RUN
 * ---
 *   node scripts/export-applications-csv.mjs
 *
 * This writes applications-export.csv in the project root. Open Google
 * Sheets -> File -> Import -> Upload -> select that file -> "Replace
 * spreadsheet" or "Insert new sheet".
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// Must match `firestoreDatabaseId` in firebase-applet-config.json — this
// project does NOT use Firestore's "(default)" database.
const FIRESTORE_DATABASE_ID =
  "ai-studio-recruitment2026-19ddb4c5-2033-4dcd-be80-d274215eed06";

const COLLECTION = "applications";

// Column order for the CSV — matches the ApplicationData shape in
// src/lib/firestore.ts. Add/remove fields here if that shape changes.
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
];

function csvEscape(value) {
  const str = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  const serviceAccountPath = join(__dirname, "service-account.json");
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  } catch {
    console.error(
      `\nMissing scripts/service-account.json.\nDownload it from Firebase Console -> Project settings -> Service accounts -> Generate new private key, then save it at that path.\n`
    );
    process.exit(1);
  }

  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore(FIRESTORE_DATABASE_ID);

  const snap = await db.collection(COLLECTION).get();
  const rows = snap.docs.map((d) => d.data());

  // Newest first
  rows.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  const lines = [COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(COLUMNS.map((col) => csvEscape(row[col])).join(","));
  }

  const outPath = join(projectRoot, "applications-export.csv");
  writeFileSync(outPath, lines.join("\n"), "utf8");

  console.log(`\nExported ${rows.length} applications to ${outPath}\n`);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
