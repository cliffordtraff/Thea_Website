import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(
    path.join(root, "generated", "gallery-fast-path-manifest.json"),
    "utf8",
  ),
);
const failures = [];

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

for (const [source, entry] of Object.entries(manifest)) {
  const sourceFile = path.join(root, "public", source);
  if (sha256(sourceFile) !== entry.sourceHash) {
    failures.push(`${source}: generated candidates are stale`);
  }

  for (const [format, candidates] of Object.entries(entry.formats)) {
    if (entry.first && candidates.length !== 1) {
      failures.push(`${source} ${format}: first image must have exactly one candidate`);
    }
    if (!entry.first && candidates[0]?.width !== 640) {
      failures.push(`${source} ${format}: slow candidate must be 640px`);
    }

    for (const [index, candidate] of candidates.entries()) {
      const file = path.join(root, "public", candidate.src);
      const bytes = statSync(file).size;
      const budget = entry.first
        ? format === "avif"
          ? 35_000
          : 180_000
        : index === 0
          ? format === "avif"
            ? 50_000
            : 120_000
          : format === "avif"
            ? 125_000
            : 300_000;

      if (bytes !== candidate.bytes) {
        failures.push(`${candidate.src}: manifest says ${candidate.bytes}, file is ${bytes}`);
      }
      if (bytes > budget) {
        failures.push(`${source} ${format} ${candidate.width}w: ${bytes} > ${budget}`);
      }
      if (candidate.width > entry.sourceWidth) {
        failures.push(`${source} ${format}: ${candidate.width}w exceeds source width`);
      }
    }
  }
}

if (failures.length) {
  console.error("Gallery fast-path checks failed:\n" + failures.join("\n"));
  process.exit(1);
}
console.log(
  `Gallery fast-path freshness and budgets passed for ${Object.keys(manifest).length} photographs`,
);
