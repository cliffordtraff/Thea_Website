import Image from "next/image";
import type { ImageAsset } from "@/content/types";
import { Nav } from "./Nav";
import styles from "./HomeHero.module.css";

/**
 * Landing hero: one photograph filling the entire viewport, with the primary
 * Nav overlaid top-left (same auto-inverting treatment as the filmstrip). Unlike
 * the gallery filmstrip — built for many images — the landing shows a single
 * full-bleed frame, so it gets its own component rather than a one-item strip.
 */
export function HomeHero({ image }: { image: ImageAsset }) {
  return (
    <section className={styles.hero} aria-label="Thea Traff — photography">
      <Image
        className={styles.img}
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="100vw"
      />
      <div className={styles.navOverlay}>
        <Nav variant="sidebar" titleAs="h1" />
      </div>
    </section>
  );
}
