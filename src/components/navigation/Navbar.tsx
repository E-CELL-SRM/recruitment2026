"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Navbar.module.css";

const links = [
  { href: "#about", label: "ABOUT" },
  { href: "#domains", label: "DOMAINS" },
  { href: "#experience", label: "EXPERIENCE" },
  { href: "#events", label: "EVENTS" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
            <a
              href={l.href}
              data-cursor={l.label}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          </li>
        ))}
        <li>
          <Link
            href="/apply"
            className={styles.cta}
            data-cursor="JOIN"
            onClick={() => setOpen(false)}
          >
            JOIN NOW →
          </Link>
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
