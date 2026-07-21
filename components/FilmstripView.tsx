import type { ImageAsset } from "@/content/types";
import { GalleryLightbox } from "./GalleryLightbox";
import { FilmstripGallery } from "./FilmstripGallery";
import { Nav } from "./Nav";
import styles from "./FilmstripView.module.css";

/**
 * The site's standard gallery presentation: a full-screen, scroll-driven
 * horizontal filmstrip with the primary Nav overlaid top-left and click-to-focus
 * enlargement (GalleryLightbox). Used by the home index and every photo section,
 * so all photo tabs share the same horizontal-scroll experience.
 *
 * `active` marks the current nav item (omit on the home index). `title` supplies
 * a visually-hidden page heading for accessibility/SEO.
 */
export function FilmstripView({
  images,
  active,
  title,
}: {
  images: ImageAsset[];
  active?: string;
  title?: string;
}) {
  return (
    <GalleryLightbox>
      {title ? <h1 className="sr-only">{title}</h1> : null}
      {/* Rendered before the gallery in source order: irrelevant on desktop
          (fixed positioning ignores document flow), but on mobile — where
          the nav drops out of `position: fixed` into normal flow (see
          FilmstripView.module.css) — this is what puts it above the first
          photo instead of below it. */}
      <div className={styles.navOverlay}>
        <Nav
          variant="sidebar"
          titleAs={active ? "link" : "h1"}
          active={active}
        />
      </div>
      <FilmstripGallery images={images} />
    </GalleryLightbox>
  );
}
