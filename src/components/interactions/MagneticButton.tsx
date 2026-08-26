"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import Link from "next/link";

type Props = {
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  children: ReactNode;
  className?: string;
  cursorLabel?: string;
  type?: "button" | "submit" | "reset";
};

export default function MagneticButton({
  href,
  onClick,
  children,
  className = "",
  cursorLabel = "OPEN",
  type = "button",
}: Props) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const el = linkRef.current || btnRef.current;
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
    const el = linkRef.current || btnRef.current;
    if (!el) return;
    el.style.transform = "translate3d(0,0,0)";
  };

  if (href && !onClick) {
    return (
      <Link
        ref={linkRef}
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

  return (
    <button
      ref={btnRef}
      type={type}
      onClick={onClick}
      className={`magnetic-btn ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      data-cursor={cursorLabel}
    >
      {children}
    </button>
  );
}

