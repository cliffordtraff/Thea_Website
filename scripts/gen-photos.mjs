/**
 * gen-photos.mjs — one-off importer for the real theatraff.com photo archive.
 *
 * Reads the crawled archive (../Photos Downloaded from Website), copies each
 * photograph into public/images/archive/ under a URL-safe slug, reads its true
 * pixel dimensions with `sips`, and regenerates the section content files so the
 * galleries render the real photographs instead of placeholders.
 *
 * Run from the Thea_Website project root:  node scripts/gen-photos.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const ARCHIVE_SRC = path.resolve(
  PROJECT_ROOT,
  "..",
  "Photos Downloaded from Website"
);
const IMAGES_SRC = path.join(ARCHIVE_SRC, "images");
const MANIFEST = path.join(ARCHIVE_SRC, "manifest.csv");
const OUT_DIR = path.join(PROJECT_ROOT, "public", "images", "archive");
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");

// Web-copy ceiling: long edge in px + JPEG quality for the resized masters.
const MAX_EDGE = 2560;
const JPEG_QUALITY = 80;

// ── Section mapping ────────────────────────────────────────────────────────
// A photo can appear on several crawled pages. Gallery ownership is assigned
// once, most-specific-first. Home and Info deliberately reuse gallery photos.
const GALLERY_PRIORITY = [
  { key: "elevator", match: /Elevator-Series/ },
  { key: "commissions", match: /Recent-Commissions-1/ },
  { key: "personal", match: /Overview/ },
];

function slugify(filename) {
  const base = filename.replace(/\.[^.]+$/, "");
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dims(absPath) {
  const out = execFileSync("sips", [
    "-g",
    "pixelWidth",
    "-g",
    "pixelHeight",
    absPath,
  ]).toString();
  const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!w || !h) throw new Error(`No dimensions for ${absPath}`);
  return { w, h };
}

// ── Parse manifest ─────────────────────────────────────────────────────────
const rows = fs
  .readFileSync(MANIFEST, "utf8")
  .split("\n")
  .slice(1)
  .filter(Boolean)
  .map((line) => {
    const cols = line.split(",");
    return { filename: cols[0], pages: cols[cols.length - 1] };
  })
  // Skip UI chrome (arrow svg, etc.) — real photographs only.
  .filter((r) => /\.(jpe?g|png)$/i.test(r.filename));

fs.mkdirSync(OUT_DIR, { recursive: true });

const seenSlugs = new Set();
const gallery = { commissions: [], personal: [], elevator: [] };
const home = [];
let infoPortrait = null;

for (const row of rows) {
  const srcAbs = path.join(IMAGES_SRC, row.filename);
  if (!fs.existsSync(srcAbs)) {
    console.warn(`MISSING on disk, skipping: ${row.filename}`);
    continue;
  }

  let slug = slugify(row.filename);
  while (seenSlugs.has(slug)) slug = `${slug}-2`;
  seenSlugs.add(slug);

  const outName = `${slug}.jpg`;
  const outAbs = path.join(OUT_DIR, outName);
  fs.copyFileSync(srcAbs, outAbs);

  // Cap the web copy's long edge. Originals run up to 4480×6720 / ~15 MB each;
  // next/image never serves anything larger than a Retina viewport, so a 2560px
  // master is the practical ceiling. Resize in place (the true original stays
  // untouched in ARCHIVE_SRC). Aspect ratio is preserved by sips.
  const orig = dims(srcAbs);
  if (Math.max(orig.w, orig.h) > MAX_EDGE) {
    execFileSync("sips", [
      "-Z",
      String(MAX_EDGE),
      "-s",
      "formatOptions",
      String(JPEG_QUALITY),
      outAbs,
    ]);
  }
  // Record the *output* dimensions so next/image gets true intrinsic sizes.
  const { w, h } = dims(outAbs);

  const asset = {
    src: `/images/archive/${outName}`,
    width: w,
    height: h,
    alt: "Photograph by Thea Traff",
  };

  // Gallery ownership (single) ...
  const owner = GALLERY_PRIORITY.find((g) => g.match.test(row.pages));
  if (owner) gallery[owner.key].push(asset);

  // ... home + info reuse.
  if (/Home-Page/.test(row.pages)) home.push(asset);
  // The Info page uses the leaning-portrait (…websize), not the TIME headshot.
  if (/Info-Contact/.test(row.pages) && /69A5364/i.test(row.filename)) {
    infoPortrait = { ...asset, alt: "Thea Traff" };
  }
}

// ── Emit content ───────────────────────────────────────────────────────────
// Pages render a flat filmstrip (blockImages flattens blocks → images), so each
// photo becomes one single-image block. Variant is chosen by orientation to
// keep the content semantically correct for any non-filmstrip view.
function variantFor({ width, height }) {
  const r = width / height;
  if (r >= 1.15) return "wide-landscape";
  if (r <= 0.87) return "centered-portrait";
  return "medium-landscape";
}

const asStr = (v) => JSON.stringify(v);

function blocksLiteral(assets) {
  return assets
    .map(
      (a) =>
        `    {\n` +
        `      variant: ${asStr(variantFor(a))},\n` +
        `      image: {\n` +
        `        src: ${asStr(a.src)},\n` +
        `        width: ${a.width},\n` +
        `        height: ${a.height},\n` +
        `        alt: ${asStr(a.alt)},\n` +
        `      },\n` +
        `    },`
    )
    .join("\n");
}

function projectFile({ varName, title, slug, note, assets }) {
  return (
    `import type { Project } from "./types";\n\n` +
    `/*\n * ${note}\n *\n` +
    ` * GENERATED by scripts/gen-photos.mjs from the theatraff.com archive.\n` +
    ` * ${assets.length} photographs. Re-run the script to regenerate.\n */\n` +
    `export const ${varName}: Project = {\n` +
    `  title: ${asStr(title)},\n` +
    `  slug: ${asStr(slug)},\n` +
    `  blocks: [\n${blocksLiteral(assets)}\n  ],\n};\n`
  );
}

fs.writeFileSync(
  path.join(CONTENT_DIR, "commissions.ts"),
  projectFile({
    varName: "commissions",
    title: "Recent Commissions",
    slug: "commissions",
    note: "Recent Commissions — real photographs from theatraff.com.",
    assets: gallery.commissions,
  })
);

fs.writeFileSync(
  path.join(CONTENT_DIR, "personal.ts"),
  projectFile({
    varName: "personal",
    title: "Personal Work",
    slug: "personal",
    note: "Personal Work (Overview) — real photographs from theatraff.com.",
    assets: gallery.personal,
  })
);

fs.writeFileSync(
  path.join(CONTENT_DIR, "elevator.ts"),
  projectFile({
    varName: "elevator",
    title: "Elevator Series",
    slug: "elevator-series",
    note: "Elevator Series — real photographs from theatraff.com.",
    assets: gallery.elevator,
  })
);

// Home grid — ordered HomeCell[] of real photographs.
const homeFile =
  `import type { HomeCell } from "./types";\n\n` +
  `/**\n * Home grid — real photographs from the theatraff.com home page.\n` +
  ` * GENERATED by scripts/gen-photos.mjs.\n */\n` +
  `export const homeCells: HomeCell[] = [\n` +
  home
    .map(
      (a) =>
        `  {\n    image: {\n      src: ${asStr(a.src)},\n` +
        `      width: ${a.width},\n      height: ${a.height},\n` +
        `      alt: ${asStr(a.alt)},\n    },\n  },`
    )
    .join("\n") +
  `\n];\n`;
fs.writeFileSync(path.join(CONTENT_DIR, "home.ts"), homeFile);

// ── Report ─────────────────────────────────────────────────────────────────
console.log("Imported photographs:");
console.log(`  commissions : ${gallery.commissions.length}`);
console.log(`  personal    : ${gallery.personal.length}`);
console.log(`  elevator    : ${gallery.elevator.length}`);
console.log(`  home        : ${home.length}`);
console.log(`  total files : ${seenSlugs.size}`);
console.log(
  infoPortrait
    ? `  info portrait: ${infoPortrait.src} (${infoPortrait.width}x${infoPortrait.height})`
    : "  info portrait: NOT FOUND"
);
if (infoPortrait) {
  fs.writeFileSync(
    path.join(OUT_DIR, "_info-portrait.json"),
    JSON.stringify(infoPortrait, null, 2)
  );
}
