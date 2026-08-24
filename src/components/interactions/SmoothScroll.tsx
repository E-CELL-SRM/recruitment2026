"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerScrollPlugins, prefersReducedMotion } from "@/lib/animations/scroll";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerScrollPlugins();

    if (prefersReducedMotion()) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    document.documentElement.classList.add("lenis");

    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
      document.documentElement.classList.remove("lenis");
    };
  }, []);

  return <>{children}</>;
}
