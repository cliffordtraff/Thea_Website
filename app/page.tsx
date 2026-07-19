import { HomeHero } from "@/components/HomeHero";
import { homeCells } from "@/content/home";

/** Home — single full-viewport hero photograph. */
export default function HomePage() {
  return <HomeHero image={homeCells[0].image} />;
}
