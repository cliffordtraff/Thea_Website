"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ImageAsset } from "@/content/types";
import styles from "./v4.module.css";

type NavItem = { label: string; href: string; external?: boolean };

/*
 * TEST redesign, concept four — a two-mode experience with two modal layers:
 *
 *   Modes:
 *     1. "grid"  — a full-screen collage of every photograph.
 *     2. "reel"  — one photo at a time; each scroll gesture advances one photo.
 *
 *   Modal layers (research-driven additions):
 *     • Lightbox / zoom — clicking the current reel photo opens a distraction-free
 *       full-screen view with keyboard + button navigation (WCAG 2.1.1).
 *     • Overlay menu — the nav is hidden behind a "Menu" button and revealed as a
 *       full-screen overlay, keeping imagery uninterrupted until summoned.
 *
 * The scroll engine runs imperatively (refs + data-mode, no re-renders). The two
 * modal layers use React state and, while either is open, gate the engine via
 * blockRef so wheel/touch/keys drive the modal, not the reel.
 */
export function V4Experience({
  images,
  nav,
}: {
  images: ImageAsset[];
  nav: NavItem[];
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  // Imperative engine API, exposed so the modal layers can keep the reel synced.
  const apiRef = useRef<{ goTo: (i: number) => void } | null>(null);
  // While a modal layer is open, the scroll engine stands down.
  const blockRef = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({
    open: false,
    index: 0,
  });

  const n = images.length;

  // ── Scroll engine (grid ⇄ reel) ─────────────────────────────
  useEffect(() => {
    const shell = shellRef.current;
    const grid = gridRef.current;
    const track = trackRef.current;
    const dotsWrap = dotsRef.current;
    if (!shell || !track) return;

    const dots = dotsWrap ? (Array.from(dotsWrap.children) as HTMLElement[]) : [];

    let mode: "grid" | "reel" = "grid";
    let index = 0;
    let locked = false;
    let unlockTimer = 0;

    const lock = (ms = 720) => {
      locked = true;
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => {
        locked = false;
      }, ms);
    };

    const setMode = (m: "grid" | "reel") => {
      mode = m;
      shell.dataset.mode = m;
    };

    const render = () => {
      track.style.transform = `translate3d(-${index * 100}vw, 0, 0)`;
      dots.forEach((d, i) =>
        d.setAttribute("data-on", i === index ? "true" : "false")
      );
    };

    const goTo = (i: number) => {
      index = Math.max(0, Math.min(n - 1, i));
      render();
    };
    // Expose to modal layers.
    apiRef.current = { goTo };

    const enterReel = (i = 0) => {
      setMode("reel");
      goTo(i);
      lock();
    };

    const step = (dir: number) => {
      if (dir < 0 && index === 0) {
        setMode("grid");
        lock();
        return;
      }
      const next = index + dir;
      if (next < 0 || next >= n) {
        lock(300);
        return;
      }
      goTo(next);
      lock();
    };

    const onWheel = (e: WheelEvent) => {
      if (blockRef.current) return;
      e.preventDefault();
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 6 || locked) return;
      if (mode === "grid") {
        if (delta > 0) enterReel(0);
        return;
      }
      step(delta > 0 ? 1 : -1);
    };

    let sx = 0;
    let sy = 0;
    const onTouchStart = (e: TouchEvent) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (blockRef.current) return;
      const t = e.changedTouches[0];
      const dx = sx - t.clientX;
      const dy = sy - t.clientY;
      const delta = Math.abs(dy) > Math.abs(dx) ? dy : dx;
      if (Math.abs(delta) < 40 || locked) return;
      if (mode === "grid") {
        if (delta > 0) enterReel(0);
        return;
      }
      step(delta > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      if (blockRef.current || locked) return;
      const fwd = ["ArrowRight", "ArrowDown", "PageDown", " "];
      const back = ["ArrowLeft", "ArrowUp", "PageUp"];
      if (fwd.includes(e.key)) {
        e.preventDefault();
        mode === "grid" ? enterReel(0) : step(1);
      } else if (back.includes(e.key)) {
        e.preventDefault();
        if (mode === "reel") step(-1);
      } else if (e.key === "Home") {
        if (mode === "reel") goTo(0);
      } else if (e.key === "Escape") {
        if (mode === "reel") {
          setMode("grid");
          lock();
        }
      }
    };

    // Click a collage tile → open the reel at that photo.
    const onGridClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest("[data-index]");
      if (!btn) return;
      enterReel(Number(btn.getAttribute("data-index")));
    };
    const onDotClick = (e: MouseEvent) => {
      const i = dots.indexOf(e.target as HTMLElement);
      if (i >= 0) goTo(i);
    };

    render();
    shell.addEventListener("wheel", onWheel, { passive: false });
    shell.addEventListener("touchstart", onTouchStart, { passive: true });
    shell.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    grid?.addEventListener("click", onGridClick);
    dotsWrap?.addEventListener("click", onDotClick);

    return () => {
      window.clearTimeout(unlockTimer);
      apiRef.current = null;
      shell.removeEventListener("wheel", onWheel);
      shell.removeEventListener("touchstart", onTouchStart);
      shell.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      grid?.removeEventListener("click", onGridClick);
      dotsWrap?.removeEventListener("click", onDotClick);
    };
  }, [n]);

  // Keep the engine gated whenever a modal layer is open.
  useEffect(() => {
    blockRef.current = menuOpen || lightbox.open;
  }, [menuOpen, lightbox.open]);

  // ── Lightbox controls ───────────────────────────────────────
  const openLightbox = (i: number) => setLightbox({ open: true, index: i });
  const closeLightbox = () => setLightbox((l) => ({ ...l, open: false }));
  const navLightbox = (dir: number) =>
    setLightbox((l) => {
      const i = Math.max(0, Math.min(n - 1, l.index + dir));
      apiRef.current?.goTo(i); // keep the reel underneath in sync
      return { open: true, index: i };
    });

  useEffect(() => {
    if (!lightbox.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") navLightbox(1);
      else if (e.key === "ArrowLeft") navLightbox(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox.open]);

  // ── Menu controls ───────────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const goHomeToGrid = () => {
    const shell = shellRef.current;
    if (shell) shell.dataset.mode = "grid";
  };

  const current = images[lightbox.index];

  return (
    <div className={styles.shell} ref={shellRef} data-mode="grid">
      <header className={styles.topbar}>
        <a href="/v4" className={styles.wordmark}>
          Thea Traff
        </a>
        <div className={styles.topRight}>
          <button
            type="button"
            className={styles.indexBtn}
            onClick={goHomeToGrid}
          >
            ⊞ Index
          </button>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setMenuOpen(true)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <span className={styles.menuBtnBars} aria-hidden="true">
              <span />
              <span />
            </span>
            Menu
          </button>
        </div>
      </header>

      {/* Collage */}
      <div className={styles.grid} ref={gridRef} aria-label="Photo index">
        {images.map((image, i) => (
          <button
            key={image.src}
            type="button"
            className={styles.tile}
            data-index={i}
            aria-label={`Open photo ${i + 1}`}
          >
            <Image
              src={image.src}
              fill
              alt={image.alt}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={styles.tileImg}
              draggable={false}
              priority={i < 6}
              decoding="async"
            />
          </button>
        ))}
      </div>

      {/* One-at-a-time reel */}
      <div className={styles.reel}>
        <div className={styles.track} ref={trackRef}>
          {images.map((image, i) => (
            <figure className={styles.panel} key={image.src}>
              <button
                type="button"
                className={styles.panelBtn}
                onClick={() => openLightbox(i)}
                aria-label={`Zoom photo ${i + 1}`}
              >
                <span className={styles.imgWrap}>
                  <Image
                    src={image.src}
                    fill
                    alt={image.alt}
                    sizes="100vw"
                    className={styles.panelImg}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className={styles.zoomCue} aria-hidden="true">
                  ⤢ View
                </span>
              </button>
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
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
        <div className={styles.hint}>
          <span className={styles.hintGrid}>scroll to enter</span>
          <span className={styles.hintReel}>scroll — photo by photo</span>
        </div>
      </footer>

      {/* ── Full-screen overlay menu ─────────────────────────── */}
      <div
        className={styles.menuOverlay}
        data-open={menuOpen}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className={styles.menuClose}
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          Close ✕
        </button>
        <nav className={styles.menuList} aria-label="Sections">
          {nav.map((item, i) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                className={styles.menuItem}
                target="_blank"
                rel="noopener noreferrer"
                style={{ transitionDelay: `${0.05 + i * 0.04}s` }}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className={styles.menuItem}
                style={{ transitionDelay: `${0.05 + i * 0.04}s` }}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            )
          )}
        </nav>
      </div>

      {/* ── Lightbox / zoom ──────────────────────────────────── */}
      <div
        className={styles.lightbox}
        data-open={lightbox.open}
        role="dialog"
        aria-modal="true"
        aria-label="Photo viewer"
        aria-hidden={!lightbox.open}
      >
        <button
          type="button"
          className={styles.lbBackdrop}
          onClick={closeLightbox}
          aria-label="Close viewer"
          tabIndex={-1}
        />
        <button
          type="button"
          className={`${styles.lbNav} ${styles.lbPrev}`}
          onClick={() => navLightbox(-1)}
          aria-label="Previous photo"
          disabled={lightbox.index === 0}
        >
          ‹
        </button>
        <figure className={styles.lbFrame}>
          {lightbox.open && current ? (
            <Image
              key={current.src}
              src={current.src}
              fill
              alt={current.alt}
              sizes="100vw"
              className={styles.lbImg}
              priority
            />
          ) : null}
        </figure>
        <button
          type="button"
          className={`${styles.lbNav} ${styles.lbNext}`}
          onClick={() => navLightbox(1)}
          aria-label="Next photo"
          disabled={lightbox.index === n - 1}
        >
          ›
        </button>
        <button
          type="button"
          className={styles.lbClose}
          onClick={closeLightbox}
          aria-label="Close viewer"
        >
          Close ✕
        </button>
      </div>
    </div>
  );
}
