"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import SectionLabel from "@/components/layout/SectionLabel";
import MagneticButton from "@/components/interactions/MagneticButton";
import { sectionEnter } from "@/lib/animations/reveals";
import styles from "./FinalCTA.module.css";

export default function FinalCTA() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) sectionEnter(contentRef.current, { y: 40 });
  }, []);

  return (
    <section className={styles.cta} id="apply">
      {/* Full-bleed background photo stretching across the entire section like the hero video */}
      <div className={styles.bgWrap}>
        <Image
          src="/assets/hero.png"
          alt="E-Summit winners celebrating on stage"
          fill
          priority
          sizes="100vw"
          className={styles.bgImg}
        />
        <div className={styles.scrim} aria-hidden />
      </div>

      {/* Centered CTA content */}
      <div className={styles.centerWrap}>
        <div className={styles.content} ref={contentRef}>
          <div className={styles.labelWrapper}>
            <SectionLabel num="06" text="READY TO BUILD THE FUTURE?" />
          </div>
          <h2 className={styles.big}>
            YOUR <span className={styles.accent}>MOVE.</span>
          </h2>
          <p className={styles.sub}>
            Take the first step towards something bigger.
          </p>
          <div className={styles.action}>
            <MagneticButton
              href="/apply"
              className="btn-primary"
              cursorLabel="APPLY"
            >
              APPLY NOW <span className="btn-arrow">→</span>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
