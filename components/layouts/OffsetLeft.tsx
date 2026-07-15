import { Figure } from "../Figure";
import type { ImageAsset, Caption } from "@/content/types";
import styles from "./layouts.module.css";

/** Image pushed toward the left margin, empty space to the right. */
export function OffsetLeft({
  image,
  caption,
  priority,
}: {
  image: ImageAsset;
  caption?: Caption;
  priority?: boolean;
}) {
  return (
    <div className={styles.offsetLeft}>
      <Figure
        image={image}
        caption={caption}
        priority={priority}
        sizes="(max-width: 768px) 88vw, 38vw"
      />
    </div>
  );
}
