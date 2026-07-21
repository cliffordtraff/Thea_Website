import { FilmstripView } from "@/components/FilmstripView";
import { commissions } from "@/content/commissions";
import { blockImages } from "@/content/blocks";

/** Home — the "Inside" (Recent Commissions) filmstrip is the landing page. */
export default function HomePage() {
  return (
    <FilmstripView
      images={blockImages(commissions.blocks)}
      active="commissions"
      title={commissions.title}
    />
  );
}
