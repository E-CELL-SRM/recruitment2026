import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerScrollPlugins() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Smooth-scrolls to a target selector (e.g. "#about"), using Lenis if it's
// running on the page, with a native scrollIntoView fallback. `offset` shifts
// the final scroll position (e.g. to account for a fixed navbar height).
export function scrollToTarget(target: string, offset = 0) {
  if (typeof window === "undefined" || !target) return;
  const el = document.querySelector(target);
  if (!el) return;

  if (window.__lenis) {
    window.__lenis.scrollTo(el as HTMLElement, { offset });
    return;
  }

  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: "smooth" });
}
