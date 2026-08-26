# E-Cell SRMIST — Recruitment 2026

Recruitment website for E-Cell SRMIST built with Next.js.

- **Auth:** Firebase Authentication (Google Sign-In, plus an email-only fallback)
- **Database:** Cloud Firestore — stores `users` and `applications`

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```
   npm install
   ```

2. Firebase config is already provided via `firebase-applet-config.json` — no
   extra env vars are needed unless you rotate the project's keys. It's used
   for both Google Sign-In and the Firestore database (a named database,
   `firestoreDatabaseId`, not the default one — see `src/lib/firebase.ts`).

3. (Recommended) Deploy the included security rules so writes are validated
   server-side instead of trusted purely from the client:
   ```
   firebase deploy --only firestore:rules
   ```
   (or paste `firestore.rules` into Firebase Console → Firestore Database → Rules)

4. Run the app:
   ```
   npm run dev
   ```

## Data model

- **`users/{uid}`** — one doc per authenticated candidate (uid, email, display
  name, photo, auth type, timestamps). Doc ID is the Firebase Auth `uid`, so
  signing in again updates the same doc instead of creating a duplicate.
- **`applications/{id}`** — one doc per submitted recruitment application. Doc
  ID is the generated tracking ID (e.g. `EC26-TECH-1234`). Includes `userId`
  linking back to the `users` doc.

**The candidate's email is only ever collected once**, from the signed-in
Firebase Auth session (Google Sign-In, or the email-only fallback). That same
email is written to both the `users` doc and every `applications` doc for
that candidate — the recruitment form itself has no email input field. See
`src/context/AuthContext.tsx` (writes the `users` doc on sign-in) and
`src/context/ApplyModalContext.tsx` / `src/components/modal/ApplyModal.tsx`
(reuses `activeCandidate.email` when writing the `applications` doc).

All reads/writes go through `src/lib/firestore.ts`, using the Firestore
client SDK directly from the browser (no server API routes needed).
