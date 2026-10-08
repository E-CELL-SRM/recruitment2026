"use client";

import { useState } from "react";
import Link from "next/link";
import ApplicationsPanel from "@/components/admin/ApplicationsPanel";
import BlogPublisher from "@/components/admin/BlogPublisher";
import BlogDateManager from "@/components/admin/BlogDateManager";
import EventsManager from "@/components/admin/EventsManager";

// ---------------------------------------------------------------------
// /admin — password-protected dashboard with three sections, picked from the
// header: Applications (new ones flagged), Publish Blog (PDF upload) and
// Events (add upcoming events, or past ones with photos).
//
// The password is checked on the server (/api/admin/verify) and sent again
// with every blog upload to /api/admin/blogs, which re-checks it before
// doing anything. It is never part of this page's JavaScript, and is only
// kept in memory, so reloading the page asks for it again.
// ---------------------------------------------------------------------

type Section = "applications" | "blog" | "events";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const [section, setSection] = useState<Section>("applications");
  const [newApplications, setNewApplications] = useState(0);
  // Bumped when a blog is published so the post-dates list reloads.
  const [blogsVersion, setBlogsVersion] = useState(0);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setPasswordError(false);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) setUnlocked(true);
      else setPasswordError(true);
    } catch {
      setPasswordError(true);
    } finally {
      setChecking(false);
    }
  };

  const handleLock = () => {
    setUnlocked(false);
    setPassword("");
    setSection("applications");
    setNewApplications(0);
  };

  if (!unlocked) {
    return (
      <div style={styles.gateWrap}>
        <form onSubmit={handleUnlock} style={styles.gateForm}>
          <h1 style={styles.gateTitle}>Admin Access</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoFocus
          />
          {passwordError && <p style={styles.errorText}>Incorrect password.</p>}
          <button type="submit" style={styles.primaryBtn} disabled={checking}>
            {checking ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.brand}>E-CELL ADMIN</span>
          <nav style={styles.nav}>
            <button
              type="button"
              onClick={() => setSection("applications")}
              style={{
                ...styles.navBtn,
                ...(section === "applications" ? styles.navBtnActive : {}),
              }}
            >
              Applications
              {newApplications > 0 && (
                <span style={styles.navBadge}>{newApplications} new</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSection("blog")}
              style={{
                ...styles.navBtn,
                ...(section === "blog" ? styles.navBtnActive : {}),
              }}
            >
              Publish Blog
            </button>
            <button
              type="button"
              onClick={() => setSection("events")}
              style={{
                ...styles.navBtn,
                ...(section === "events" ? styles.navBtnActive : {}),
              }}
            >
              Events
            </button>
          </nav>
          <div style={styles.headerRight}>
            <Link href="/" style={styles.headerLink}>
              View site
            </Link>
            <button type="button" onClick={handleLock} style={styles.lockBtn}>
              Lock
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Both sections stay mounted so switching doesn't lose a chosen PDF
            or reload the applications. */}
        <div style={{ display: section === "applications" ? "block" : "none" }}>
          <ApplicationsPanel onNewCount={setNewApplications} />
        </div>
        <div style={{ display: section === "blog" ? "block" : "none" }}>
          <BlogPublisher password={password} onPublished={() => setBlogsVersion((v) => v + 1)} />
          <BlogDateManager password={password} reloadKey={blogsVersion} />
        </div>
        <div style={{ display: section === "events" ? "block" : "none" }}>
          <EventsManager password={password} />
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  gateWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
  },
  gateForm: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "280px",
  },
  gateTitle: { color: "#fff", fontSize: "18px", marginBottom: "8px" },
  input: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "#151515",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  primaryBtn: {
    padding: "11px 18px",
    borderRadius: "6px",
    border: "none",
    background: "#fff",
    color: "#000",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
  errorText: { color: "#f87171", fontSize: "13px", margin: 0 },
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(10, 10, 10, 0.92)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #222",
  },
  headerInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px 24px",
    padding: "12px 24px",
  },
  brand: { fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", color: "#4ade80" },
  nav: { display: "flex", gap: "6px", flexWrap: "wrap" },
  navBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "999px",
    border: "1px solid transparent",
    background: "transparent",
    color: "#aaa",
    fontSize: "14px",
    cursor: "pointer",
  },
  navBtnActive: { background: "#fff", color: "#000", fontWeight: 600 },
  navBadge: {
    padding: "1px 7px",
    borderRadius: "999px",
    background: "#4ade80",
    color: "#000",
    fontSize: "11px",
    fontWeight: 700,
  },
  headerRight: { display: "flex", alignItems: "center", gap: "14px" },
  headerLink: { fontSize: "13px", color: "#888", textDecoration: "none" },
  lockBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "transparent",
    color: "#ccc",
    fontSize: "13px",
    cursor: "pointer",
  },
  main: { padding: "28px 24px 64px" },
};
