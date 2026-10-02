"use client";

import { useEffect, useRef, useState } from "react";

// Auto-scroll speed, in px per second.
const SPEED = 28;

interface Options {
  axis: "x" | "y";
  // Number of distinct items in the list.
  count: number;
  // Turn the marquee off (e.g. while the visitor is searching).
  enabled?: boolean;
}

// Endless auto-scrolling for a list that's rendered `copies` times in a
// scrollable container. It scrolls on its own until the pointer (or focus or
// touch) is on the container, then leaves scrolling to the visitor and picks
// up from wherever they left off. The first item of the second copy must
// carry a `data-dup` attribute so the loop length can be measured.
export function useMarquee<T extends HTMLElement>({
  axis,
  count,
  enabled = true,
}: Options) {
  const ref = useRef<T>(null);
  const pausedRef = useRef(false);
  // How many times the list is rendered. A short list is repeated until one
  // pass fills the box, so there's always something to scroll into view.
  const [copies, setCopies] = useState(2);
  const loop = enabled && count > 1;

  useEffect(() => {
    const el = ref.current;
    if (!loop || !el) return;

    const boxSize = () => (axis === "x" ? el.clientWidth : el.clientHeight);
    const getCycle = () => {
      const dup = el.querySelector<HTMLElement>("[data-dup]");
      const first = el.firstElementChild as HTMLElement | null;
      if (!dup || !first) return 0;
      return axis === "x"
        ? dup.offsetLeft - first.offsetLeft
        : dup.offsetTop - first.offsetTop;
    };

    const measure = () => {
      const cycle = getCycle();
      if (cycle <= 0) return;
      const needed = Math.max(2, Math.ceil(boxSize() / cycle) + 1);
      setCopies((c) => (c === needed ? c : needed));
    };
    measure();
    window.addEventListener("resize", measure);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const read = () => (axis === "x" ? el.scrollLeft : el.scrollTop);
    const write = (v: number) => {
      if (axis === "x") el.scrollLeft = v;
      else el.scrollTop = v;
    };
    let pos = read();

    const step = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      if (!pausedRef.current && !reduced) {
        const cycle = getCycle();
        pos += (SPEED * dt) / 1000;
        if (cycle > 0 && pos >= cycle) pos -= cycle;
        write(pos);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // After a manual scroll, resume from where the visitor left off.
    const syncPos = () => {
      if (pausedRef.current) pos = read();
    };
    el.addEventListener("scroll", syncPos, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      el.removeEventListener("scroll", syncPos);
    };
  }, [loop, axis, count, copies]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return {
    ref,
    loop,
    copies: loop ? copies : 1,
    handlers: {
      onMouseEnter: pause,
      onMouseLeave: resume,
      onFocus: pause,
      onBlur: resume,
      onTouchStart: pause,
      onTouchEnd: resume,
    },
  };
}
