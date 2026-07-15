/* ============================================================
   Placeholder generator — Thea Traff Portfolio (POC)

   Writes flat-tone, clearly-labeled SVG placeholder blocks to
   public/placeholders/. These stand in for real photographs, which are
   NEVER scraped from the reference site (see AGENTS.md / DECISIONS.md D3).

   Each placeholder:
     - has a realistic photographic aspect ratio (intrinsic w/h),
     - is a single flat tone (no gradients, borders, or shadows),
     - carries a small centered label: role + aspect ratio.

   Run: npm run gen:placeholders
   ============================================================ */

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "placeholders");

/**
 * Restrained tone set — dark neutral grays that read as a B&W editorial field.
 * Kept deliberately narrow so the grid stays quiet, not colorful.
 */
const TONES = ["#3a3a3a", "#333333", "#424242", "#2e2e2e", "#3f3d3b", "#454341"];

/**
 * The placeholder set. `id` -> filename; intrinsic dims give the true ratio.
 * Ratios mirror what the reference uses (mostly ~4:5 portraits, some landscape
 * and square), so layouts exercise real aspect-ratio handling.
 */
const SPECS = [
  // Portraits (4:5)
  { id: "portrait-a", w: 800, h: 1000, role: "portrait" },
  { id: "portrait-b", w: 800, h: 1000, role: "portrait" },
  { id: "portrait-c", w: 800, h: 1000, role: "portrait" },
  { id: "portrait-d", w: 800, h: 1000, role: "portrait" },
  { id: "portrait-e", w: 800, h: 1000, role: "portrait" },
  { id: "portrait-f", w: 800, h: 1000, role: "portrait" },
  { id: "portrait-g", w: 800, h: 1000, role: "portrait" },
  { id: "portrait-h", w: 800, h: 1000, role: "portrait" },
  // Tall portraits (2:3)
  { id: "portrait-tall-a", w: 800, h: 1200, role: "tall portrait" },
  { id: "portrait-tall-b", w: 800, h: 1200, role: "tall portrait" },
  { id: "portrait-tall-c", w: 800, h: 1200, role: "tall portrait" },
  // Landscapes (3:2)
  { id: "landscape-a", w: 1200, h: 800, role: "landscape" },
  { id: "landscape-b", w: 1200, h: 800, role: "landscape" },
  { id: "landscape-c", w: 1200, h: 800, role: "landscape" },
  // Wide landscape (16:9)
  { id: "wide-a", w: 1600, h: 900, role: "wide landscape" },
  { id: "wide-b", w: 1600, h: 900, role: "wide landscape" },
  // Square (1:1)
  { id: "square-a", w: 1000, h: 1000, role: "square" },
  { id: "square-b", w: 1000, h: 1000, role: "square" },
  // Elevator series — verticals shot on phone (~3:4)
  { id: "elevator-a", w: 900, h: 1200, role: "elevator" },
  { id: "elevator-b", w: 900, h: 1200, role: "elevator" },
  { id: "elevator-c", w: 900, h: 1200, role: "elevator" },
  { id: "elevator-d", w: 900, h: 1200, role: "elevator" },
];

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}
function ratioLabel(w, h) {
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

function svg({ w, h, role, tone }) {
  const ratio = ratioLabel(w, h);
  // Label size scales gently with the smaller dimension.
  const labelSize = Math.round(Math.min(w, h) * 0.045);
  const subSize = Math.round(labelSize * 0.62);
  const cx = w / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Placeholder ${role} ${ratio}">
  <rect width="${w}" height="${h}" fill="${tone}"/>
  <text x="${cx}" y="${h / 2 - labelSize * 0.2}" fill="#8f8f8f" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="${labelSize}" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">PLACEHOLDER</text>
  <text x="${cx}" y="${h / 2 + labelSize * 1.1}" fill="#6f6f6f" font-family="Georgia, 'Times New Roman', serif" font-size="${subSize}" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">${role} · ${ratio}</text>
</svg>
`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let i = 0;
  for (const spec of SPECS) {
    const tone = TONES[i % TONES.length];
    const content = svg({ ...spec, tone });
    await writeFile(join(OUT, `${spec.id}.svg`), content, "utf8");
    i++;
  }
  console.log(`Wrote ${SPECS.length} placeholder SVGs to public/placeholders/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
