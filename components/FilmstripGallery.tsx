"use client";

import { useEffect, useRef } from "react";
import type { ImageAsset } from "@/content/types";
import styles from "./FilmstripGallery.module.css";

/**
 * Scroll-driven horizontal filmstrip (imitates the *feel* of the reference
 * erinnspringer.com/dormant-season gallery — not its UI or copy).
 *
 * The viewport is pinned: the page never scrolls vertically. Instead, vertical
 * wheel input is captured and mapped to a horizontal offset on a single long
 * flex track of oversized photographs. A per-frame linear interpolation (lerp)
 * eases the visible position toward the target, so the motion feels cinematic
 * and continuous rather than snapping like a carousel.
 *
 * Dependency-free (see DECISIONS.md D3): a small wheel/touch/keyboard handler +
 * requestAnimationFrame loop, no GSAP/Locomotive/OverlayScrollbars.
 */
export function FilmstripGallery({ images }: { images: ImageAsset[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!stage || !track) return;

    // Motion state lives in refs, not React state — we mutate the transform
    // directly every frame and never want to trigger a re-render.
    let target = 0; // where the strip wants to be (px scrolled)
    let current = 0; // where it visibly is (px), chased toward target
    let max = 0; // furthest scrollable offset
    let raf = 0;
    let running = false;

    const measure = () => {
      // Total scrollable distance = full track width minus one viewport.
      max = Math.max(0, track.scrollWidth - stage.clientWidth);
      target = Math.min(target, max);
      current = Math.min(current, max);
    };

    const tick = () => {
      // Ease the visible position toward the target. 0.09 ≈ a slow, filmic glide.
      const eased = current + (target - current) * 0.09;
      // Snap when close enough to avoid sub-pixel jitter forever.
      current = Math.abs(target - eased) < 0.1 ? target : eased;
      track.style.transform = `translate3d(${-current}px, 0, 0)`;
      if (progress) {
        progress.style.transform = `scaleX(${max > 0 ? current / max : 0})`;
      }
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
      // Map the dominant wheel axis to horizontal travel: a normal mouse wheel
      // sends deltaY, a trackpad may send either — take whichever is larger.
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      if (max <= 0) return; // nothing to scroll — let the page behave normally
      e.preventDefault();
      target = Math.min(Math.max(target + delta, 0), max);
      kick();
    };

    // Touch drag for coarse pointers (mobile / trackpad press-drag).
    let touchX = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchX = e.touches[0].clientX;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (max <= 0) return;
      const x = e.touches[0].clientX;
      const dx = touchX - x;
      touchX = x;
      e.preventDefault();
      target = Math.min(Math.max(target + dx, 0), max);
      // Touch feels best near-1:1, so pull current toward target faster.
      current = target;
      track.style.transform = `translate3d(${-current}px, 0, 0)`;
      if (progress) {
        progress.style.transform = `scaleX(${max > 0 ? current / max : 0})`;
      }
    };

    // Keyboard access: arrows / page keys / home / end move the strip.
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

    // Recompute bounds once images have loaded (their widths set the track size)
    // and whenever the layout changes.
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(stage);
    track.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure, { once: true });
    });

    measure();
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

  return (
    <div className={styles.stage} ref={stageRef} aria-label="Horizontal photo gallery">
      <div className={styles.track} ref={trackRef}>
        {images.map((image, i) => (
          <figure className={styles.frame} key={i}>
            {/* Click-to-focus: the data-zoomable button is picked up by the
                surrounding GalleryLightbox via event delegation (same mechanism
                as Figure.tsx), so a click opens the fullscreen enlargement. */}
            <button
              type="button"
              className={styles.trigger}
              data-zoomable
              data-zoom-src={image.src}
              data-zoom-w={image.width}
              data-zoom-h={image.height}
              data-zoom-alt={image.alt}
              aria-label={`Enlarge image: ${image.alt}`}
            >
              {/* Plain <img> (not next/image): the strip sizes images by height
                  with width:auto, so each keeps its true aspect ratio — no crop. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.img}
                src={image.src}
                alt={image.alt}
                draggable={false}
                loading={i < 3 ? "eager" : "lazy"}
                decoding="async"
              />
            </button>
          </figure>
        ))}
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressBar} ref={progressRef} />
      </div>
    </div>
  );
}
