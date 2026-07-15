import { Figure } from "../Figure";
import type { ImageAsset, Caption } from "@/content/types";
import styles from "./layouts.module.css";

/** Single portrait centered in the content column. */
export function CenteredPortrait({
  image,
  caption,
  priority,
}: {
  image: ImageAsset;
  caption?: Caption;
  priority?: boolean;
}) {
  return (
    <div className={styles.centeredPortrait}>
      <Figure
        image={image}
        caption={caption}
        priority={priority}
        sizes="(max-width: 768px) 82vw, 30vw"
      />
    </div>
  );
}
