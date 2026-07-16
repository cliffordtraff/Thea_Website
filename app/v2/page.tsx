import type { ImageAsset } from "@/content/types";
import { homeCells } from "@/content/home";
import { personal } from "@/content/personal";
import { V2Gallery } from "./V2Gallery";

/*
 * TEST redesign home. Read-only reuse of the production content modules to
 * assemble a curated horizontal reel of real photographs — no content files
 * are modified. De-duplicated by src so the two sources don't overlap.
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
  return all.slice(0, 16);
}

const NAV = [
  { label: "Inside", href: "/commissions" },
  { label: "Outside", href: "/personal" },
  { label: "Dance", href: "/video" },
  { label: "Elevator Series", href: "/elevator-series" },
  { label: "Info + Contact", href: "/info" },
  { label: "Instagram", href: "https://www.instagram.com/theatraff", external: true },
];

export default function V2Page() {
  return <V2Gallery images={buildImages()} nav={NAV} />;
}
