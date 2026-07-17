import type { Metadata } from "next";
import { FilmstripView } from "@/components/FilmstripView";
import { dance } from "@/content/dance";
import { blockImages } from "@/content/blocks";

export const metadata: Metadata = { title: dance.title };

export default function VideoPage() {
  return (
    <FilmstripView
      images={blockImages(dance.blocks)}
      active="video"
      title={dance.title}
    />
  );
}
