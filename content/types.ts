/* ============================================================
   Content model — Thea Traff Portfolio (POC)
   Portfolio data is fully separated from rendering (see PLAN.md §4).
   Components render these typed structures; they hold no hard-coded copy.
   ============================================================ */

/** A single image asset with its true intrinsic dimensions. */
export interface ImageAsset {
  /** Public path, e.g. "/placeholders/portrait-4x5-a.svg" */
  src: string;
  /** Intrinsic width in px (drives aspect ratio; never distorted). */
  width: number;
  /** Intrinsic height in px. */
  height: number;
  /** Alt text. Temporary placeholder alts are marked "[placeholder] ...". */
  alt: string;
  /** True when this is a neutral placeholder block, not a real photograph. */
  placeholder?: boolean;
}

/** Restrained editorial caption: subject line + optional publication/credit. */
export interface Caption {
  /** e.g. a subject or title. Rendered after a small "^" caret. */
  subject: string;
  /** Publication or client, rendered in bold small caps. */
  publication?: string;
  /** Freeform credit (e.g. "Art direction: ..."). */
  credit?: string;
  /** Optional year. */
  year?: string;
}

/** The editorial layout vocabulary (see PLAN.md §5 / DESIGN_SYSTEM.md). */
export type LayoutVariant =
  | "full-width"
  | "wide-landscape"
  | "medium-landscape"
  | "large-portrait"
  | "small-portrait"
  | "centered-portrait"
  | "offset-left"
  | "offset-right"
  | "image-pair"
  | "stacked-pair"
  | "triptych";

/** Single-image layout blocks. */
interface SingleImageBlock {
  variant: Exclude<
    LayoutVariant,
    "image-pair" | "stacked-pair" | "triptych"
  >;
  image: ImageAsset;
  caption?: Caption;
}

/** Two-image layout blocks (pair / stacked). */
interface PairBlock {
  variant: "image-pair" | "stacked-pair";
  images: [ImageAsset, ImageAsset];
  caption?: Caption;
}

/** Three-image layout block. */
interface TriptychBlock {
  variant: "triptych";
  images: [ImageAsset, ImageAsset, ImageAsset];
  caption?: Caption;
}

/** A layout block is a discriminated union keyed by `variant`. */
export type LayoutBlock = SingleImageBlock | PairBlock | TriptychBlock;

/** A project = an ordered sequence of layout blocks. */
export interface Project {
  title: string;
  slug: string;
  /** Optional client/publication for the project as a whole. */
  client?: string;
  blocks: LayoutBlock[];
}

/** A grid cell on the home page. */
export interface HomeCell {
  image: ImageAsset;
  /** Optional link target if a cell should navigate somewhere. */
  href?: string;
}

/** Navigation item. */
export interface NavItem {
  key: string;
  label: string;
  href: string;
  /** External links (e.g. Instagram) open in a new tab. */
  external?: boolean;
}
