"use client";

import { useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/layout/SectionLabel";
import { expandGreenLine, sectionEnter } from "@/lib/animations/reveals";
import { useApplyModal } from "@/context/ApplyModalContext";
import styles from "./Domains.module.css";

const domains = [
  {
    id: "technical",
    title: "TECHNICAL",
    body: "Build scalable web applications, engineer AI/ML models, architect UI/UX product design systems, and develop embedded hardware.",
  },
  {
    id: "creative",
    title: "CREATIVE",
    body: "Produce bold visual brand identities, high-octane video motion graphics, 3D renders, and persuasive content.",
  },
  {
    id: "corporate",
    title: "CORPORATE",
    body: "Plan, manage and drive initiatives that create measurable campus impact.",
  },
  {
    id: "legal",
    title: "LEGAL & FINANCE",
    body: "Ensure compliance, manage policies, protect venture IP, and guide financial modeling.",
  },
];

export default function Domains() {
  const [active, setActive] = useState(0);
  const headRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { openApplyModal } = useApplyModal();

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
              <div
                key={d.id}
                className={`${styles.item} ${isActive ? styles.active : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-expanded={isActive}
                data-cursor="OPEN"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActive(i);
                }}
              >
                <span className={styles.marker} aria-hidden />
                <span className={styles.index}>0{i + 1}</span>
                <h3 className={styles.title}>{d.title}</h3>
                <div className={styles.body}>
                  <p>{d.body}</p>
                  {isActive && (
                    <button
                      type="button"
                      className={styles.domainApplyBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        openApplyModal(d.id);
                      }}
                      data-cursor="APPLY"
                    >
                      APPLY FOR {d.title} →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

