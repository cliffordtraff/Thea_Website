"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { GalleryLightboxItem } from "./GalleryLightbox";
import styles from "./GalleryLightbox.module.css";

export function GalleryLightboxOverlay({
  item,
  itemCount,
  onClose,
  onNext,
  onPrevious,
}: {
  item: GalleryLightboxItem;
  itemCount: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const controls = Array.from(
          overlayRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") onNext();
      else if (event.key === "ArrowLeft") onPrevious();
      else return;
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, onNext, onPrevious]);

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      data-gallery-lightbox="open"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className={styles.close}
        aria-label="Close image viewer"
        onClick={onClose}
      >
        <span aria-hidden="true">×</span>
      </button>

      {itemCount > 1 ? (
        <button
          type="button"
          className={`${styles.arrow} ${styles.prev}`}
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation();
            onPrevious();
          }}
        >
          <span aria-hidden="true">‹</span>
        </button>
      ) : null}

      <figure className={styles.figure} onClick={(event) => event.stopPropagation()}>
        <Image
          key={item.src}
          src={item.src}
          width={item.w}
          height={item.h}
          alt={item.alt}
          sizes="100vw"
          quality={90}
          className={styles.image}
        />
      </figure>

      {itemCount > 1 ? (
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
        >
          <span aria-hidden="true">›</span>
        </button>
      ) : null}
    </div>,
    document.body,
  );
}
