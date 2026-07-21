import type { Metadata } from "next";
import { FilmstripView } from "@/components/FilmstripView";
import { dance } from "@/content/dance";
import { blockImages } from "@/content/blocks";

export const metadata: Metadata = { title: dance.title };

export default function DancePage() {
  return (
    <FilmstripView
      images={blockImages(dance.blocks)}
      active="dance"
      title={dance.title}
    />
  );
}
