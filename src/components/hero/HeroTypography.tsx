"use client";

import MagneticButton from "@/components/interactions/MagneticButton";

type Props = {
  eyebrowRef: React.RefObject<HTMLDivElement | null>;
  line1Ref: React.RefObject<HTMLSpanElement | null>;
  line2Ref: React.RefObject<HTMLSpanElement | null>;
  yearRef: React.RefObject<HTMLSpanElement | null>;
  taglineRef: React.RefObject<HTMLDivElement | null>;
  subRef: React.RefObject<HTMLParagraphElement | null>;
  actionsRef: React.RefObject<HTMLDivElement | null>;
};

export default function HeroTypography({
  eyebrowRef,
  line1Ref,
  line2Ref,
  yearRef,
  taglineRef,
  subRef,
  actionsRef,
}: Props) {
  return (
    <div className="hero-content">
      <div className="hero-eyebrow" ref={eyebrowRef}>
        E-CELL SRMIST
      </div>
      <h1 className="hero-title">
        <span className="hero-line">
          <span ref={line1Ref}>RECRUITMENT</span>
        </span>
        <span className="hero-line">
          <span ref={line2Ref} className="hero-year">
            <span ref={yearRef}>2026</span>
          </span>
        </span>
      </h1>
      <div className="hero-tagline" ref={taglineRef}>
        THINK. BUILD. SCALE.
      </div>
      <p className="hero-sub" ref={subRef}>
        India&apos;s largest student-run entrepreneurship cell. A community of
        thinkers, builders and doers.
      </p>
      <div className="hero-actions" ref={actionsRef}>
        <MagneticButton href="/apply" className="btn-primary" cursorLabel="APPLY">
          APPLY NOW <span className="btn-arrow">→</span>
        </MagneticButton>
        <a href="#domains" className="btn-ghost" data-cursor="EXPLORE">
          EXPLORE DOMAINS ↓
        </a>
      </div>
    </div>
  );
}
