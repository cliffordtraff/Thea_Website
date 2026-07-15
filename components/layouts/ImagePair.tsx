import { Figure } from "../Figure";
import { Caption } from "../Caption";
import type { ImageAsset, Caption as CaptionData } from "@/content/types";
import styles from "./layouts.module.css";

/**
 * Two images side by side with a slight width asymmetry so the pair never reads
 * as a uniform grid. An optional caption applies to the pair as a whole.
 */
export function ImagePair({
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
      <div className={styles.pair}>
        <Figure
          image={images[0]}
          priority={priority}
          className={styles.pairA}
          sizes="(max-width: 768px) 88vw, 32vw"
        />
        <Figure
          image={images[1]}
          priority={priority}
          className={styles.pairB}
          sizes="(max-width: 768px) 88vw, 38vw"
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
