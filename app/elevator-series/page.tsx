import type { Metadata } from "next";
import { SiteFrame } from "@/components/SiteFrame";
import { ProjectSequence } from "@/components/ProjectSequence";
import { elevator } from "@/content/elevator";

export const metadata: Metadata = { title: elevator.title };

export default function ElevatorSeriesPage() {
  return (
    <SiteFrame active="elevator-series">
      <h2 className="sr-only">{elevator.title}</h2>
      <ProjectSequence blocks={elevator.blocks} />
    </SiteFrame>
  );
}
