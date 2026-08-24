"use client";

import { useEffect, useRef } from "react";

type Props = {
  videoRef: React.RefObject<HTMLDivElement | null>;
};

export default function HeroVideo({ videoRef }: Props) {
  const mediaRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = mediaRef.current;
    if (!v) return;
    const play = () => {
      v.play().catch(() => undefined);
    };
    play();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") play();
    });
  }, []);

  return (
    <div className="hero-bg" ref={videoRef}>
      <video
        ref={mediaRef}
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        poster="/assets/hero.png"
        preload="metadata"
        aria-label="E-Cell SRMIST recruitment atmosphere"
      >
        <source src="/assets/vid.mp4" type="video/mp4" />
      </video>
      <div className="hero-scrim" aria-hidden />
    </div>
  );
}
