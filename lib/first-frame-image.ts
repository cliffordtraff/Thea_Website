import galleryFastPathManifest from "@/generated/gallery-fast-path-manifest.json";

export interface GalleryImageCandidate {
  src: string;
  width: number;
  bytes: number;
}

export interface GalleryFastPathSources {
  first: boolean;
  formats: {
    avif: GalleryImageCandidate[];
    jpeg: GalleryImageCandidate[];
  };
}

interface GalleryFastPathManifestEntry extends GalleryFastPathSources {
  sourceHash: string;
  sourceWidth: number;
  sourceHeight: number;
}

export interface FirstFrameSources {
  avif: string;
  jpeg: string;
  width: number;
}

const GALLERY_FAST_PATH_IMAGES = galleryFastPathManifest as Record<
  string,
  GalleryFastPathManifestEntry
>;

/** Return static responsive sources for one of a gallery's opening frames. */
export function getGalleryFastPathSources(
  src: string,
): GalleryFastPathSources | undefined {
  const entry = GALLERY_FAST_PATH_IMAGES[src];
  return entry ? { first: entry.first, formats: entry.formats } : undefined;
}

/** Return the single balanced source used for a gallery's first photograph. */
export function getFirstFrameSources(src: string): FirstFrameSources | undefined {
  const entry = GALLERY_FAST_PATH_IMAGES[src];
  const avif = entry?.formats.avif[0];
  const jpeg = entry?.formats.jpeg[0];
  return avif && jpeg ? { avif: avif.src, jpeg: jpeg.src, width: avif.width } : undefined;
}

const FIRST_FRAME_BY_ROUTE: Record<string, string> = {
  "/": "/images/2026/inside/inside-01.jpg",
  "/commissions": "/images/2026/inside/inside-01.jpg",
  "/outside": "/images/2026/outside/outside-01.jpg",
  "/dance": "/images/2026/dance/dance-01.jpg",
  "/elevator-series": "/images/2026/elevator/elevator-01.jpg",
};

/** Small immutable AVIF to fetch when a visitor signals gallery-navigation intent. */
export function getGalleryFirstFrameForRoute(href: string): string | undefined {
  const source = FIRST_FRAME_BY_ROUTE[href];
  return source ? getFirstFrameSources(source)?.avif : undefined;
}
