"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApplyModal } from "@/context/ApplyModalContext";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Database,
  Lock,
  LogOut,
} from "lucide-react";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signInWithEmailOnly, signOut, authError, clearAuthError } = useAuth();
  const { openApplyModal, fetchUserApplications } = useApplyModal();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [isManualSigningIn, setIsManualSigningIn] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchUserApplications(user.email);
    }
  }, [user, fetchUserApplications]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser?.email) {
        await fetchUserApplications(loggedUser.email);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const trimmedName = manualName.trim();
    const trimmedEmail = manualEmail.trim();

    if (!trimmedName) {
      setManualError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setManualError("Please enter a valid email address.");
      return;
    }

    setIsManualSigningIn(true);
    try {
      const profile = await signInWithEmailOnly(trimmedEmail, trimmedName);
      if (profile.email) {
        await fetchUserApplications(profile.email);
      }
    } catch {
      setManualError("Something went wrong signing you in. Please try again.");
    } finally {
      setIsManualSigningIn(false);
    }
  };

  const handleApplyNow = () => {
    router.push("/#domains");
    setTimeout(() => {
      openApplyModal();
    }, 400);
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.bgNoise} />

      {/* Top Bar */}
      <header className={styles.topBar}>
        <Link href="/" className={styles.brandLink}>
          <Image
            src="/assets/logowhite.png"
            alt="E-Cell SRMIST logo"
            width={28}
            height={36}
            priority
          />
          <div>
            <span className={styles.brandText}>E-CELL SRMIST</span>
            <span className={styles.brandSub}>CANDIDATE PORTAL 2026</span>
          </div>
        </Link>

        <Link href="/" className={styles.backHome}>
          <ArrowLeft size={14} /> Back to Website
        </Link>
      </header>

      {/* Main Login Box */}
      <main className={styles.mainContainer}>
        <div className={styles.loginCard}>
          <div className={styles.cardGlow} />

          <div className={styles.badge}>
            <span className={styles.pulseDot} />
            AUTHENTICATED ACCESS
          </div>

          <h1 className={styles.title}>
            {user ? (
              <>
                WELCOME, <span className={styles.titleAccent}>{user.displayName?.split(" ")[0]?.toUpperCase() || "CANDIDATE"}</span>
              </>
            ) : (
              <>
                SIGN IN WITH <span className={styles.titleAccent}>GOOGLE</span>
              </>
            )}
          </h1>

          <p className={styles.subtitle}>
            {user
              ? "Your Google account is verified and securely connected to the recruitment database."
              : "Sign in with Google for a one-tap verified login, or enter your name and email manually if you'd rather not use Google."}
          </p>

          {authError && <div className={styles.authError}>{authError}</div>}

          {user ? (
            <div>
              <div className={styles.userBox}>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User avatar"}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.displayName || "Candidate"}</div>
                  <div className={styles.userEmail}>{user.email}</div>
                  <div className={styles.userRole}>Verified Google Identity</div>
                </div>
              </div>

              <div className={styles.actionStack}>
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={handleApplyNow}
                >
                  PROCEED TO APPLICATION <ArrowRight size={14} />
                </button>

                <Link href="/" className={styles.secondaryAction}>
                  EXPLORE DOMAINS & TRACKS
                </Link>

                <button
                  type="button"
                  className={styles.signOutBtn}
                  onClick={() => signOut()}
                >
                  <LogOut size={12} style={{ display: "inline", marginRight: 4 }} /> Sign out from this device
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                className={styles.googleBtn}
                onClick={handleGoogleLogin}
                disabled={isSigningIn || loading}
              >
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                  />
                </svg>
                {isSigningIn ? "CONNECTING TO GOOGLE..." : "CONTINUE WITH GOOGLE"}
              </button>

              {!showManualForm ? (
                <button
                  type="button"
                  className={styles.manualToggle}
                  onClick={() => {
                    setShowManualForm(true);
                    setManualError(null);
                    clearAuthError();
                  }}
                >
                  Or enter your name & email manually
                </button>
              ) : (
                <form className={styles.manualForm} onSubmit={handleManualSubmit}>
                  <div className={styles.manualField}>
                    <label htmlFor="manual-name">Full Name</label>
                    <input
                      id="manual-name"
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div className={styles.manualField}>
                    <label htmlFor="manual-email">Email</label>
                    <input
                      id="manual-email"
                      type="email"
                      placeholder="you@srmist.edu.in"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  {manualError && <div className={styles.authError}>{manualError}</div>}

                  <button
                    type="submit"
                    className={styles.manualSubmit}
                    disabled={isManualSigningIn}
                  >
                    {isManualSigningIn ? "SIGNING IN..." : "CONTINUE"}
                  </button>
                  <button
                    type="button"
                    className={styles.manualCancel}
                    onClick={() => {
                      setShowManualForm(false);
                      setManualError(null);
                    }}
                  >
                    Back to Google sign-in
                  </button>
                </form>
              )}

              <div className={styles.divider}>SECURE DATABASE STORAGE</div>

              <div className={styles.secList}>
                <div className={styles.secItem}>
                  <ShieldCheck size={16} />
                  <span>Your email is authenticated securely via Google OAuth.</span>
                </div>
                <div className={styles.secItem}>
                  <Database size={16} />
                  <span>Applications & candidate records sync with our secure database.</span>
                </div>
                <div className={styles.secItem}>
                  <Lock size={16} />
                  <span>Eliminates fake submissions and manual SRM email errors.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer info */}
      <footer className={styles.bottomBar}>
        <div>E-CELL SRMIST RECRUITMENT 2026</div>
        <div>
          DATABASE STATUS: <span className={styles.dbTag}>CONNECTED (CLOUD PERSISTENCE)</span>
        </div>
      </footer>
    </div>
  );
}
