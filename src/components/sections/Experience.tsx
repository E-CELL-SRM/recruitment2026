"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import SectionLabel from "@/components/layout/SectionLabel";
import { revealClipImage, sectionEnter } from "@/lib/animations/reveals";
import styles from "./Experience.module.css";

const perks = [
  "Real World Exposure",
  "Mentorship from Industry Leaders",
  "Leadership Opportunities",
  "Network that Lasts Forever",
  "Portfolio that Stands Out",
];

export default function Experience() {
  const copyRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (copyRef.current) sectionEnter(copyRef.current, { y: 40 });
    if (wrapRef.current && imgRef.current) {
      revealClipImage(wrapRef.current, imgRef.current);
    }
  }, []);

  return (
    <section className={styles.experience} id="experience">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.copy} ref={copyRef}>
          <SectionLabel num="04" text="THE EXPERIENCE" />
          <h2 className={styles.big}>
            MORE THAN
            <br />
            A <span className={styles.accent}>POSITION.</span>
          </h2>
          <p className={styles.sub}>
            It&apos;s a journey of growth, learning and building something bigger
            than yourself. Here&apos;s what you gain with E-Cell.
          </p>
          <ul className={styles.list}>
            {perks.map((p, i) => (
              <li key={p}>
                <span className={styles.idx}>0{i + 1}</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.visual} ref={wrapRef}>
          <div className={styles.imgWrap} ref={imgRef}>
            <Image
              src="/assets/p4.jpeg"
              alt="Packed auditorium at an E-Cell SRMIST event"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className={styles.img}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
