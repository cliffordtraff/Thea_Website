import type { Metadata } from "next";
import { SiteFrame } from "@/components/SiteFrame";
import { ProjectSequence } from "@/components/ProjectSequence";
import { personal } from "@/content/personal";

export const metadata: Metadata = { title: personal.title };

export default function PersonalPage() {
  return (
    <SiteFrame active="personal">
      <h2 className="sr-only">{personal.title}</h2>
      <ProjectSequence blocks={personal.blocks} />
    </SiteFrame>
  );
}
