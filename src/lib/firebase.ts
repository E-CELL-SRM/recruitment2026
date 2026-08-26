import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

// NOTE: Firebase is now used for BOTH Authentication (Google Sign-In) AND
// data storage (Cloud Firestore). Neon/Postgres has been removed — see
// src/lib/firestore.ts for the read/write helpers and firestore.rules for
// the security rules that guard the `users` and `applications` collections.
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Initialize Firestore. The applet was provisioned with a named (non-default)
// Firestore database — its ID lives in firebase-applet-config.json. Passing
// it explicitly here is required, otherwise the SDK talks to the (nonexistent)
// "(default)" database and every read/write fails.
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export default app;
