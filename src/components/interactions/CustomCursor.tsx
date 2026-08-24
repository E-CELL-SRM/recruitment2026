"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CustomCursor.module.css";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    if (coarse || reduced || narrow) {
      document.body.classList.add("touch-device");
      return;
    }
    document.body.classList.remove("touch-device");
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!dot || !label) return;

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;

    const loop = () => {
      x += (tx - x) * 0.28;
      y += (ty - y) * 0.28;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      label.style.transform = `translate3d(${x + 18}px, ${y - 10}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const onOver = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest?.(
        "a, button, [data-cursor]",
      ) as HTMLElement | null;
      if (!t) {
        label.textContent = "";
        label.dataset.active = "false";
        dot.dataset.mode = "default";
        return;
      }
      label.textContent = `[ ${t.dataset.cursor || "→"} ]`;
      label.dataset.active = "true";
      dot.dataset.mode = "interactive";
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} className={styles.cursor} aria-hidden data-mode="default" />
      <div ref={labelRef} className={styles.label} aria-hidden data-active="false" />
    </>
  );
}
