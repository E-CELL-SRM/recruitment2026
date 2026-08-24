"use client";

import { useEffect, useRef } from "react";
import HeroVideo from "./HeroVideo";
import HeroGrid from "./HeroGrid";
import HeroTypography from "./HeroTypography";
import { playHeroIntro, bindHeroParallax } from "@/lib/animations/hero";
import { prefersReducedMotion } from "@/lib/animations/scroll";
import "./Hero.css";

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      !veilRef.current ||
      !gridRef.current ||
      !videoRef.current ||
      !eyebrowRef.current ||
      !line1Ref.current ||
      !line2Ref.current ||
      !taglineRef.current ||
      !subRef.current ||
      !actionsRef.current ||
      !scrollRef.current
    ) {
      return;
    }

    const reduced = prefersReducedMotion();
    const nav = document.getElementById("site-nav");

    const tl = playHeroIntro(
      {
        root,
        veil: veilRef.current,
        grid: gridRef.current,
        video: videoRef.current,
        nav,
        eyebrow: eyebrowRef.current,
        line1: line1Ref.current,
        line2: line2Ref.current,
        tagline: taglineRef.current,
        sub: subRef.current,
        actions: actionsRef.current,
        scrollTag: scrollRef.current,
      },
      reduced,
    );

    const cleanupParallax = bindHeroParallax(
      root,
      [
        { el: videoRef.current, max: 4 },
        { el: yearRef.current ?? line2Ref.current, max: 3 },
        { el: gridRef.current, max: 1 },
      ],
      reduced,
    );

    return () => {
      tl?.kill();
      cleanupParallax();
    };
  }, []);

  return (
    <section className="hero" id="hero" ref={rootRef}>
      <div className="hero-veil" ref={veilRef} aria-hidden />
      <div ref={gridRef} className="hero-grid-wrap">
        <HeroGrid />
      </div>
      <HeroVideo videoRef={videoRef} />
      <HeroTypography
        eyebrowRef={eyebrowRef}
        line1Ref={line1Ref}
        line2Ref={line2Ref}
        yearRef={yearRef}
        taglineRef={taglineRef}
        subRef={subRef}
        actionsRef={actionsRef}
      />
      <div className="scroll-tag" ref={scrollRef}>
        SCROLL
      </div>
    </section>
  );
}
