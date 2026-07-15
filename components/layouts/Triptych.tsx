import { Figure } from "../Figure";
import { Caption } from "../Caption";
import type { ImageAsset, Caption as CaptionData } from "@/content/types";
import styles from "./layouts.module.css";

/** Three images in a row. Optional caption applies to the group. */
export function Triptych({
  images,
  caption,
  priority,
}: {
  images: [ImageAsset, ImageAsset, ImageAsset];
  caption?: CaptionData;
  priority?: boolean;
}) {
  return (
    <div>
      <div className={styles.triptych}>
        {images.map((img, i) => (
          <Figure
            key={i}
            image={img}
            priority={priority}
            sizes="(max-width: 768px) 78vw, 22vw"
          />
        ))}
      </div>
      {caption ? (
        <figure style={{ margin: 0 }}>
          <Caption caption={caption} />
        </figure>
      ) : null}
    </div>
  );
}
