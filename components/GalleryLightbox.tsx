"use client";

import Image from "next/image";
import { trackTheaEvent } from "@/lib/analytics";
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(-1);

  useEffect(() => setMounted(true), []);

  const open = index >= 0 && index < items.length;

  const close = useCallback(() => {
    setIndex(-1);
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
      trackTheaEvent("gallery_open", {
        path: window.location.pathname,
        image_index: (i >= 0 ? i : 0) + 1,
      });
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
      if (e.key === "Tab") {
        const controls = Array.from(
          overlayRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (!first || !last) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else return;

      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("keydown", onKey);
    const page = wrapRef.current;
    const wasInert = page?.inert ?? false;
    if (page) page.inert = true;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      if (page) page.inert = wasInert;
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus?.();
    };
  }, [open, close, next, prev]);

  const current = open ? items[index] : null;

  return (
    <div ref={wrapRef} className={styles.wrap}>
      {children}
      {mounted && open && current
        ? createPortal(
            <div
              ref={overlayRef}
              className={styles.overlay}
              role="dialog"
              aria-modal="true"
              aria-label="Image viewer"
              data-gallery-lightbox="open"
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
                {/* Serve the full-screen photograph responsively at high
                    quality. The source website JPEG is never modified. */}
                <Image
                  key={current.src}
                  src={current.src}
                  width={current.w}
                  height={current.h}
                  alt={current.alt}
                  sizes="100vw"
                  quality={90}
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
