"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackTheaEvent } from "@/lib/analytics";
import styles from "./GalleryLightbox.module.css";

export interface GalleryLightboxItem {
  src: string;
  w: number;
  h: number;
  alt: string;
}

const loadGalleryLightboxOverlay = () =>
  import("./GalleryLightboxOverlay").then(
    (module) => module.GalleryLightboxOverlay,
  );

function GalleryLightboxLoading() {
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadingRef.current?.focus();
  }, []);

  return createPortal(
    <div
      ref={loadingRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Loading image viewer"
      aria-busy="true"
      tabIndex={-1}
      data-gallery-lightbox="loading"
    >
      <span className={styles.loadingStatus}>Loading image…</span>
    </div>,
    document.body,
  );
}

const GalleryLightboxOverlay = dynamic(loadGalleryLightboxOverlay, {
  ssr: false,
  loading: GalleryLightboxLoading,
});

/** Delegates gallery clicks; the fullscreen viewer bundle loads on first use. */
export function GalleryLightbox({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const [items, setItems] = useState<GalleryLightboxItem[]>([]);
  const [index, setIndex] = useState(-1);

  const open = index >= 0 && index < items.length;
  const close = useCallback(() => setIndex(-1), []);
  const next = useCallback(
    () => setIndex((current) => (current + 1) % items.length),
    [items.length],
  );
  const previous = useCallback(
    () =>
      setIndex((current) => (current - 1 + items.length) % items.length),
    [items.length],
  );

  useEffect(() => {
    if (!open) return;
    const page = wrapRef.current;
    const wasInert = page?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };

    if (page) page.inert = true;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      if (page) page.inert = wasInert;
      document.body.style.overflow = previousOverflow;
      lastFocus.current?.focus?.();
    };
  }, [close, open]);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;

    const onIntent = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-zoomable]")) void loadGalleryLightboxOverlay();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const trigger = target?.closest<HTMLElement>("[data-zoomable]");
      if (!trigger || !element.contains(trigger)) return;
      event.preventDefault();

      const nodes = Array.from(
        element.querySelectorAll<HTMLElement>("[data-zoomable]"),
      );
      const nextItems = nodes.map((node) => ({
        src: node.dataset.zoomSrc ?? "",
        w: Number(node.dataset.zoomW) || 0,
        h: Number(node.dataset.zoomH) || 0,
        alt: node.dataset.zoomAlt ?? "",
      }));
      const nextIndex = Math.max(0, nodes.indexOf(trigger));
      lastFocus.current = document.activeElement as HTMLElement | null;
      trackTheaEvent("gallery_open", {
        path: window.location.pathname,
        image_index: nextIndex + 1,
      });
      setItems(nextItems);
      setIndex(nextIndex);
    };

    element.addEventListener("click", onClick);
    element.addEventListener("pointerover", onIntent, { passive: true });
    element.addEventListener("focusin", onIntent);
    element.addEventListener("touchstart", onIntent, { passive: true });
    return () => {
      element.removeEventListener("click", onClick);
      element.removeEventListener("pointerover", onIntent);
      element.removeEventListener("focusin", onIntent);
      element.removeEventListener("touchstart", onIntent);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      {children}
      {open ? (
        <GalleryLightboxOverlay
          item={items[index]}
          itemCount={items.length}
          onClose={close}
          onNext={next}
          onPrevious={previous}
        />
      ) : null}
    </div>
  );
}
