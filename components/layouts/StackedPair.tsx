import { Figure } from "../Figure";
import { Caption } from "../Caption";
import type { ImageAsset, Caption as CaptionData } from "@/content/types";
import styles from "./layouts.module.css";

/**
 * Two images stacked vertically, the second offset to the right for an
 * asymmetric editorial rhythm. Optional caption applies to the pair.
 */
export function StackedPair({
  images,
  caption,
  priority,
}: {
  images: [ImageAsset, ImageAsset];
  caption?: CaptionData;
  priority?: boolean;
}) {
  return (
    <div>
      <div className={styles.stacked}>
        <Figure
          image={images[0]}
          priority={priority}
          className={styles.stackedA}
          sizes="(max-width: 768px) 88vw, 42vw"
        />
        <Figure
          image={images[1]}
          className={styles.stackedB}
          sizes="(max-width: 768px) 88vw, 42vw"
        />
      </div>
      {caption ? (
        <figure style={{ margin: 0 }}>
          <Caption caption={caption} />
        </figure>
      ) : null}
    </div>
  );
}
