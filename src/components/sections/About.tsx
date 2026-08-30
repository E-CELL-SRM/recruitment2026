"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { revealClipImage, sectionEnter } from "@/lib/animations/reveals";
import SectionLabel from "@/components/layout/SectionLabel";
import styles from "./About.module.css";

const stats = [
  { value: "10", label: "Years of\nLegacy" },
  { value: "500", label: "Startups\nSupported" },
  { value: "150", label: "Events\nConducted" },
  { value: "20K", label: "Students\nImpacted" },
];

export default function About() {
  const copyRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (copyRef.current) sectionEnter(copyRef.current, { y: 56 });
    if (visualRef.current && imgRef.current) {
      revealClipImage(visualRef.current, imgRef.current);
    }
  }, []);

  return (
    <section className={styles.about} id="about">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.copy} ref={copyRef}>
          <SectionLabel num="01" text="ABOUT" light />
          <h2 className={styles.big}>
            WE ARE
            <br />
            E-CELL SRMIST.
          </h2>
          <p>
            E-Cell SRMIST is the official entrepreneurship cell of SRM Institute
            of Science and Technology. For over a decade, we&apos;ve been building
            a culture of innovation and impact on campus.
          </p>
          <div className={styles.stats}>
            {stats.map((s) => (
              <div key={s.value} className={styles.stat}>
                <b>
                  {s.value}
                  <span className={styles.accent}>+</span>
                </b>
                <span>
                  {s.label.split("\n").map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>

          {/* Placed cleanly in the bottom-left white space */}
          <div className={styles.brandMark}>
            <Image
              src="/assets/logoblack.png"
              alt="E-Cell SRMIST logo"
              width={76}
              height={95}
            />
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.dotGrid} aria-hidden />
          <div className={styles.photo} ref={visualRef}>
            <div className={styles.photoInner} ref={imgRef}>
              <Image
                src="/assets/p3.jpeg"
                alt="E-Cell SRMIST students in a workshop session"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className={styles.img}
              />
            </div>
          </div>
          <div className={styles.greenBlock} aria-hidden />
        </div>
      </div>
    </section>
  );
}
