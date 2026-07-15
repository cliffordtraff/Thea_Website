import type { ImageAsset } from "./types";

/**
 * Registry of the generated placeholder blocks (see scripts/gen-placeholders.mjs).
 * Keeps intrinsic dimensions in one place so content files reference assets by id
 * and never hard-code sizes. Replace these with real photos + true dims later.
 */
const DIMS: Record<string, { w: number; h: number; role: string }> = {
  "portrait-a": { w: 622, h: 884, role: "portrait" },
  "portrait-b": { w: 640, h: 904, role: "portrait" },
  "portrait-c": { w: 680, h: 946, role: "portrait" },
  "portrait-d": { w: 660, h: 934, role: "portrait" },
  "portrait-e": { w: 658, h: 930, role: "portrait" },
  "portrait-f": { w: 666, h: 926, role: "portrait" },
  "portrait-g": { w: 714, h: 902, role: "portrait" },
  "portrait-h": { w: 660, h: 934, role: "portrait" },
  "portrait-tall-a": { w: 680, h: 946, role: "tall portrait" },
  "portrait-tall-b": { w: 660, h: 934, role: "tall portrait" },
  "portrait-tall-c": { w: 714, h: 902, role: "tall portrait" },
  "landscape-a": { w: 1048, h: 832, role: "landscape" },
  "landscape-b": { w: 1420, h: 934, role: "landscape" },
  "landscape-c": { w: 1048, h: 832, role: "landscape" },
  "wide-a": { w: 1420, h: 934, role: "wide landscape" },
  "wide-b": { w: 1048, h: 832, role: "wide landscape" },
  "square-a": { w: 1048, h: 832, role: "square" },
  "square-b": { w: 1420, h: 934, role: "square" },
  "elevator-a": { w: 658, h: 930, role: "elevator" },
  "elevator-b": { w: 666, h: 926, role: "elevator" },
  "elevator-c": { w: 640, h: 904, role: "elevator" },
  "elevator-d": { w: 622, h: 884, role: "elevator" },
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
