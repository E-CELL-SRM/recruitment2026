"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApplicationData } from "@/lib/firestore";

// ---------------------------------------------------------------------
// Admin "Applications" section: an in-app table of every submitted
// application, newest first, with the ones that arrived since the admin
// last pressed "Mark all as seen" flagged NEW.
//
// This reads the `applications` collection directly with the same
// client-side Firestore SDK the rest of the site uses (firestore.rules
// currently allows public read of it).
// ---------------------------------------------------------------------

const LAST_SEEN_KEY = "ecell_admin_last_seen_application";

const COLUMNS: { key: keyof ApplicationData; label: string }[] = [
  { key: "submittedAt", label: "Submitted" },
  { key: "id", label: "Tracking ID" },
  { key: "fullName", label: "Name" },
  { key: "applicantEmail", label: "Email" },
  { key: "regNumber", label: "Reg No." },
  { key: "domain", label: "Domain" },
  { key: "subDomain", label: "Track" },
  { key: "year", label: "Year" },
  { key: "phone", label: "Phone" },
  { key: "portfolioUrl", label: "Portfolio" },
  { key: "githubUrl", label: "GitHub" },
  { key: "linkedinUrl", label: "LinkedIn" },
];

// Matches the `id`s stored on each application doc — see DOMAIN_OPTIONS
// in ApplyModal.tsx. "all" is a synthetic tab, not a stored domain value.
const DOMAIN_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "technical", label: "Technical" },
  { id: "creative", label: "Creative" },
  { id: "corporate", label: "Corporate" },
  { id: "legal", label: "Legal & Finance" },
];

function toCsv(rows: ApplicationData[]) {
  const escape = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = COLUMNS.map((c) => c.label).join(",");
  const body = rows
    .map((row) => COLUMNS.map((c) => escape(row[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function downloadCsv(rows: ApplicationData[], tabLabel: string) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug = tabLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  a.download = `applications-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function readLastSeen(): string {
  try {
    return localStorage.getItem(LAST_SEEN_KEY) || "";
  } catch {
    return "";
  }
}

interface Props {
  // Reports how many applications are newer than the last "seen" mark, so
  // the header can show a badge.
  onNewCount?: (count: number) => void;
}

export default function ApplicationsPanel({ onNewCount }: Props) {
  const [applications, setApplications] = useState<ApplicationData[] | null>(null);
  const [duplicatesHidden, setDuplicatesHidden] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [lastSeen, setLastSeen] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);

  useEffect(() => {
    setLastSeen(readLastSeen());

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "applications"));
        const rows = snap.docs.map((d) => d.data() as ApplicationData);
        // Newest submission first, per applicant email — so re-submits (or
        // legacy duplicate form-fills from before edit-in-place existed)
        // collapse down to just the most recent one for that person.
        rows.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
        const seenEmails = new Set<string>();
        const deduped = rows.filter((row) => {
          const key = (row.applicantEmail || "").toLowerCase();
          if (!key) return true;
          if (seenEmails.has(key)) return false;
          seenEmails.add(key);
          return true;
        });
        if (!cancelled) {
          setApplications(deduped);
          setDuplicatesHidden(rows.length - deduped.length);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load applications");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isNew = (row: ApplicationData) => !!row.submittedAt && row.submittedAt > lastSeen;
  const newCount = applications ? applications.filter(isNew).length : 0;

  useEffect(() => {
    onNewCount?.(newCount);
  }, [newCount, onNewCount]);

  const markAllSeen = () => {
    const newest = applications?.[0]?.submittedAt;
    if (!newest) return;
    try {
      localStorage.setItem(LAST_SEEN_KEY, newest);
    } catch {
      // Not persisted — the NEW flags just come back next visit.
    }
    setLastSeen(newest);
    setOnlyNew(false);
  };

  const byTab = (rows: ApplicationData[], tab: string) =>
    tab === "all" ? rows : rows.filter((row) => row.domain?.toLowerCase() === tab);

  const bySearch = (rows: ApplicationData[]) => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (row) =>
        row.fullName?.toLowerCase().includes(q) ||
        row.applicantEmail?.toLowerCase().includes(q) ||
        row.regNumber?.toLowerCase().includes(q) ||
        row.domain?.toLowerCase().includes(q) ||
        row.subDomain?.toLowerCase().includes(q)
    );
  };

  const tabCounts: Record<string, number> = {};
  for (const tab of DOMAIN_TABS) {
    tabCounts[tab.id] = applications ? byTab(applications, tab.id).length : 0;
  }

  const filtered = applications
    ? bySearch(byTab(applications, activeTab)).filter((row) => !onlyNew || isNew(row))
    : [];

  return (
    <div>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>
            Applications
            {activeTab !== "all" && (
              <span style={styles.titleTab}>
                {" "}
                — {DOMAIN_TABS.find((t) => t.id === activeTab)?.label}
              </span>
            )}
          </h1>
          <p style={styles.subtitle}>
            {applications
              ? `${filtered.length} shown · ${newCount} new${
                  duplicatesHidden > 0
                    ? ` · ${duplicatesHidden} duplicate re-submission${duplicatesHidden === 1 ? "" : "s"} hidden (most recent kept)`
                    : ""
                }`
              : "Loading…"}
          </p>
        </div>
        <div style={styles.actions}>
          <input
            type="text"
            placeholder="Search name, email, reg no, domain…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />
          <button
            type="button"
            onClick={() => setOnlyNew((v) => !v)}
            disabled={!applications || newCount === 0}
            style={{ ...styles.secondaryBtn, ...(onlyNew ? styles.secondaryBtnActive : {}) }}
          >
            {onlyNew ? "Show all" : `Only new (${newCount})`}
          </button>
          <button
            type="button"
            onClick={markAllSeen}
            disabled={!applications || newCount === 0}
            style={styles.secondaryBtn}
          >
            Mark all as seen
          </button>
          <button
            type="button"
            onClick={() =>
              applications &&
              downloadCsv(
                filtered,
                DOMAIN_TABS.find((t) => t.id === activeTab)?.label ?? "all"
              )
            }
            disabled={!applications || filtered.length === 0}
            style={styles.downloadBtn}
          >
            Download CSV
          </button>
        </div>
      </div>

      <div style={styles.tabRow}>
        {DOMAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab.id ? styles.tabBtnActive : {}),
            }}
          >
            {tab.label}
            {applications && (
              <span style={styles.tabCount}> {tabCounts[tab.id]}</span>
            )}
          </button>
        ))}
      </div>

      {error && <p style={styles.errorText}>Error: {error}</p>}

      {!error && applications && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} style={styles.th}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} style={styles.tr}>
                  {COLUMNS.map((c) => (
                    <td key={c.key} style={styles.td}>
                      {c.key === "submittedAt" && row.submittedAt ? (
                        <>
                          {isNew(row) && <span style={styles.newBadge}>NEW</span>}
                          {new Date(row.submittedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      ) : (
                        String(row[c.key] ?? "—")
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p style={styles.emptyText}>No applications match your filters.</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "20px",
  },
  title: { fontSize: "22px", margin: 0 },
  titleTab: { color: "#888", fontWeight: 400 },
  subtitle: { fontSize: "13px", color: "#888", margin: "4px 0 0" },
  actions: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" },
  tabRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "16px",
    borderBottom: "1px solid #222",
    paddingBottom: "12px",
  },
  tabBtn: {
    padding: "7px 14px",
    borderRadius: "999px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#2a2a2a",
    background: "#141414",
    color: "#aaa",
    fontSize: "13px",
    cursor: "pointer",
  },
  tabBtnActive: {
    background: "#fff",
    color: "#000",
    borderColor: "#fff",
    fontWeight: 600,
  },
  tabCount: { opacity: 0.7, fontSize: "12px" },
  search: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "#151515",
    color: "#fff",
    fontSize: "13px",
    minWidth: "240px",
  },
  downloadBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    background: "#fff",
    color: "#000",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "transparent",
    color: "#ccc",
    fontSize: "13px",
    cursor: "pointer",
  },
  secondaryBtnActive: { borderColor: "#4ade80", color: "#4ade80" },
  newBadge: {
    display: "inline-block",
    marginRight: "8px",
    padding: "1px 6px",
    borderRadius: "4px",
    background: "#4ade80",
    color: "#000",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  errorText: { color: "#f87171" },
  tableWrap: { overflowX: "auto", border: "1px solid #222", borderRadius: "10px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    borderBottom: "1px solid #222",
    color: "#999",
    fontWeight: 600,
    whiteSpace: "nowrap",
    background: "#111",
    position: "sticky",
    top: 0,
  },
  tr: { borderBottom: "1px solid #191919" },
  td: { padding: "10px 14px", whiteSpace: "nowrap" },
  emptyText: { padding: "24px", textAlign: "center", color: "#888" },
};
