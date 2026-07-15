import type { LayoutBlock } from "@/content/types";
import { FullWidth } from "./layouts/FullWidth";
import { WideLandscape } from "./layouts/WideLandscape";
import { MediumLandscape } from "./layouts/MediumLandscape";
import { LargePortrait } from "./layouts/LargePortrait";
import { SmallPortrait } from "./layouts/SmallPortrait";
import { CenteredPortrait } from "./layouts/CenteredPortrait";
import { OffsetLeft } from "./layouts/OffsetLeft";
import { OffsetRight } from "./layouts/OffsetRight";
import { ImagePair } from "./layouts/ImagePair";
import { StackedPair } from "./layouts/StackedPair";
import { Triptych } from "./layouts/Triptych";
import styles from "./ProjectSequence.module.css";

/**
 * Renders an ordered list of layout blocks into the matching editorial
 * primitives, with deliberate vertical rhythm between them. This is the only
 * place that maps `variant` -> component; pages stay declarative (data in,
 * composition out). The first block is prioritized for above-the-fold loading.
 */
function renderBlock(block: LayoutBlock, priority: boolean) {
  switch (block.variant) {
    case "full-width":
      return (
        <FullWidth image={block.image} caption={block.caption} priority={priority} />
      );
    case "wide-landscape":
      return (
        <WideLandscape image={block.image} caption={block.caption} priority={priority} />
      );
    case "medium-landscape":
      return (
        <MediumLandscape image={block.image} caption={block.caption} priority={priority} />
      );
    case "large-portrait":
      return (
        <LargePortrait image={block.image} caption={block.caption} priority={priority} />
      );
    case "small-portrait":
      return (
        <SmallPortrait image={block.image} caption={block.caption} priority={priority} />
      );
    case "centered-portrait":
      return (
        <CenteredPortrait image={block.image} caption={block.caption} priority={priority} />
      );
    case "offset-left":
      return (
        <OffsetLeft image={block.image} caption={block.caption} priority={priority} />
      );
    case "offset-right":
      return (
        <OffsetRight image={block.image} caption={block.caption} priority={priority} />
      );
    case "image-pair":
      return (
        <ImagePair images={block.images} caption={block.caption} priority={priority} />
      );
    case "stacked-pair":
      return (
        <StackedPair images={block.images} caption={block.caption} priority={priority} />
      );
    case "triptych":
      return (
        <Triptych images={block.images} caption={block.caption} priority={priority} />
      );
    default: {
      // Exhaustiveness guard — a new variant must be handled above.
      const _never: never = block;
      return _never;
    }
  }
}

export function ProjectSequence({ blocks }: { blocks: LayoutBlock[] }) {
  return (
    <div className={styles.sequence}>
      {blocks.map((block, i) => (
        <div key={i} className={styles.block}>
          {renderBlock(block, i === 0)}
        </div>
      ))}
    </div>
  );
}
