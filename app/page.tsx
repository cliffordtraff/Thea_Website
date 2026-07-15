import { FilmstripView } from "@/components/FilmstripView";
import { homeCells } from "@/content/home";

/** Home — scroll-driven horizontal filmstrip index. */
export default function HomePage() {
  return <FilmstripView images={homeCells.map((c) => c.image)} />;
}
