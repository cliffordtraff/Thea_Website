import type { Metadata } from "next";
import { FilmstripView } from "@/components/FilmstripView";
import { commissions } from "@/content/commissions";
import { blockImages } from "@/content/blocks";

export const metadata: Metadata = { title: commissions.title };

export default function CommissionsPage() {
  return (
    <FilmstripView
      images={blockImages(commissions.blocks)}
      active="commissions"
      title={commissions.title}
    />
  );
}
