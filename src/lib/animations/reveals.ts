import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerScrollPlugins, prefersReducedMotion } from "./scroll";

export function revealClipImage(
  wrap: HTMLElement,
  img: HTMLElement,
  options?: { start?: string },
) {
  registerScrollPlugins();
  if (prefersReducedMotion()) {
    gsap.set([wrap, img], { clearProps: "all" });
    return;
  }

  gsap.fromTo(
    wrap,
    { clipPath: "inset(12% 12% 12% 12%)" },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: options?.start ?? "top 85%",
        end: "top 35%",
        scrub: true,
      },
    },
  );

  gsap.fromTo(
    img,
    { scale: 1.04 },
    {
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: options?.start ?? "top 85%",
        end: "top 35%",
        scrub: true,
      },
    },
  );
}

export function sectionEnter(
  el: HTMLElement,
  vars?: gsap.TweenVars & { y?: number },
) {
  registerScrollPlugins();
  if (prefersReducedMotion()) {
    gsap.set(el, { opacity: 1, y: 0 });
    return;
  }

  gsap.fromTo(
    el,
    { opacity: 0, y: vars?.y ?? 48 },
    {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
      },
      ...vars,
    },
  );
}

export function expandGreenLine(line: HTMLElement, trigger: HTMLElement) {
  registerScrollPlugins();
  if (prefersReducedMotion()) {
    gsap.set(line, { scaleX: 1 });
    return;
  }

  gsap.fromTo(
    line,
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: "none",
      transformOrigin: "left center",
      scrollTrigger: {
        trigger,
        start: "top 75%",
        end: "top 40%",
        scrub: true,
      },
    },
  );
}

export { ScrollTrigger };
