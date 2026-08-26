"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApplicationData } from "@/lib/firestore";

// ---------------------------------------------------------------------
// /admin — a simple in-app table view of every submitted application.
//
// This reads the `applications` collection directly with the same
// client-side Firestore SDK the rest of the site already uses (see
// firestore.rules: `applications` allows public read), so there's
// nothing extra to install, deploy, or configure.
//
// NOTE ON ACCESS: the passcode gate below is a light deterrent, not
// real security — anyone with the passcode env value (or who reads
// the deployed JS bundle) can bypass it, and the underlying Firestore
// read is public regardless of this page. If you need real access
// control, restrict `allow read` on `applications` in firestore.rules
// to specific authenticated admin accounts instead.
// ---------------------------------------------------------------------

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

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  const [applications, setApplications] = useState<ApplicationData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!unlocked) return;

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "applications"));
        const rows = snap.docs.map((d) => d.data() as ApplicationData);
        rows.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
        if (!cancelled) setApplications(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load applications");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [unlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSCODE;
    if (!expected || passcodeInput === expected) {
      setUnlocked(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  if (!unlocked) {
    return (
      <div style={styles.gateWrap}>
        <form onSubmit={handleUnlock} style={styles.gateForm}>
          <h1 style={styles.gateTitle}>Admin Access</h1>
          <input
            type="password"
            placeholder="Passcode"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            style={styles.gateInput}
            autoFocus
          />
          {passcodeError && (
            <p style={styles.gateError}>Incorrect passcode.</p>
          )}
          <button type="submit" style={styles.gateBtn}>
            Enter
          </button>
        </form>
      </div>
    );
  }

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

  const filtered = applications ? bySearch(byTab(applications, activeTab)) : [];

  return (
    <div style={styles.page}>
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
            {applications ? `${filtered.length} shown` : "Loading…"}
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
                      {c.key === "submittedAt" && row.submittedAt
                        ? new Date(row.submittedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : String(row[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p style={styles.emptyText}>No applications match your search.</p>
          )}
        </div>
      )}
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
  gateInput: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "#151515",
    color: "#fff",
    fontSize: "14px",
  },
  gateError: { color: "#f87171", fontSize: "13px", margin: 0 },
  gateBtn: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#fff",
    color: "#000",
    fontWeight: 600,
    cursor: "pointer",
  },
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    padding: "32px 24px",
    fontFamily: "system-ui, sans-serif",
  },
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
  actions: { display: "flex", gap: "10px", alignItems: "center" },
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
