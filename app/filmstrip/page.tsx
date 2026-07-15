import type { Metadata } from "next";
import { FilmstripGallery } from "@/components/FilmstripGallery";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { Nav } from "@/components/Nav";
import { ph } from "@/content/assets";
import styles from "./filmstrip.module.css";

export const metadata: Metadata = {
  title: "Filmstrip",
  description: "Scroll-driven horizontal gallery (experimental).",
};

/**
 * Experimental full-screen horizontal gallery — a testbed for the scroll-driven
 * filmstrip motion. Visit /filmstrip. A deliberate, mixed-orientation ordering
 * of the placeholder photographs gives the strip visual rhythm.
 *
 * The whole page is wrapped in GalleryLightbox so clicking any frame opens the
 * same fullscreen "focus" enlargement used elsewhere on the site, and the shared
 * Nav is overlaid top-left.
 */
const strip = [
  ph("portrait-a"),
  ph("landscape-a"),
  ph("portrait-b"),
  ph("portrait-c"),
  ph("portrait-g"),
  ph("landscape-b"),
  ph("portrait-d"),
  ph("portrait-f"),
  ph("portrait-e"),
];

export default function FilmstripPage() {
  return (
    <GalleryLightbox>
      <FilmstripGallery images={strip} />
      <div className={styles.navOverlay}>
        <Nav variant="sidebar" titleAs="h1" />
      </div>
    </GalleryLightbox>
  );
}
