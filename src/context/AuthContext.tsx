"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { upsertUserProfile, UserProfile } from "@/lib/firestore";

export type { UserProfile };

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signInWithEmailOnly: (email: string, fullName?: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync the signed-in user's profile straight to Firestore (the "auth db").
  // The email/name/photo all come from the Firebase Auth session itself —
  // nothing is re-typed or re-collected here.
  const syncUserToFirestore = async (firebaseUser: User, authType: "google" | "email" = "google") => {
    const profileData: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      lastLoginAt: new Date().toISOString(),
    };

    try {
      const saved = await upsertUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        authType,
      });
      setUserProfile(saved);
    } catch (err) {
      console.error("Error syncing user to Firestore:", err);
      // Even if the DB sync fails, keep the client user profile in state
      setUserProfile(profileData);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        console.warn("Auth persistence notice:", e);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserToFirestore(currentUser);
      } else {
        // Check if there is an email-only signed-in candidate profile stored
        try {
          const cachedProfile = localStorage.getItem("ecell_candidate_profile");
          if (cachedProfile) {
            setUserProfile(JSON.parse(cachedProfile));
          } else {
            setUserProfile(null);
          }
        } catch {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmailOnly = useCallback(
    async (email: string, fullName?: string): Promise<UserProfile> => {
      setAuthError(null);
      const cleanEmail = email.trim().toLowerCase();
      const derivedName = fullName?.trim() || cleanEmail.split("@")[0] || "Candidate";
      const candidateUid = "candidate_" + btoa(cleanEmail).replace(/=/g, "").slice(0, 20);

      const profileData: UserProfile = {
        uid: candidateUid,
        email: cleanEmail,
        displayName: derivedName,
        photoURL: null,
        lastLoginAt: new Date().toISOString(),
      };

      try {
        const saved = await upsertUserProfile({
          uid: candidateUid,
          email: cleanEmail,
          displayName: derivedName,
          photoURL: null,
          authType: "email",
        });
        setUserProfile(saved);
        try {
          localStorage.setItem("ecell_candidate_profile", JSON.stringify(saved));
        } catch {}
        return saved;
      } catch (e) {
        console.warn("Firestore candidate sync notice:", e);
      }

      setUserProfile(profileData);
      try {
        localStorage.setItem("ecell_candidate_profile", JSON.stringify(profileData));
      } catch {}

      return profileData;
    },
    []
  );

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;
      setUser(signedInUser);
      await syncUserToFirestore(signedInUser, "google");
      return signedInUser;
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string } | undefined;
      if (err?.code === "auth/popup-closed-by-user") {
        console.info("Google sign-in popup was closed by user.");
        setAuthError(null);
        return null;
      }
      if (err?.code === "auth/cancelled-popup-request") {
        console.info("Google sign-in popup request was cancelled.");
        setAuthError(null);
        return null;
      }

      console.warn("Google sign in notice:", error);
      let errorMsg = "Unable to complete Google sign-in. Please try again.";
      if (err?.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setUserProfile(null);
      try {
        localStorage.removeItem("ecell_candidate_profile");
      } catch {}
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithEmailOnly,
        signOut,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
