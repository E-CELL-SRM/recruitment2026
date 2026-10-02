"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, X, Clock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApplicationsByEmail } from "@/lib/firestore";
import {
  ANNOUNCEMENTS,
  DOMAIN_ACCENTS,
  DOMAIN_LABELS,
  DOMAIN_THEME,
  DomainId,
} from "@/lib/announcements";
import { BLOGS } from "@/lib/blogs";
import { CyberpunkCard, ComicCard, OfficeCard } from "./ThemedAnnouncementCards";
import styles from "./NotificationCenter.module.css";

const SEEN_KEY = "ecell_seen_announcements";
const MAX_BLOG_NOTIFICATIONS = 5;
const DOMAIN_IDS = Object.keys(DOMAIN_LABELS) as DomainId[];

function getSeenIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

const blogKey = (slug: string) => `blog:${slug}`;

function markSeen(ids: string[]) {
  try {
    const seen = getSeenIds();
    const next = [...seen, ...ids.filter((id) => !seen.includes(id))];
    if (next.length !== seen.length) {
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    }
  } catch {
    // localStorage unavailable — the dot just won't persist, not fatal.
  }
}

export default function NotificationCenter() {
  const { user, userProfile } = useAuth();
  const email = userProfile?.email || user?.email || null;

  const [isOpen, setIsOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  // Ids that were unseen when the panel was opened, so the list can still
  // flag them as new after the bell's dot has cleared.
  const [newIds, setNewIds] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "announcement">("list");
  const [detectedDomain, setDetectedDomain] = useState<DomainId | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [pickedDomain, setPickedDomain] = useState<DomainId | null>(null);

  const latest = ANNOUNCEMENTS[0];
  const blogNotifications = BLOGS.slice(0, MAX_BLOG_NOTIFICATIONS);

  useEffect(() => {
    setSeen(getSeenIds());
  }, []);

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

  // The announcement is only for applicants; new blog posts are for everyone.
  const showAnnouncement = !!latest && hasApplied;
  const unseenIds = [
    ...(showAnnouncement ? [latest.id] : []),
    ...blogNotifications.map((b) => blogKey(b.slug)),
  ].filter((id) => !seen.includes(id));
  const hasUnseen = unseenIds.length > 0;

  const handleOpen = () => {
    setIsOpen(true);
    setNewIds(unseenIds);
    // With no blog posts to list, go straight to the announcement.
    setView(blogNotifications.length === 0 ? "announcement" : "list");
    markSeen(unseenIds);
    setSeen((prev) => [...prev, ...unseenIds]);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPickedDomain(null);
  };

  if (!showAnnouncement && blogNotifications.length === 0) return null;

  const showList = view === "list";

  return (
    <>
      <button
        type="button"
        className={styles.bellBtn}
        aria-label="Notifications"
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
            {!showList && blogNotifications.length > 0 && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setView("list")}
              >
                <ArrowLeft size={12} /> ALL NOTIFICATIONS
              </button>
            )}
            <button
              type="button"
              className={`${styles.closeBtn} ${theme === "comic" || theme === "office" ? styles.closeBtnDark : ""}`}
              aria-label="Close"
              onClick={handleClose}
            >
              <X size={16} />
            </button>

            {showList ? (
              <>
                <div className={styles.header}>
                  <span className={styles.badge}>Notifications</span>
                </div>
                <ul className={styles.notifList}>
                  {showAnnouncement && (
                    <li>
                      <button
                        type="button"
                        className={styles.notifItem}
                        onClick={() => setView("announcement")}
                      >
                        <span className={styles.notifTop}>
                          <span className={styles.notifKind}>Announcement</span>
                          {newIds.includes(latest.id) && (
                            <span className={styles.newTag}>NEW</span>
                          )}
                        </span>
                        <span className={styles.notifTitle}>{latest.title}</span>
                        <span className={styles.notifDate}>{latest.date}</span>
                      </button>
                    </li>
                  )}
                  {blogNotifications.map((post) => (
                    <li key={post.slug}>
                      <Link
                        href={`/blogs/${post.slug}`}
                        className={styles.notifItem}
                        onClick={handleClose}
                      >
                        <span className={styles.notifTop}>
                          <span className={styles.notifKind}>New Blog</span>
                          {newIds.includes(blogKey(post.slug)) && (
                            <span className={styles.newTag}>NEW</span>
                          )}
                        </span>
                        <span className={styles.notifTitle}>{post.title}</span>
                        <span className={styles.notifDate}>{post.date}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/blogs"
                  className={styles.allBlogs}
                  onClick={handleClose}
                >
                  VIEW ALL BLOGS →
                </Link>
              </>
            ) : isFullyThemed && domainContent ? (
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
