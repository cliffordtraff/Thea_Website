import type { ImageAsset } from "./types";

/**
 * Registry of the generated placeholder blocks (see scripts/gen-placeholders.mjs).
 * Keeps intrinsic dimensions in one place so content files reference assets by id
 * and never hard-code sizes. Replace these with real photos + true dims later.
 */
const DIMS: Record<string, { w: number; h: number; role: string }> = {
  "portrait-a": { w: 800, h: 1000, role: "portrait" },
  "portrait-b": { w: 800, h: 1000, role: "portrait" },
  "portrait-c": { w: 800, h: 1000, role: "portrait" },
  "portrait-d": { w: 800, h: 1000, role: "portrait" },
  "portrait-e": { w: 800, h: 1000, role: "portrait" },
  "portrait-f": { w: 800, h: 1000, role: "portrait" },
  "portrait-g": { w: 800, h: 1000, role: "portrait" },
  "portrait-h": { w: 800, h: 1000, role: "portrait" },
  "portrait-tall-a": { w: 800, h: 1200, role: "tall portrait" },
  "portrait-tall-b": { w: 800, h: 1200, role: "tall portrait" },
  "portrait-tall-c": { w: 800, h: 1200, role: "tall portrait" },
  "landscape-a": { w: 1200, h: 800, role: "landscape" },
  "landscape-b": { w: 1200, h: 800, role: "landscape" },
  "landscape-c": { w: 1200, h: 800, role: "landscape" },
  "wide-a": { w: 1600, h: 900, role: "wide landscape" },
  "wide-b": { w: 1600, h: 900, role: "wide landscape" },
  "square-a": { w: 1000, h: 1000, role: "square" },
  "square-b": { w: 1000, h: 1000, role: "square" },
  "elevator-a": { w: 900, h: 1200, role: "elevator" },
  "elevator-b": { w: 900, h: 1200, role: "elevator" },
  "elevator-c": { w: 900, h: 1200, role: "elevator" },
  "elevator-d": { w: 900, h: 1200, role: "elevator" },
};

/**
 * Build an ImageAsset for a placeholder id.
 * @param id   placeholder id (key of DIMS)
 * @param alt  optional override; defaults to a clearly-marked temporary alt.
 */
export function ph(id: keyof typeof DIMS | string, alt?: string): ImageAsset {
  const d = DIMS[id as string];
  if (!d) {
    throw new Error(`Unknown placeholder asset id: ${id}`);
  }
  return {
    // Grayscale placeholder photos from Lorem Picsum, downloaded locally so the
    // app has no runtime external dependency (see DECISIONS.md D3). NOT the
    // reference site's photographs. Flat SVG blocks remain in /public/placeholders
    // (via scripts/gen-placeholders.mjs) as an offline fallback.
    src: `/images/${id}.jpg`,
    width: d.w,
    height: d.h,
    // Temporary, clearly-marked alt — tracked in CONTENT_STATUS.md (D11).
    alt: alt ?? `[placeholder] ${d.role}`,
    placeholder: true,
  };
}
