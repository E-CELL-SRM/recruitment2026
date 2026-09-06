"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, X, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApplicationsByEmail } from "@/lib/firestore";
import {
  ANNOUNCEMENTS,
  DOMAIN_ACCENTS,
  DOMAIN_LABELS,
  DOMAIN_THEME,
  DomainId,
} from "@/lib/announcements";
import { CyberpunkCard, ComicCard, OfficeCard } from "./ThemedAnnouncementCards";
import styles from "./NotificationCenter.module.css";

const SEEN_KEY = "ecell_seen_announcements";
const DOMAIN_IDS = Object.keys(DOMAIN_LABELS) as DomainId[];

function getSeenIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

function markSeen(id: string) {
  try {
    const seen = getSeenIds();
    if (!seen.includes(id)) {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]));
    }
  } catch {
    // localStorage unavailable — the dot just won't persist, not fatal.
  }
}

export default function NotificationCenter() {
  const { user, userProfile } = useAuth();
  const email = userProfile?.email || user?.email || null;

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false);
  const [detectedDomain, setDetectedDomain] = useState<DomainId | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [pickedDomain, setPickedDomain] = useState<DomainId | null>(null);

  const latest = ANNOUNCEMENTS[0];

  useEffect(() => {
    if (!latest) return;
    setHasUnseen(!getSeenIds().includes(latest.id));
  }, [latest]);

  // These announcements are for people who've actually applied, so the
  // bell only shows once we've confirmed a submitted application — this
  // also gives us the domain to auto-select in the popup.
  useEffect(() => {
    if (!email) {
      setHasApplied(false);
      setDetectedDomain(null);
      return;
    }
    let cancelled = false;
    getApplicationsByEmail(email).then((apps) => {
      if (cancelled) return;
      setHasApplied(apps.length > 0);
      const domain = apps[0]?.domain;
      if (domain && DOMAIN_IDS.includes(domain as DomainId)) {
        setDetectedDomain(domain as DomainId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [email]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setPickedDomain(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const activeDomain = detectedDomain || pickedDomain;
  const theme = activeDomain ? DOMAIN_THEME[activeDomain] : null;

  const domainContent = useMemo(() => {
    if (!activeDomain || !latest) return null;
    return latest.perDomain[activeDomain] || null;
  }, [activeDomain, latest]);

  // Technical/Creative/Corporate get a fully custom themed card (cyberpunk,
  // comic, office); Legal & Finance has no group yet so it stays on the
  // plain dark card below along with the generic header. A domain with no
  // link set also falls back to that plain card instead of a dead button.
  const isFullyThemed = !!domainContent?.link && theme !== "classic" && theme !== null;

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnseen(false);
    if (latest) markSeen(latest.id);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPickedDomain(null);
  };

  if (!latest || !hasApplied) return null;

  return (
    <>
      <button
        type="button"
        className={styles.bellBtn}
        aria-label="Announcements"
        data-cursor="ALERTS"
        onClick={handleOpen}
      >
        <Bell size={16} />
        {hasUnseen && <span className={styles.pulseDot} />}
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={handleClose}>
          <div
            className={`${styles.panel} ${isFullyThemed ? styles.panelThemed : ""}`}
            style={
              activeDomain
                ? ({ "--accent": DOMAIN_ACCENTS[activeDomain].color, "--accent-glow": DOMAIN_ACCENTS[activeDomain].glow } as React.CSSProperties)
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={`${styles.closeBtn} ${theme === "comic" || theme === "office" ? styles.closeBtnDark : ""}`}
              aria-label="Close"
              onClick={handleClose}
            >
              <X size={16} />
            </button>

            {isFullyThemed && domainContent ? (
              theme === "cyberpunk" ? (
                <CyberpunkCard content={domainContent} />
              ) : theme === "comic" ? (
                <ComicCard content={domainContent} />
              ) : (
                <OfficeCard content={domainContent} />
              )
            ) : (
              <>
                <div className={styles.header}>
                  <span className={styles.badge}>{latest.badge}</span>
                  <span className={styles.date}>
                    <Clock size={11} /> {latest.date}
                  </span>
                </div>

                <h2 className={styles.title}>{latest.title}</h2>
                <p className={styles.teaser}>{latest.teaser}</p>

                {!activeDomain ? (
                  <div className={styles.pickerWrap}>
                    <p className={styles.pickerLabel}>Select your domain to continue:</p>
                    <div className={styles.chipRow}>
                      {DOMAIN_IDS.map((id) => (
                        <button
                          key={id}
                          type="button"
                          className={styles.domainChip}
                          style={{ "--accent": DOMAIN_ACCENTS[id].color } as React.CSSProperties}
                          onClick={() => setPickedDomain(id)}
                        >
                          {DOMAIN_LABELS[id]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.domainCard}>
                    <div className={styles.domainCardTag}>{DOMAIN_LABELS[activeDomain]}</div>
                    <p className={styles.domainMessage}>{latest.fallbackMessage}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
