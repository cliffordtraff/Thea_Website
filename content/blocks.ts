import type { LayoutBlock, ImageAsset } from "./types";

/**
 * Flatten an ordered list of editorial layout blocks into a plain, ordered list
 * of image assets — used by the horizontal filmstrip, which presents every
 * photograph in one continuous row (pairs and triptychs expand in place).
 */
export function blockImages(blocks: LayoutBlock[]): ImageAsset[] {
  return blocks.flatMap((b) => ("images" in b ? [...b.images] : [b.image]));
}
