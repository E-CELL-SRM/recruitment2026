"use client";

import Image from "next/image";
import Link from "next/link";
import { useApplyModal } from "@/context/ApplyModalContext";
import { CheckCircle2, ArrowRight } from "lucide-react";
import styles from "./apply.module.css";


export default function ApplyPage() {
  const { openApplyModal, latestApplication } = useApplyModal();

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
          ← BACK TO HOME
        </Link>
      </header>

      <div className={styles.wrap}>
        <p className={styles.label}>07 / RECRUITMENT APPLICATION</p>
        <h1 className={styles.title}>
          JOIN THE
          <br />
          <span className={styles.accent}>BUILD.</span>
        </h1>
        <p className={styles.lead}>
          Take the first step towards India&apos;s premier student entrepreneurship cell.
          Fill in your registration details, domain choice, and passion.
        </p>

        {latestApplication ? (
          <div className="mb-8 p-6 bg-[#111] border border-emerald-500/30 text-left">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
                <CheckCircle2 size={16} />
                <span>ACTIVE APPLICATION FOUND</span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 font-mono uppercase">
                {latestApplication.domain}
              </span>
            </div>
            <div className="font-mono text-sm mb-1 text-white">
              Candidate: <strong>{latestApplication.fullName}</strong> ({latestApplication.regNumber})
            </div>
            <div className="font-mono text-xs text-gray-400 mb-4">
              Tracking ID: <span className="text-emerald-400">{latestApplication.id}</span> · {latestApplication.year} · {latestApplication.subDomain || latestApplication.domain}
            </div>
            <button
              type="button"
              onClick={() => openApplyModal()}
              className="btn-primary text-xs !py-3 !px-5"
            >
              SUBMIT ANOTHER APPLICATION →
            </button>
          </div>
        ) : (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => openApplyModal()}
              className="btn-primary"
            >
              OPEN APPLICATION FORM <ArrowRight size={15} />
            </button>
          </div>
        )}

        <div className={styles.panel}>
          <div className={styles.row}>
            <span>STUDENT AUTH</span>
            <span className={styles.muted}>SRM Registration No · Email Validation</span>
          </div>
          <div className={styles.row}>
            <span>DOMAINS</span>
            <span className={styles.muted}>
              Technical · Creative · Corporate · Legal
            </span>
          </div>
          <div className={styles.row}>
            <span>TRACKING</span>
            <span className={styles.muted}>
              Instant Unique Slip ID · Stored Locally
            </span>
          </div>
          <div className={styles.row}>
            <span>SELECTION</span>
            <span className={styles.muted}>Domain Task → Tech Interview → Core Onboarding</span>
          </div>
        </div>

        <p className={styles.note}>
          Click the button above or anywhere on the landing page to open the recruitment pop-up.
        </p>
      </div>
    </main>
  );
}
