import gsap from "gsap";

export type HeroTimelineTargets = {
  root: HTMLElement;
  veil: HTMLElement;
  grid: HTMLElement;
  video: HTMLElement;
  nav: HTMLElement | null;
  eyebrow: HTMLElement;
  line1: HTMLElement;
  line2: HTMLElement;
  tagline: HTMLElement;
  sub: HTMLElement;
  actions: HTMLElement;
  scrollTag: HTMLElement;
};

/** Load sequence capped at ~1.3s. Mechanical / editorial, not floaty. */
export function playHeroIntro(t: HeroTimelineTargets, reduced: boolean) {
  if (reduced) {
    gsap.set(
      [
        t.veil,
        t.grid,
        t.video,
        t.nav,
        t.eyebrow,
        t.line1,
        t.line2,
        t.tagline,
        t.sub,
        t.actions,
        t.scrollTag,
      ].filter(Boolean),
      { clearProps: "all", opacity: 1, y: 0, clipPath: "none" },
    );
    return null;
  }

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  gsap.set(t.veil, { opacity: 1 });
  gsap.set(t.grid, { opacity: 0 });
  gsap.set(t.video, { opacity: 0, scale: 1.06 });
  gsap.set([t.eyebrow, t.tagline, t.sub, t.actions, t.scrollTag], {
    opacity: 0,
    y: 18,
  });
  gsap.set(t.line1, { clipPath: "inset(100% 0 0 0)", y: 28 });
  gsap.set(t.line2, { clipPath: "inset(100% 0 0 0)", y: 36 });
  if (t.nav) gsap.set(t.nav, { opacity: 0, y: -12 });

  tl.to(t.grid, { opacity: 1, duration: 0.28 }, 0)
    .to(t.veil, { opacity: 0, duration: 0.35 }, 0.12)
    .to(t.video, { opacity: 1, scale: 1, duration: 0.55 }, 0.15);

  if (t.nav) {
    tl.to(t.nav, { opacity: 1, y: 0, duration: 0.35 }, 0.35);
  }

  tl.to(t.eyebrow, { opacity: 1, y: 0, duration: 0.3 }, 0.42)
    .to(
      t.line1,
      {
        clipPath: "inset(0% 0 0 0)",
        y: 0,
        duration: 0.45,
        ease: "power4.out",
      },
      0.5,
    )
    .to(
      t.line2,
      {
        clipPath: "inset(0% 0 0 0)",
        y: 0,
        duration: 0.5,
        ease: "back.out(1.4)",
      },
      0.62,
    )
    .to(t.tagline, { opacity: 1, y: 0, duration: 0.28 }, 0.85)
    .to(t.sub, { opacity: 1, y: 0, duration: 0.28 }, 0.92)
    .to(t.actions, { opacity: 1, y: 0, duration: 0.3 }, 1.0)
    .to(t.scrollTag, { opacity: 1, y: 0, duration: 0.25 }, 1.1);

  return tl;
}

export function bindHeroParallax(
  root: HTMLElement,
  layers: { el: HTMLElement; max: number }[],
  reduced: boolean,
) {
  if (reduced || window.matchMedia("(pointer: coarse)").matches) {
    return () => undefined;
  }

  const onMove = (e: MouseEvent) => {
    const rect = root.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    layers.forEach(({ el, max }) => {
      gsap.to(el, {
        x: x * max,
        y: y * max,
        duration: 0.6,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  };

  const onLeave = () => {
    layers.forEach(({ el }) => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "power3.out" });
    });
  };

  root.addEventListener("mousemove", onMove);
  root.addEventListener("mouseleave", onLeave);
  return () => {
    root.removeEventListener("mousemove", onMove);
    root.removeEventListener("mouseleave", onLeave);
  };
}
