import type { Metadata } from "next";
import { FilmstripView } from "@/components/FilmstripView";
import { elevator } from "@/content/elevator";
import { blockImages } from "@/content/blocks";

export const metadata: Metadata = { title: elevator.title };

export default function ElevatorSeriesPage() {
  return (
    <FilmstripView
      images={blockImages(elevator.blocks)}
      active="elevator-series"
      title={elevator.title}
    />
  );
}
