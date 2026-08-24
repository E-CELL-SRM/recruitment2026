import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} id="events">
      <div className="wrap">
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <Image
                src="/assets/logowhite.png"
                alt="E-Cell SRMIST logo"
                width={30}
                height={38}
              />
              <div>
                E-CELL
                <br />
                <span className={styles.sub}>SRMIST</span>
              </div>
            </div>
            <div className={styles.tag}>THINK. BUILD. SCALE.</div>
          </div>

          <div className={styles.cols}>
            <div className={styles.col}>
              <h5>Links</h5>
              <a href="#about" data-cursor="→">
                About
              </a>
              <a href="#domains" data-cursor="→">
                Domains
              </a>
              <a href="#experience" data-cursor="→">
                Experience
              </a>
              <a href="#events" data-cursor="→">
                Events
              </a>
              <Link href="/apply" data-cursor="APPLY">
                Apply
              </Link>
            </div>
            <div className={styles.col}>
              <h5>Connect</h5>
              <div className={styles.socials}>
                <a
                  href="https://www.instagram.com/ecell_srmist/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  data-cursor="IG"
                >
                  <IgIcon />
                </a>
                <a
                  href="https://www.linkedin.com/company/e-cell-srmist/posts/?feedView=all"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  data-cursor="IN"
                >
                  <LiIcon />
                </a>
                <a
                  href="https://www.youtube.com/channel/UC_2hajYP9HYk_t5D4J6cVBw"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  data-cursor="YT"
                >
                  <YtIcon />
                </a>
                <a
                  href="mailto:entrepreneurshipcell.ctech@srmist.edu.in"
                  aria-label="Email"
                  data-cursor="MAIL"
                >
                  <MailIcon />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© 2026 E-CELL SRMIST. ALL RIGHTS RESERVED.</span>
          <span>
            DESIGNED &amp; BUILT BY LAKSHIT RAJ and ARYAN IYENGAR | TECHNICAL
            HEAD, E-CELL SRMIST
          </span>
        </div>
      </div>
    </footer>
  );
}

function IgIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  );
}

function LiIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v1.5A6 6 0 0 1 16 8z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function YtIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22.5 8.5s-.2-1.6-.9-2.3c-.8-.9-1.7-.9-2.2-1C16.2 5 12 5 12 5s-4.2 0-7.4.2c-.5 0-1.4.1-2.2 1-.7.7-.9 2.3-.9 2.3S1.3 10.3 1.3 12v1.9c0 1.7.2 3.5.2 3.5s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1 1.7.1 7.2.2 7.2.2s4.2 0 7.4-.3c.5 0 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.2-1.7.2-3.5V12c0-1.7-.2-3.5-.2-3.5z" />
      <path d="M10 15l5-3-5-3z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}
