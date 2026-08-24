"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import SectionLabel from "@/components/layout/SectionLabel";
import MagneticButton from "@/components/interactions/MagneticButton";
import { revealClipImage, sectionEnter } from "@/lib/animations/reveals";
import styles from "./FinalCTA.module.css";

export default function FinalCTA() {
  const copyRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (copyRef.current) sectionEnter(copyRef.current, { y: 60 });
    if (wrapRef.current && imgRef.current) {
      revealClipImage(wrapRef.current, imgRef.current);
    }
  }, []);

  return (
    <section className={styles.cta} id="apply">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.copy} ref={copyRef}>
          <SectionLabel num="06" text="READY TO BUILD THE FUTURE?" />
          <h2 className={styles.big}>
            YOUR <span className={styles.accent}>MOVE.</span>
          </h2>
          <p>Take the first step towards something bigger.</p>
          <MagneticButton
            href="/apply"
            className="btn-primary"
            cursorLabel="APPLY"
          >
            APPLY NOW <span className="btn-arrow">→</span>
          </MagneticButton>
        </div>
        <div className={styles.visual} ref={wrapRef}>
          <div className={styles.imgWrap} ref={imgRef}>
            <Image
              src="/assets/hero.png"
              alt="E-Summit winners celebrating on stage"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={styles.img}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
