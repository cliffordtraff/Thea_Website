import type { Metadata } from "next";
import { SiteFrame } from "@/components/SiteFrame";
import { ProjectSequence } from "@/components/ProjectSequence";
import { commissions } from "@/content/commissions";

export const metadata: Metadata = { title: commissions.title };

export default function CommissionsPage() {
  return (
    <SiteFrame active="commissions">
      <h2 className="sr-only">{commissions.title}</h2>
      <ProjectSequence blocks={commissions.blocks} />
    </SiteFrame>
  );
}
