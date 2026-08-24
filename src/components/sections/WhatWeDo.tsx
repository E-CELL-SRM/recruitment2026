"use client";

import { useEffect, useRef, useState } from "react";
import SectionLabel from "@/components/layout/SectionLabel";
import { sectionEnter } from "@/lib/animations/reveals";
import styles from "./WhatWeDo.module.css";

const items = [
  { title: "BUILD", body: "Build solutions that solve real problems." },
  { title: "DESIGN", body: "Design experiences that are intuitive and impactful." },
  { title: "ORGANIZE", body: "Organize events that inspire and bring people together." },
  { title: "PITCH", body: "Pitch ideas, products and solutions with confidence." },
  { title: "COLLABORATE", body: "Collaborate across domains and create together." },
  { title: "LEAD", body: "Lead initiatives that create lasting impact." },
];

export default function WhatWeDo() {
  const [active, setActive] = useState<number | null>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headRef.current) sectionEnter(headRef.current);
    if (listRef.current) sectionEnter(listRef.current, { y: 40 });
  }, []);

  return (
    <section className={styles.wwd}>
      <div className="wrap">
        <div ref={headRef}>
          <SectionLabel num="03" text="WHAT WE DO" />
          <h2 className={styles.big}>
            IDEATE. INNOVATE. <span className={styles.accent}>IMPACT.</span>
          </h2>
        </div>

        <div className={styles.list} ref={listRef}>
          {items.map((item, i) => (
            <button
              key={item.title}
              type="button"
              className={`${styles.row} ${active === i ? styles.active : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              data-cursor="→"
            >
              <span className={styles.num}>0{i + 1}</span>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.body}>{item.body}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
