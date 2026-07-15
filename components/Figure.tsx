import Image from "next/image";
import type { ImageAsset, Caption as CaptionData } from "@/content/types";
import { Caption } from "./Caption";
import styles from "./Figure.module.css";

/**
 * Base image primitive. Wraps next/image in a semantic <figure> and preserves
 * the asset's true aspect ratio (never object-fit: cover — see AGENTS.md).
 *
 * The image renders at 100% of the width its layout wrapper allots; height is
 * derived from the intrinsic ratio, so there is no layout shift.
 */
export function Figure({
  image,
  caption,
  sizes = "(max-width: 768px) 90vw, 40vw",
  priority = false,
  className,
}: {
  image: ImageAsset;
  caption?: CaptionData;
  /** Responsive sizes hint for next/image. */
  sizes?: string;
  /** Prioritize genuinely above-the-fold images only. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={[styles.figure, className].filter(Boolean).join(" ")}>
      <Image
        src={image.src}
        width={image.width}
        height={image.height}
        alt={image.alt}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={styles.img}
      />
      {caption ? <Caption caption={caption} /> : null}
    </figure>
  );
}
