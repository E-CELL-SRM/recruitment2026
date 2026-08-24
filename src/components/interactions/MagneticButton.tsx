"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import Link from "next/link";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  cursorLabel?: string;
};

export default function MagneticButton({
  href,
  children,
  className = "",
  cursorLabel = "OPEN",
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const max = 7;
    const dx = Math.max(-max, Math.min(max, x * 0.22));
    const dy = Math.max(-max, Math.min(max, y * 0.22));
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  };

  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "translate3d(0,0,0)";
  };

  return (
    <Link
      ref={ref}
      href={href}
      className={`magnetic-btn ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      data-cursor={cursorLabel}
    >
      {children}
    </Link>
  );
}
