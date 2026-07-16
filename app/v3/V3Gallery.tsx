"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { ImageAsset } from "@/content/types";
import styles from "./v3.module.css";

type NavItem = { label: string; href: string; external?: boolean };

/*
 * TEST redesign, concept three. Full-bleed slides: each photograph fills the
 * whole viewport. Vertical wheel input still drives horizontal travel with an
 * eased lerp, but here it's panel-to-panel — and every frame runs a per-slide
 * parallax (the image drifts slower than the panel) while off-centre slides
 * dim, for a cinematic reveal. Dot navigation, no numerals.
 */
export function V3Gallery({
  images,
  nav,
}: {
  images: ImageAsset[];
  nav: NavItem[];
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    const dotsWrap = dotsRef.current;
    if (!stage || !track) return;

    const panels = Array.from(track.children) as HTMLElement[];
    const dots = dotsWrap
      ? (Array.from(dotsWrap.children) as HTMLElement[])
      : [];

    let target = 0;
    let current = 0;
    let panelW = stage.clientWidth;
    let max = 0;
    let raf = 0;
    let running = false;
    let activeDot = -1;

    const measure = () => {
      panelW = stage.clientWidth || 1;
      max = Math.max(0, track.scrollWidth - stage.clientWidth);
      target = Math.min(target, max);
      current = Math.min(current, max);
    };

    const paint = () => {
      track.style.transform = `translate3d(${-current}px, 0, 0)`;
      const amount = panelW * 0.05; // parallax travel budget (letterbox margin)

      for (let i = 0; i < panels.length; i++) {
        // rel = 0 when panel i sits exactly in the viewport; ±1 for neighbours.
        const rel = (i * panelW - current) / panelW;
        const clamped = Math.max(-1.4, Math.min(1.4, rel));
        const inner = panels[i].firstElementChild as HTMLElement | null;
        const dim = panels[i].lastElementChild as HTMLElement | null;
        if (inner) inner.style.transform = `translate3d(${clamped * amount}px,0,0)`;
        if (dim) dim.style.opacity = String(Math.min(0.68, Math.abs(rel) * 0.72));
      }

      // Active dot = nearest panel.
      const idx = Math.max(
        0,
        Math.min(panels.length - 1, Math.round(current / panelW))
      );
      if (idx !== activeDot) {
        dots.forEach((d, i) =>
          d.setAttribute("data-on", i === idx ? "true" : "false")
        );
        activeDot = idx;
      }
    };

    const tick = () => {
      const eased = current + (target - current) * 0.08;
      current = Math.abs(target - eased) < 0.1 ? target : eased;
      paint();
      if (Math.abs(target - current) > 0.1) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onWheel = (e: WheelEvent) => {
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0 || max <= 0) return;
      e.preventDefault();
      target = Math.min(Math.max(target + delta, 0), max);
      kick();
    };

    let touchX = 0;
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (max <= 0) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = touchX - x;
      const dy = y - touchY;
      touchX = x;
      touchY = y;
      const delta = Math.abs(dy) > Math.abs(dx) ? dy : dx;
      e.preventDefault();
      target = Math.min(Math.max(target + delta, 0), max);
      current = target;
      paint();
    };

    // Snap to a slide when using keys / dots.
    const goTo = (i: number) => {
      target = Math.min(Math.max(i * panelW, 0), max);
      kick();
    };
    const onKey = (e: KeyboardEvent) => {
      const cur = Math.round(current / panelW);
      if (e.key === "ArrowRight" || e.key === "PageDown") goTo(cur + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(cur - 1);
      else if (e.key === "Home") goTo(0);
      else if (e.key === "End") goTo(panels.length - 1);
      else return;
      e.preventDefault();
    };

    const onDotClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const i = dots.indexOf(t);
      if (i >= 0) goTo(i);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(stage);

    measure();
    paint();
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", measure);
    dotsWrap?.addEventListener("click", onDotClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", measure);
      dotsWrap?.removeEventListener("click", onDotClick);
    };
  }, [images.length]);

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <a href="/v3" className={styles.wordmark}>
          Thea Traff
        </a>
        <nav className={styles.nav} aria-label="Sections">
          {nav.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                className={styles.navLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <a key={item.label} href={item.href} className={styles.navLink}>
                {item.label}
              </a>
            )
          )}
        </nav>
      </header>

      <div className={styles.stage} ref={stageRef} aria-label="Full-bleed reel">
        <div className={styles.track} ref={trackRef}>
          {images.map((image, i) => (
            <figure className={styles.panel} key={image.src}>
              <div className={styles.imgWrap}>
                <Image
                  className={styles.img}
                  src={image.src}
                  fill
                  alt={image.alt}
                  sizes="100vw"
                  draggable={false}
                  priority={i < 2}
                  loading={i < 2 ? undefined : "lazy"}
                  decoding="async"
                />
              </div>
              <div className={styles.dim} aria-hidden="true" />
            </figure>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.dots} ref={dotsRef} aria-hidden="true">
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              className={styles.dot}
              data-on={i === 0 ? "true" : "false"}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <div className={styles.hint}>scroll</div>
      </footer>
    </div>
  );
}
