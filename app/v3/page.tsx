import type { ImageAsset } from "@/content/types";
import { homeCells } from "@/content/home";
import { personal } from "@/content/personal";
import { V3Gallery } from "./V3Gallery";

/*
 * TEST redesign (concept three). Read-only reuse of production content to
 * assemble full-bleed cinematic slides. Fewer images than the reel concepts,
 * since each fills the whole viewport. De-duplicated by src.
 */
function buildImages(): ImageAsset[] {
  const fromHome = homeCells.map((c) => c.image);
  const fromPersonal = personal.blocks
    .map((b) => ("image" in b ? (b.image as ImageAsset) : null))
    .filter((x): x is ImageAsset => Boolean(x));

  const seen = new Set<string>();
  const all: ImageAsset[] = [];
  for (const img of [...fromHome, ...fromPersonal]) {
    if (seen.has(img.src)) continue;
    seen.add(img.src);
    all.push(img);
  }
  return all.slice(0, 10);
}

const NAV = [
  { label: "Inside", href: "/commissions" },
  { label: "Outside", href: "/personal" },
  { label: "Dance", href: "/video" },
  { label: "Elevator Series", href: "/elevator-series" },
  { label: "Info + Contact", href: "/info" },
  { label: "Instagram", href: "https://www.instagram.com/theatraff", external: true },
];

export default function V3Page() {
  return <V3Gallery images={buildImages()} nav={NAV} />;
}
