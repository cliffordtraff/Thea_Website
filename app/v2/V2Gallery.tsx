"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { ImageAsset } from "@/content/types";
import styles from "./v2.module.css";

type NavItem = { label: string; href: string; external?: boolean };

/*
 * TEST redesign gallery. Same core idea as the production FilmstripGallery —
 * vertical wheel input is mapped to horizontal travel with a per-frame lerp —
 * but a distinct presentation: staggered frame heights, oversized ghost index
 * numerals, a top chrome bar, and a live "NN / total" counter driving a bottom
 * rule. Reimplemented from scratch here so the original component is untouched.
 */
export function V2Gallery({
  images,
  nav,
}: {
  images: ImageAsset[];
  nav: NavItem[];
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    const bar = barRef.current;
    const counter = counterRef.current;
    if (!stage || !track) return;

    let target = 0;
    let current = 0;
    let max = 0;
    let raf = 0;
    let running = false;
    let lastIndex = -1;

    const measure = () => {
      max = Math.max(0, track.scrollWidth - stage.clientWidth);
      target = Math.min(target, max);
      current = Math.min(current, max);
    };

    const paint = () => {
      track.style.transform = `translate3d(${-current}px, 0, 0)`;
      const p = max > 0 ? current / max : 0;
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (counter) {
        // Which frame is nearest the left reading edge.
        const frames = track.children.length;
        const idx = Math.min(frames, Math.round(p * (frames - 1)) + 1);
        if (idx !== lastIndex) {
          counter.textContent = String(idx).padStart(2, "0");
          lastIndex = idx;
        }
      }
    };

    const tick = () => {
      const eased = current + (target - current) * 0.085;
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

    const onKey = (e: KeyboardEvent) => {
      const step = stage.clientWidth * 0.6;
      let next = target;
      if (e.key === "ArrowRight" || e.key === "PageDown") next = target + step;
      else if (e.key === "ArrowLeft" || e.key === "PageUp") next = target - step;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = max;
      else return;
      e.preventDefault();
      target = Math.min(Math.max(next, 0), max);
      kick();
    };

    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(stage);
    track.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure, { once: true });
    });

    measure();
    paint();
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", measure);
    };
  }, [images.length]);

  // Rhythm pattern for staggered frame heights + vertical anchoring.
  const layout = [
    styles.tall,
    styles.mid,
    styles.short,
    styles.tall,
    styles.midLow,
    styles.short,
    styles.tall,
    styles.mid,
  ];

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <a href="/v2" className={styles.wordmark}>
          Thea Traff
          <span className={styles.tag}>test build</span>
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

      <div
        className={styles.stage}
        ref={stageRef}
        aria-label="Horizontal photo reel"
      >
        <div className={styles.track} ref={trackRef}>
          {images.map((image, i) => {
            const ratio = (image.width / image.height).toFixed(3);
            const sizes = `(max-width: 768px) calc(58vh * ${ratio}), calc(70vh * ${ratio})`;
            return (
              <figure
                className={`${styles.frame} ${layout[i % layout.length]}`}
                key={image.src}
              >
                <div className={styles.imgWrap}>
                  <Image
                    className={styles.img}
                    src={image.src}
                    width={image.width}
                    height={image.height}
                    alt={image.alt}
                    sizes={sizes}
                    draggable={false}
                    priority={i < 3}
                    loading={i < 3 ? undefined : "lazy"}
                    decoding="async"
                  />
                </div>
              </figure>
            );
          })}
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.counter}>
          <span ref={counterRef}>01</span>
          <span className={styles.counterTotal}>
            / {String(images.length).padStart(2, "0")}
          </span>
        </div>
        <div className={styles.rail} aria-hidden="true">
          <div className={styles.railBar} ref={barRef} />
        </div>
        <div className={styles.hint}>scroll →</div>
      </footer>
    </div>
  );
}
