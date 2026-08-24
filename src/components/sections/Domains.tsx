"use client";

import { useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/layout/SectionLabel";
import { expandGreenLine, sectionEnter } from "@/lib/animations/reveals";
import styles from "./Domains.module.css";

const domains = [
  {
    id: "technical",
    title: "TECHNICAL",
    body: "Build products, ship systems, and solve real-world problems with technology.",
  },
  {
    id: "creative",
    title: "CREATIVE",
    body: "Design, create and communicate ideas that move people and define culture.",
  },
  {
    id: "corporate",
    title: "CORPORATE",
    body: "Plan, manage and drive initiatives that create measurable campus impact.",
  },
  {
    id: "legal",
    title: "LEGAL",
    body: "Ensure compliance, manage policies and protect ideas as they scale.",
  },
];

export default function Domains() {
  const [active, setActive] = useState(0);
  const headRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headRef.current) sectionEnter(headRef.current);
    if (lineRef.current && listRef.current) {
      expandGreenLine(lineRef.current, listRef.current);
    }
  }, []);

  return (
    <section className={styles.domains} id="domains">
      <div className="wrap">
        <div className={styles.top} ref={headRef}>
          <div>
            <SectionLabel num="02" text="DOMAINS" />
            <h2 className={styles.big}>
              FOUR PATHS.
              <br />
              ONE <span className={styles.accent}>MISSION</span>.
            </h2>
          </div>
          <p className={styles.note}>
            Different skills. One vision. Choose your domain. Build your legacy.
            Make an impact that matters.
          </p>
        </div>

        <div className={styles.line} ref={lineRef} aria-hidden />

        <div className={styles.list} ref={listRef}>
          {domains.map((d, i) => {
            const isActive = active === i;
            return (
              <button
                key={d.id}
                type="button"
                className={`${styles.item} ${isActive ? styles.active : ""}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-pressed={isActive}
                data-cursor="OPEN"
              >
                <span className={styles.marker} aria-hidden />
                <span className={styles.index}>0{i + 1}</span>
                <h3 className={styles.title}>{d.title}</h3>
                <p className={styles.body}>{d.body}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
