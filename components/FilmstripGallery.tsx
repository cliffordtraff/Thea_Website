"use client";

import { useCallback, useEffect, useRef } from "react";
import Image, { getImageProps } from "next/image";
import type { ImageAsset } from "@/content/types";
import type {
  GalleryFastPathSources,
  GalleryImageCandidate,
} from "@/lib/first-frame-image";
import styles from "./FilmstripGallery.module.css";

declare global {
  interface Window {
    __theaGalleryLoader?: {
      start: (stage: HTMLElement) => unknown;
      request: (
        stage: HTMLElement,
        images: Iterable<HTMLImageElement>,
        options?: { urgent?: boolean },
      ) => void;
    };
  }
}

// Photo one gets exclusive bandwidth. The next three are serial on a measured
// slow session and parallel on a fast one; later requests follow proximity.
const INITIAL_DESKTOP_WARM_AHEAD = 3;
const DESKTOP_LOOKAHEAD_VIEWPORTS = 1;
const DESKTOP_URGENT_COUNT = 3;

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
function candidateSrcSet(candidates: GalleryImageCandidate[]) {
  return candidates.map(({ src, width }) => `${src} ${width}w`).join(", ");
}

export function FilmstripGallery({
  images,
  openingFastPath,
}: {
  images: ImageAsset[];
  openingFastPath: GalleryFastPathSources[];
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const firstSrc = images[0]?.src;
  const revealSequenceRef = useRef({
    firstSrc,
    settled: [] as boolean[],
    next: 0,
  });

  if (revealSequenceRef.current.firstSrc !== firstSrc) {
    revealSequenceRef.current = { firstSrc, settled: [], next: 0 };
  }

  const markImageSettled = useCallback((index: number) => {
    const sequence = revealSequenceRef.current;
    sequence.settled[index] = true;

    const galleryImages = trackRef.current?.querySelectorAll("img");
    if (!galleryImages) return;

    // Reveal only the contiguous ready prefix. A small later file may finish
    // first, but it stays hidden until every photograph before it is ready.
    while (
      sequence.next < galleryImages.length &&
      sequence.settled[sequence.next]
    ) {
      galleryImages[sequence.next].dataset.sequenceReady = "true";
      sequence.next += 1;
    }
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    const hint = hintRef.current;
    if (!stage || !track) return;
    window.__theaGalleryLoader?.start(stage);

    // Below 768px the gallery is a plain vertical stack (see
    // FilmstripGallery.module.css) — native page scroll, no scroll-jacking.
    // See DECISIONS.md D18. This wires/tears down the desktop-only horizontal
    // scroll-jacking behavior as the viewport crosses that breakpoint (e.g.
    // rotating a tablet, resizing a window), not just once on mount.
    const mql = window.matchMedia("(min-width: 769px)");
    let teardownResponsiveBehavior: (() => void) | null = null;

    const installDeferredSource = (img: HTMLImageElement) => {
      img
        .closest("picture")
        ?.querySelectorAll<HTMLSourceElement>(
          "source[data-deferred-srcset], source[data-deferred-srcset-slow], source[data-deferred-srcset-fast]",
        )
        .forEach((source) => {
          const srcset =
            source.dataset.deferredSrcsetFast ??
            source.dataset.deferredSrcsetSlow ??
            source.dataset.deferredSrcset;
          if (srcset) source.srcset = srcset;
          delete source.dataset.deferredSrcset;
          delete source.dataset.deferredSrcsetSlow;
          delete source.dataset.deferredSrcsetFast;
        });
      const deferredSrc = img.dataset.deferredSrc;
      if (!deferredSrc) return;

      const deferredSrcSet =
        img.dataset.deferredSrcsetFast ??
        img.dataset.deferredSrcsetSlow ??
        img.dataset.deferredSrcset;
      if (deferredSrcSet) img.srcset = deferredSrcSet;
      img.src = deferredSrc;
      delete img.dataset.deferredSrc;
      delete img.dataset.deferredSrcset;
      delete img.dataset.deferredSrcsetSlow;
      delete img.dataset.deferredSrcsetFast;
    };

    const requestImages = (
      imagesToRequest: HTMLImageElement[],
      options?: { urgent?: boolean },
    ) => {
      const loader = window.__theaGalleryLoader;
      if (loader) loader.request(stage, imagesToRequest, options);
      else imagesToRequest.forEach(installDeferredSource);
    };

    const prefetchedFirstFrames = new Set<string>();
    const onGalleryIntent = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>(
        "a[data-gallery-first-frame]",
      );
      const href = link?.dataset.galleryFirstFrame;
      if (
        !href ||
        document.documentElement.dataset.galleryConnection !== "fast" ||
        stage.dataset.galleryQueueIdle !== "true" ||
        prefetchedFirstFrames.has(href)
      ) {
        return;
      }
      prefetchedFirstFrames.add(href);
      const prefetch = new window.Image();
      prefetch.fetchPriority = "low";
      prefetch.src = href;
    };
    document.addEventListener("pointerover", onGalleryIntent, { passive: true });
    document.addEventListener("focusin", onGalleryIntent);
    document.addEventListener("touchstart", onGalleryIntent, { passive: true });

    const attachDesktopBehavior = () => {
      // Motion state lives in refs, not React state — we mutate the transform
      // directly every frame and never want to trigger a re-render.
      let target = 0; // where the strip wants to be (px scrolled)
      let current = 0; // where it visibly is (px), chased toward target
      let max = 0; // furthest scrollable offset
      let raf = 0;
      let running = false;
      let hasAdvanced = false;
      let urgentTimer = 0;

      const galleryImages = Array.from(
        track.querySelectorAll<HTMLImageElement>("img"),
      );
      const firstImage = galleryImages[0];
      let firstRequestSettled = Boolean(
        firstImage?.complete && firstImage.naturalWidth > 0,
      );
      galleryImages.forEach((img, index) => {
        if (img.complete && img.naturalWidth > 0) markImageSettled(index);
      });

      const hasReadyPhotoAt = (offset: number) =>
        galleryImages.some((img) => {
          if (img.dataset.sequenceReady !== "true") return false;
          const frame = img.closest<HTMLElement>("figure");
          return (
            frame !== null &&
            frame.offsetLeft + frame.offsetWidth > offset &&
            frame.offsetLeft < offset + stage.clientWidth
          );
        });

      const prepareImage = (img: HTMLImageElement) => {
        if (!img.dataset.deferredSrc) return false;
        // Look-ahead requests should start early without competing with the
        // first photograph's sole high-priority request.
        img.fetchPriority = "low";
        img.loading = "eager";
        return true;
      };

      const prioritizeDestination = (offset: number) => {
        const urgentImages = galleryImages
          .slice(INITIAL_DESKTOP_WARM_AHEAD + 1)
          .filter((img) => {
            const frame = img.closest<HTMLElement>("figure");
            return (
              frame &&
              frame.offsetLeft + frame.offsetWidth > offset &&
              frame.offsetLeft < offset + stage.clientWidth * 1.5
            );
          })
          .slice(0, DESKTOP_URGENT_COUNT)
          .filter(prepareImage);
        if (urgentImages.length) {
          requestImages(urgentImages, { urgent: true });
        }
      };

      const scheduleDestinationPriority = (offset: number) => {
        if (!hasAdvanced) return;
        if (urgentTimer) clearTimeout(urgentTimer);
        // Trackpads emit a burst of wheel events. Wait for the destination to
        // settle briefly so a single fast gesture does not start a new
        // three-photo parallel batch at every intermediate position.
        urgentTimer = window.setTimeout(() => {
          urgentTimer = 0;
          prioritizeDestination(offset);
        }, 60);
      };

      const warmThrough = (offset: number) => {
        if (!firstRequestSettled) return;

        const cutoff =
          offset +
          stage.clientWidth * (1 + DESKTOP_LOOKAHEAD_VIEWPORTS);

        // A deliberate user gesture changes the priority contract: preserve
        // the serial opening four, then jump the destination photograph and
        // two nearby frames ahead of background work.
        scheduleDestinationPriority(offset);

        galleryImages.forEach((img, index) => {
          const frame = img.closest<HTMLElement>("figure");
          const isInsideInitialBuffer =
            index <= INITIAL_DESKTOP_WARM_AHEAD;
          if (
            frame &&
            frame.offsetLeft < cutoff &&
            (hasAdvanced || isInsideInitialBuffer) &&
            prepareImage(img)
          ) {
            requestImages([img]);
          }
        });
      };

      // The shared loader serializes this batch on slow sessions and releases
      // it together only after a fast first-image measurement.
      const warmInitialBuffer = () => {
        firstRequestSettled = true;
        galleryImages
          .slice(1, 1 + INITIAL_DESKTOP_WARM_AHEAD)
          .filter(prepareImage)
          .forEach((image) => requestImages([image]));
        warmThrough(target);
      };

      if (firstRequestSettled) {
        warmInitialBuffer();
      } else {
        firstImage?.addEventListener("load", warmInitialBuffer, { once: true });
        firstImage?.addEventListener("error", warmInitialBuffer, { once: true });
      }

      // One-time "scroll sideways" discoverability cue. It only appears when
      // the strip can actually scroll (so the single-image landing never
      // shows it), and retires permanently the first time the user moves it.
      let hintDismissed = false;
      let hintTimer = 0;
      const dismissHint = () => {
        if (hintDismissed) return;
        hintDismissed = true;
        if (hintTimer) clearTimeout(hintTimer);
        if (hint) hint.dataset.hidden = "true";
      };

      const measure = () => {
        // Total scrollable distance = full track width minus one viewport.
        max = Math.max(0, track.scrollWidth - stage.clientWidth);
        target = Math.min(target, max);
        current = Math.min(current, max);
        warmThrough(target);
        // Reveal the cue only once the images have set a scrollable track
        // width; keep it hidden (and never resurrect it) once dismissed.
        if (hint && !hintDismissed) {
          hint.dataset.hidden = max > 0 ? "false" : "true";
        }
      };

      const tick = () => {
        // Ease the visible position toward the target. 0.09 ≈ a slow, filmic glide.
        const eased = current + (target - current) * 0.09;
        const proposed = Math.abs(target - eased) < 0.1 ? target : eased;
        if (hasReadyPhotoAt(proposed)) {
          current = proposed;
        } else if (hasReadyPhotoAt(target)) {
          // A very fast gesture may intentionally skip several unloaded
          // frames. Once its prioritized destination is ready, jump there
          // instead of animating through a white interval.
          current = target;
        }
        // Otherwise hold the last photograph on screen until either the
        // intervening frame or the prioritized destination settles.
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
        // Map the dominant wheel axis to horizontal travel: a normal mouse
        // wheel sends deltaY, a trackpad may send either — take whichever is
        // larger.
        const delta =
          Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (delta === 0) return;
        if (max <= 0) return; // nothing to scroll — let the page behave normally
        e.preventDefault();
        dismissHint();
        target = Math.min(Math.max(target + delta, 0), max);
        hasAdvanced = hasAdvanced || target > 0;
        warmThrough(target);
        kick();
      };

      // Touch drag for coarse pointers (trackpad press-drag on desktop —
      // touchscreens under 769px never attach this). Both axes drive the
      // horizontal strip: a vertical drag (finger up→down) advances to the
      // right, and a horizontal drag (right→left) does the same — whichever
      // axis dominates the gesture wins. This mirrors the wheel handler,
      // which already maps vertical input to horizontal travel.
      let touchX = 0;
      let touchY = 0;
      const onTouchStart = (e: TouchEvent) => {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
      };
      const onTouchMove = (e: TouchEvent) => {
        if (max <= 0) return;
        dismissHint();
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const dx = touchX - x; // right→left drag = advance right
        const dy = y - touchY; // up→down drag  = advance right
        touchX = x;
        touchY = y;
        // Use whichever axis moved more this frame, so either gesture works.
        const delta = Math.abs(dy) > Math.abs(dx) ? dy : dx;
        e.preventDefault();
        target = Math.min(Math.max(target + delta, 0), max);
        hasAdvanced = hasAdvanced || target > 0;
        warmThrough(target);
        // Touch feels best near-1:1, so pull current toward target faster.
        if (hasReadyPhotoAt(target)) current = target;
        track.style.transform = `translate3d(${-current}px, 0, 0)`;
        if (progress) {
          progress.style.transform = `scaleX(${max > 0 ? current / max : 0})`;
        }
      };

      // Keyboard access: arrows / page keys / home / end move the strip.
      const onKey = (e: KeyboardEvent) => {
        // The lightbox owns keyboard navigation while it is open. Leaving the
        // filmstrip active would move the hidden track and warm more images.
        if (document.querySelector('[data-gallery-lightbox="open"]')) return;

        const step = stage.clientWidth * 0.6;
        let next = target;
        if (e.key === "ArrowRight" || e.key === "PageDown") next = target + step;
        else if (e.key === "ArrowLeft" || e.key === "PageUp") next = target - step;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = max;
        else return;
        e.preventDefault();
        dismissHint();
        target = Math.min(Math.max(next, 0), max);
        hasAdvanced = hasAdvanced || target > 0;
        warmThrough(target);
        kick();
      };

      // Recompute bounds once images have loaded (their widths set the track
      // size) and whenever the layout changes.
      const ro = new ResizeObserver(measure);
      ro.observe(track);
      ro.observe(stage);
      track.querySelectorAll("img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", measure, { once: true });
      });

      measure();
      // Retire the cue after a few seconds even if the visitor never scrolls.
      hintTimer = window.setTimeout(dismissHint, 6000);
      stage.addEventListener("wheel", onWheel, { passive: false });
      stage.addEventListener("touchstart", onTouchStart, { passive: true });
      stage.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("keydown", onKey);
      window.addEventListener("resize", measure);

      return () => {
        cancelAnimationFrame(raf);
        if (hintTimer) clearTimeout(hintTimer);
        if (urgentTimer) clearTimeout(urgentTimer);
        ro.disconnect();
        firstImage?.removeEventListener("load", warmInitialBuffer);
        firstImage?.removeEventListener("error", warmInitialBuffer);
        stage.removeEventListener("wheel", onWheel);
        stage.removeEventListener("touchstart", onTouchStart);
        stage.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", measure);
      };
    };

    const sync = () => {
      teardownResponsiveBehavior?.();
      teardownResponsiveBehavior = null;
      if (mql.matches) {
        teardownResponsiveBehavior = attachDesktopBehavior();
      } else {
        // Mobile: clear any leftover inline transform from the desktop mode
        // so the track lays out as a plain vertical flow (see .module.css).
        track.style.transform = "";
        if (progress) progress.style.transform = "";
        if (hint) hint.dataset.hidden = "true";
        Array.from(track.querySelectorAll<HTMLImageElement>("img")).forEach(
          (img, index) => {
            if (img.complete && img.naturalWidth > 0) markImageSettled(index);
          },
        );
        // Vertical scroll gives us reliable proximity. Keep URLs inert until
        // their frames approach, then let the adaptive queue preserve order.
        const observer = new IntersectionObserver(
          (entries) => {
            const nearby = entries
              .filter((entry) => entry.isIntersecting)
              .map((entry) => entry.target as HTMLImageElement);
            const visible = nearby.filter((image) => {
              const rect = image.getBoundingClientRect();
              return rect.bottom > 0 && rect.top < window.innerHeight;
            });
            const approaching = nearby.filter(
              (image) => !visible.includes(image),
            );
            if (visible.length) requestImages(visible, { urgent: true });
            if (approaching.length) requestImages(approaching);
            nearby.forEach((image) => observer.unobserve(image));
          },
          { rootMargin: "100% 0px" },
        );
        track
          .querySelectorAll<HTMLImageElement>("img[data-deferred-src]")
          .forEach((image) => observer.observe(image));
        teardownResponsiveBehavior = () => observer.disconnect();
      }
    };

    sync();
    mql.addEventListener("change", sync);

    return () => {
      mql.removeEventListener("change", sync);
      teardownResponsiveBehavior?.();
      document.removeEventListener("pointerover", onGalleryIntent);
      document.removeEventListener("focusin", onGalleryIntent);
      document.removeEventListener("touchstart", onGalleryIntent);
    };
  }, [firstSrc, images.length, markImageSettled]);

  return (
    <div
      className={styles.stage}
      key={firstSrc}
      ref={stageRef}
      aria-label="Photo gallery"
      data-gallery-stage
    >
      <div className={styles.track} ref={trackRef}>
        {images.map((image, i) => {
          // Desktop frames are height-driven (.frame height, see
          // FilmstripGallery.module.css) with the image at width:auto, so each
          // photo's *displayed* width is frameHeight × its aspect ratio.
          // Below 768px the gallery is a plain vertical stack instead (see
          // DECISIONS.md D18) — frames are width-driven (full column width),
          // so the sizes hint switches to a plain viewport-width fraction.
          const ratio = (image.width / image.height).toFixed(3);
          const sizes = `(max-width: 768px) calc(100vw - 2rem), calc(75.39vh * ${ratio})`;
          const fastPathSources = openingFastPath[i];
          const deferUntilAdvance = i > 0;
          const deferredProps = deferUntilAdvance
            ? getImageProps({
                src: image.src,
                width: image.width,
                height: image.height,
                alt: image.alt,
                sizes,
                loading: "lazy",
                fetchPriority: "low",
                decoding: "async",
                quality: 65,
              }).props
            : undefined;
          return (
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
                {/* The first photograph is one balanced static AVIF with a JPEG
                    fallback. Photos two through four stay inert until the
                    connection gate installs either a 640px-only source set or
                    the full responsive candidate set. Later photographs use
                    next/image-generated AVIF/WebP candidates.
                    CSS still drives layout (height-driven on desktop,
                    width-driven in the mobile vertical stack) and keeps the
                    true aspect ratio; the width/height props only reserve
                    space (no CLS). The desktop effect starts its low-priority
                    look-ahead only after the first photograph settles. */}
                {i === 0 && fastPathSources?.first ? (
                  <picture className={styles.picture}>
                    <source
                      srcSet={fastPathSources.formats.avif[0].src}
                      type="image/avif"
                    />
                    <img
                      className={styles.img}
                      src={fastPathSources.formats.jpeg[0].src}
                      width={image.width}
                      height={image.height}
                      alt={image.alt}
                      draggable={false}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      data-gallery-image
                      data-gallery-index={i}
                      data-sequence-ready="true"
                      onLoad={() => markImageSettled(i)}
                      onError={() => markImageSettled(i)}
                    />
                  </picture>
                ) : fastPathSources ? (
                  <picture className={styles.picture}>
                    <source
                      sizes={sizes}
                      data-deferred-srcset-slow={candidateSrcSet(
                        fastPathSources.formats.avif.slice(0, 1),
                      )}
                      data-deferred-srcset-fast={candidateSrcSet(
                        fastPathSources.formats.avif,
                      )}
                      type="image/avif"
                    />
                    <img
                      className={styles.img}
                      width={image.width}
                      height={image.height}
                      alt={image.alt}
                      draggable={false}
                      loading="lazy"
                      fetchPriority="low"
                      decoding="async"
                      sizes={sizes}
                      data-deferred-src={fastPathSources.formats.jpeg[0].src}
                      data-deferred-srcset-slow={candidateSrcSet(
                        fastPathSources.formats.jpeg.slice(0, 1),
                      )}
                      data-deferred-srcset-fast={candidateSrcSet(
                        fastPathSources.formats.jpeg,
                      )}
                      data-gallery-image
                      data-gallery-index={i}
                      data-sequence-ready="false"
                      style={{ aspectRatio: `${image.width} / ${image.height}` }}
                      onLoad={() => markImageSettled(i)}
                      onError={() => markImageSettled(i)}
                    />
                  </picture>
                ) : deferredProps ? (
                  // Keep later frames in the layout without a source URL. This
                  // prevents native lazy-loading heuristics from bypassing the
                  // three-photo initial cap. warmImage installs the optimized
                  // src/srcset only after the visitor advances the filmstrip.
                  // eslint-disable-next-line @next/next/no-img-element -- the source must be absent until the filmstrip unlocks it
                  <img
                    className={styles.img}
                    width={image.width}
                    height={image.height}
                    alt={image.alt}
                    sizes={deferredProps.sizes}
                    draggable={false}
                    loading="lazy"
                    fetchPriority="low"
                    decoding="async"
                    data-deferred-src={deferredProps.src}
                    data-deferred-srcset={deferredProps.srcSet}
                    data-gallery-image
                    data-gallery-index={i}
                    data-sequence-ready="false"
                    style={{ aspectRatio: `${image.width} / ${image.height}` }}
                    onLoad={() => markImageSettled(i)}
                    onError={() => markImageSettled(i)}
                  />
                ) : (
                  <Image
                    className={styles.img}
                    src={image.src}
                    width={image.width}
                    height={image.height}
                    alt={image.alt}
                    sizes={sizes}
                    draggable={false}
                    priority={i === 0}
                    loading={i === 0 ? undefined : "lazy"}
                    fetchPriority={i === 0 ? "high" : "low"}
                    decoding="async"
                    quality={65}
                    data-gallery-image
                    data-gallery-index={i}
                    data-sequence-ready={i === 0 ? "true" : "false"}
                    onLoad={() => markImageSettled(i)}
                    onError={() => markImageSettled(i)}
                  />
                )}
              </button>
            </figure>
          );
        })}
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressBar} ref={progressRef} />
      </div>
      {/* Discoverability cue for the horizontal scroll. Starts hidden; the effect
          reveals it only when the strip is scrollable and hides it on first move
          (see measure()/dismissHint above). aria-hidden — nav + keyboard already
          expose the same movement to assistive tech. */}
      <div
        className={styles.scrollHint}
        ref={hintRef}
        data-hidden="true"
        aria-hidden="true"
      >
        <span className={styles.scrollHintLabel}>Scroll</span>
        <span className={styles.scrollHintArrow}>&rarr;</span>
      </div>
      <button
        type="button"
        className={styles.backToTop}
        onClick={scrollToTop}
      >
        Back to top <span aria-hidden="true">&uarr;</span>
      </button>
    </div>
  );
}
