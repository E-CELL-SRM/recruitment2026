"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { scrollToTarget } from "@/lib/animations/scroll";
import { LogIn } from "lucide-react";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import styles from "./Navbar.module.css";

const links = [
  { href: "#about", label: "ABOUT" },
  { href: "#domains", label: "DOMAINS" },
  { href: "#experience", label: "EXPERIENCE" },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { user, userProfile } = useAuth();
  const activeCandidate = userProfile || (user ? {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  } : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav
      id="site-nav"
      className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}
      data-nav
    >
      <Link href="/#hero" className={styles.logo} data-cursor="HOME">
        <Image
          src="/assets/logowhite.png"
          alt="E-Cell SRMIST logo"
          width={30}
          height={38}
          className={styles.logoMark}
          priority
        />
        <span className={styles.logoText}>
          E-CELL SRMIST
          <span className={styles.logoSub}>RECRUITMENT 2026</span>
        </span>
      </Link>

      <button
        type="button"
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ""}`}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />

      <ul className={`${styles.links} ${open ? styles.open : ""}`} id="navLinks">
        {links.map((l) => (
          <li key={l.href}>
            {isHome ? (
              <a
                href={l.href}
                data-cursor={l.label}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  scrollToTarget(l.href, -40);
                }}
              >
                {l.label}
              </a>
            ) : (
              <Link
                href={`/${l.href}`}
                data-cursor={l.label}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}

        <li>
          <Link
            href="/events"
            data-cursor="EVENTS"
            onClick={() => setOpen(false)}
          >
            EVENTS
          </Link>
        </li>

        <li>
          <Link
            href="/blogs"
            data-cursor="BLOGS"
            onClick={() => setOpen(false)}
          >
            BLOGS
          </Link>
        </li>

        <li>
          {activeCandidate ? (
            <button
              type="button"
              className={styles.navUserPill}
              onClick={() => {
                setOpen(false);
                router.push("/login");
              }}
              title={activeCandidate.email || "Candidate Profile"}
            >
              {activeCandidate.photoURL ? (
                <img
                  src={activeCandidate.photoURL}
                  alt={activeCandidate.displayName || "Avatar"}
                  className={styles.navUserAvatar}
                />
              ) : (
                <span className={styles.navUserAvatarFallback}>
                  {activeCandidate.displayName ? activeCandidate.displayName.charAt(0).toUpperCase() : "C"}
                </span>
              )}
              <span>{activeCandidate.displayName?.split(" ")[0]?.toUpperCase() || "PORTAL"}</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.navLoginLink}
              aria-label="Portal login"
              onClick={() => {
                setOpen(false);
                router.push("/login");
              }}
            >
              <LogIn size={12} />
              <span>PORTAL LOGIN</span>
            </button>
          )}
        </li>

        <li>
          <NotificationCenter />
        </li>
      </ul>

      <button
        className={`${styles.menuBtn} ${open ? styles.menuActive : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-cursor="MENU"
      >
        <span />
        <span />
        <span />
      </button>
    </nav>
  );
}
