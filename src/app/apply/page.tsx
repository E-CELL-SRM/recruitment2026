import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./apply.module.css";

export const metadata: Metadata = {
  title: "Apply — E-Cell SRMIST Recruitment 2026",
  description:
    "Apply to join E-Cell SRMIST. Authentication and application form coming in the next phase.",
};

export default function ApplyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo} data-cursor="HOME">
          <Image
            src="/assets/logowhite.png"
            alt="E-Cell SRMIST"
            width={28}
            height={36}
          />
          <span>
            E-CELL SRMIST
            <span className={styles.sub}>RECRUITMENT 2026</span>
          </span>
        </Link>
        <Link href="/" className={styles.back} data-cursor="BACK">
          ← BACK
        </Link>
      </header>

      <div className={styles.wrap}>
        <p className={styles.label}>07 / APPLICATION</p>
        <h1 className={styles.title}>
          JOIN THE
          <br />
          <span className={styles.accent}>BUILD.</span>
        </h1>
        <p className={styles.lead}>
          Frontend shell is live. Google authentication, Demo Mode, domain
          selection, validation, and MongoDB submission land in the backend
          phase — this route is reserved and will not be redesigned.
        </p>

        <div className={styles.panel}>
          <div className={styles.row}>
            <span>AUTH</span>
            <span className={styles.muted}>Google · Demo Mode</span>
          </div>
          <div className={styles.row}>
            <span>VALIDATION</span>
            <span className={styles.muted}>
              RA · SRM email · Personal email · WhatsApp
            </span>
          </div>
          <div className={styles.row}>
            <span>DOMAINS</span>
            <span className={styles.muted}>
              Technical · Creative · Corporate · Legal
            </span>
          </div>
          <div className={styles.row}>
            <span>SUBMIT</span>
            <span className={styles.muted}>MongoDB · Tracking ID</span>
          </div>
        </div>

        <p className={styles.note}>
          Application form UI + API wiring is next. Design tokens match the
          recruitment site.
        </p>
      </div>
    </main>
  );
}
