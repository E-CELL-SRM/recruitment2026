"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import SectionLabel from "@/components/layout/SectionLabel";
import { revealClipImage, sectionEnter } from "@/lib/animations/reveals";
import styles from "./Culture.module.css";

export default function Culture() {
  const headRef = useRef<HTMLDivElement>(null);
  const aWrap = useRef<HTMLDivElement>(null);
  const aImg = useRef<HTMLDivElement>(null);
  const bWrap = useRef<HTMLDivElement>(null);
  const bImg = useRef<HTMLDivElement>(null);
  const cWrap = useRef<HTMLDivElement>(null);
  const cImg = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headRef.current) sectionEnter(headRef.current);
    if (aWrap.current && aImg.current) revealClipImage(aWrap.current, aImg.current);
    if (bWrap.current && bImg.current) revealClipImage(bWrap.current, bImg.current);
    if (cWrap.current && cImg.current) revealClipImage(cWrap.current, cImg.current);
  }, []);

  return (
    <section className={styles.culture}>
      <div className="wrap">
        <div className={styles.top} ref={headRef}>
          <SectionLabel num="05" text="CULTURE" light />
          <h2 className={styles.big}>
            WE DON&apos;T JUST WORK.
            <br />
            WE <span className={styles.accent}>GROW</span> TOGETHER.
            <br />
            WE <span className={styles.accent}>CREATE</span> TOGETHER.
          </h2>
        </div>

        <div className={styles.collage}>
          <div className={`${styles.cell} ${styles.tall}`} ref={aWrap}>
            <div className={styles.inner} ref={aImg}>
              <Image
                src="/assets/p5.jpeg"
                alt="Students filling an E-Cell workshop hall"
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className={styles.img}
              />
            </div>
          </div>
          <div className={styles.col}>
            <div className={`${styles.cell} ${styles.wide}`} ref={bWrap}>
              <div className={styles.inner} ref={bImg}>
                <Image
                  src="/assets/p6.jpeg"
                  alt="Builders collaborating on laptops at long desks"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className={styles.img}
                  style={{ objectPosition: "center 40%" }}
                />
              </div>
            </div>
            <div className={`${styles.cell} ${styles.sq}`} ref={cWrap}>
              <div className={styles.inner} ref={cImg}>
                <Image
                  src="/assets/p3.jpeg"
                  alt="Focused E-Cell session with open notebooks"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className={styles.img}
                  style={{ objectPosition: "70% center" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
