import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Server-only Firestore access with the service account (bypasses
// firestore.rules). Used by the cron export and the admin blog route.
const FIRESTORE_DATABASE_ID =
  "ai-studio-recruitment2026-19ddb4c5-2033-4dcd-be80-d274215eed06";

export function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY env var");
  }
  return JSON.parse(raw);
}

export function getAdminDb() {
  const appName = "export-to-sheets-admin";
  const existing = getApps().find((a) => a.name === appName);
  const app =
    existing ||
    initializeApp({ credential: cert(getServiceAccount()) }, appName);
  return getFirestore(app, FIRESTORE_DATABASE_ID);
}
