import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// -----------------------------------------------------------------------
// Collections
// -----------------------------------------------------------------------
// users/{uid}          — one doc per authenticated candidate
// applications/{id}    — one doc per submitted recruitment application
//
// The candidate's email is NEVER re-typed into a form. It is read once from
// the Firebase Auth session (or the email-only fallback profile) and reused
// for both the `users` doc and the `applications` doc — see
// AuthContext.syncUserToFirestore and ApplyModalContext.saveApplication.
// -----------------------------------------------------------------------

const USERS_COLLECTION = "users";
const APPLICATIONS_COLLECTION = "applications";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  authType?: "google" | "email";
  createdAt?: string;
  lastLoginAt?: string;
}

export interface ApplicationData {
  id: string;
  userId?: string;
  applicantEmail: string;
  fullName: string;
  regNumber: string;
  domain: string;
  subDomain?: string;
  phone: string;
  year: string;
  skillsOrExperience?: string;
  reason?: string;
  portfolioUrl?: string;
  submittedAt: string;
}

function generateTrackingId(domain: string) {
  const domainCode = (domain || "GEN").toUpperCase().slice(0, 4);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `EC26-${domainCode}-${randomNum}`;
}

// ---------------------------------------------------------------------
// Users (auth DB) — keyed by Firebase uid, so signing in again just
// updates the same doc instead of creating a duplicate.
// ---------------------------------------------------------------------

export async function upsertUserProfile(input: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  authType?: "google" | "email";
}): Promise<UserProfile> {
  const ref = doc(db, USERS_COLLECTION, input.uid);
  const now = new Date().toISOString();

  const existingSnap = await getDoc(ref);
  const createdAt = existingSnap.exists()
    ? (existingSnap.data().createdAt as string) || now
    : now;

  const profile: UserProfile = {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    photoURL: input.photoURL,
    authType: input.authType || "google",
    createdAt,
    lastLoginAt: now,
  };

  await setDoc(ref, profile, { merge: true });
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

// ---------------------------------------------------------------------
// Applications (form DB) — applicantEmail/userId come straight from the
// signed-in profile the caller passes in; no separate email field is
// ever collected on the form itself.
// ---------------------------------------------------------------------

export async function createApplication(
  input: Omit<ApplicationData, "id" | "submittedAt">
): Promise<ApplicationData> {
  const id = generateTrackingId(input.domain);
  const submittedAt = new Date().toISOString();

  const application: ApplicationData = {
    ...input,
    applicantEmail: (input.applicantEmail || "").toLowerCase(),
    id,
    submittedAt,
  };

  const ref = doc(db, APPLICATIONS_COLLECTION, id);
  await setDoc(ref, application);
  return application;
}

export async function getApplicationsByEmail(
  email: string
): Promise<ApplicationData[]> {
  if (!email) return [];

  const q = query(
    collection(db, APPLICATIONS_COLLECTION),
    where("applicantEmail", "==", email.toLowerCase())
  );
  const snap = await getDocs(q);

  const applications = snap.docs.map((d) => d.data() as ApplicationData);
  // Sorted client-side (newest first) so we don't require a composite
  // Firestore index just for this query.
  applications.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  return applications;
}
