import { Figure } from "../Figure";
import type { ImageAsset, Caption } from "@/content/types";
import styles from "./layouts.module.css";

/** Mid-scale landscape. */
export function MediumLandscape({
  image,
  caption,
  priority,
}: {
  image: ImageAsset;
  caption?: Caption;
  priority?: boolean;
}) {
  return (
    <div className={styles.mediumLandscape}>
      <Figure
        image={image}
        caption={caption}
        priority={priority}
        sizes="(max-width: 768px) 82vw, 40vw"
      />
    </div>
  );
}
