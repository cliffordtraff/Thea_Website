import { Figure } from "../Figure";
import type { ImageAsset, Caption } from "@/content/types";
import styles from "./layouts.module.css";

/** Small portrait surrounded by generous negative space. */
export function SmallPortrait({
  image,
  caption,
  priority,
}: {
  image: ImageAsset;
  caption?: Caption;
  priority?: boolean;
}) {
  return (
    <div className={styles.smallPortrait}>
      <Figure
        image={image}
        caption={caption}
        priority={priority}
        sizes="(max-width: 768px) 55vw, 20vw"
      />
    </div>
  );
}
