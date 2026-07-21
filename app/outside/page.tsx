import type { Metadata } from "next";
import { FilmstripView } from "@/components/FilmstripView";
import { personal } from "@/content/personal";
import { blockImages } from "@/content/blocks";

export const metadata: Metadata = { title: personal.title };

export default function OutsidePage() {
  return (
    <FilmstripView
      images={blockImages(personal.blocks)}
      active="outside"
      title={personal.title}
    />
  );
}
