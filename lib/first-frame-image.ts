export interface FirstFrameSources {
  avif: string;
  jpeg: string;
}

const FIRST_FRAME_IMAGES: Record<string, string> = {
  "/images/2026/inside/inside-01.jpg": "inside-01",
  "/images/2026/outside/outside-01.jpg": "outside-01",
  "/images/2026/dance/dance-01.jpg": "dance-01",
  "/images/2026/elevator/elevator-01.jpg": "elevator-01",
};

/** Return small, static sources for a gallery's first visible photograph. */
export function getFirstFrameSources(src: string): FirstFrameSources | undefined {
  const basename = FIRST_FRAME_IMAGES[src];
  if (!basename) return undefined;

  return {
    avif: `/images/first-frame/${basename}.avif`,
    jpeg: `/images/first-frame/${basename}.jpg`,
  };
}
