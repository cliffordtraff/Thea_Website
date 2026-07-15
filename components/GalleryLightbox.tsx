"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./GalleryLightbox.module.css";

/*
 * Lightweight fullscreen lightbox — imitates the click-to-enlarge "quick view"
 * on theatraff.com without any third-party library (the brief bans heavy libs
 * and wants minimal client JS). One small Client Component per gallery.
 *
 * How it works:
 *  - Server-rendered images carry `data-zoomable` + `data-zoom-*` attributes
 *    (see Figure.tsx). This provider wraps the page content and catches clicks
 *    on them via event delegation, so almost everything stays server-rendered.
 *  - Opens a fullscreen overlay with the image centered and uncropped, a close
 *    (×) control, and prev/next (‹ ›) arrows that cycle the page's image set.
 *  - Keyboard: Esc closes, ←/→ navigate. Backdrop click closes. Focus is moved
 *    into the dialog and restored on close. Body scroll is locked while open.
 */

interface Item {
  src: string;
  w: number;
  h: number;
  alt: string;
}

export function GalleryLightbox({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(-1);

  useEffect(() => setMounted(true), []);

  const open = index >= 0 && index < items.length;

  const close = useCallback(() => {
    setIndex(-1);
    lastFocus.current?.focus?.();
  }, []);

  const next = useCallback(
    () => setIndex((i) => (items.length ? (i + 1) % items.length : i)),
    [items.length],
  );
  const prev = useCallback(
    () => setIndex((i) => (items.length ? (i - 1 + items.length) % items.length : i)),
    [items.length],
  );

  // Click delegation: open the lightbox when a zoomable image is activated.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const trigger = target?.closest("[data-zoomable]");
      if (!trigger || !el.contains(trigger)) return;
      e.preventDefault();
      const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-zoomable]"));
      const list: Item[] = nodes.map((n) => ({
        src: n.getAttribute("data-zoom-src") ?? "",
        w: Number(n.getAttribute("data-zoom-w")) || 0,
        h: Number(n.getAttribute("data-zoom-h")) || 0,
        alt: n.getAttribute("data-zoom-alt") ?? "",
      }));
      const i = nodes.indexOf(trigger as HTMLElement);
      lastFocus.current = document.activeElement as HTMLElement;
      setItems(list);
      setIndex(i >= 0 ? i : 0);
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);

  // Keyboard nav, scroll lock, and initial focus while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, next, prev]);

  const current = open ? items[index] : null;

  return (
    <div ref={wrapRef} className={styles.wrap}>
      {children}
      {mounted && open && current
        ? createPortal(
            <div
              className={styles.overlay}
              role="dialog"
              aria-modal="true"
              aria-label="Image viewer"
              onClick={close}
            >
              <button
                ref={closeRef}
                type="button"
                className={styles.close}
                aria-label="Close image viewer"
                onClick={close}
              >
                <span aria-hidden="true">×</span>
              </button>

              {items.length > 1 ? (
                <button
                  type="button"
                  className={`${styles.arrow} ${styles.prev}`}
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                >
                  <span aria-hidden="true">‹</span>
                </button>
              ) : null}

              <figure
                className={styles.figure}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Plain <img>: dynamic full-size view, loaded on demand.
                    next/image optimization isn't needed for a single on-demand
                    enlargement, and this keeps the client component dependency-free. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={current.src}
                  src={current.src}
                  width={current.w}
                  height={current.h}
                  alt={current.alt}
                  className={styles.image}
                />
              </figure>

              {items.length > 1 ? (
                <button
                  type="button"
                  className={`${styles.arrow} ${styles.next}`}
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                >
                  <span aria-hidden="true">›</span>
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
