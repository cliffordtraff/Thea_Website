import type { Metadata } from "next";
import { FilmstripView } from "@/components/FilmstripView";
import { personal } from "@/content/personal";
import { blockImages } from "@/content/blocks";

export const metadata: Metadata = { title: personal.title };

export default function PersonalPage() {
  return (
    <FilmstripView
      images={blockImages(personal.blocks)}
      active="personal"
      title={personal.title}
    />
  );
}
