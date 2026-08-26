import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "images", "gallery-fast-path");
const manifestDir = path.join(root, "generated");
const manifestPath = path.join(manifestDir, "gallery-fast-path-manifest.json");

const galleryContentFiles = [
  "content/commissions.ts",
  "content/personal.ts",
  "content/dance.ts",
  "content/elevator.ts",
];

const FIRST_IMAGE_SETTINGS = new Map([
  ["/images/2026/inside/inside-01.jpg", { width: 1200, crf: 38 }],
  ["/images/2026/outside/outside-01.jpg", { width: 960, crf: 40 }],
  ["/images/2026/dance/dance-01.jpg", { width: 800, crf: 44 }],
  ["/images/2026/elevator/elevator-01.jpg", { width: 960, crf: 40 }],
]);

function propertyValue(object, name) {
  const property = object.properties.find(
    (item) =>
      ts.isPropertyAssignment(item) &&
      ((ts.isIdentifier(item.name) && item.name.text === name) ||
        (ts.isStringLiteral(item.name) && item.name.text === name)),
  );
  return property?.initializer;
}

/** Read ordered image metadata directly from the canonical content modules. */
function galleryImages(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const sourceText = readFileSync(absolutePath, "utf8");
  const sourceFile = ts.createSourceFile(
    absolutePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const images = [];

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const src = propertyValue(node, "src");
      const width = propertyValue(node, "width");
      const height = propertyValue(node, "height");
      if (
        src &&
        ts.isStringLiteral(src) &&
        width &&
        ts.isNumericLiteral(width) &&
        height &&
        ts.isNumericLiteral(height)
      ) {
        images.push({
          source: src.text,
          width: Number(width.text),
          height: Number(height.text),
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  if (images.length < 4) {
    throw new Error(`${relativePath} contains fewer than four gallery images`);
  }
  return images.slice(0, 4);
}

const galleries = galleryContentFiles.map(galleryImages);

mkdirSync(outputDir, { recursive: true });
mkdirSync(manifestDir, { recursive: true });

function runFfmpeg(args, output) {
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.error?.code === "ENOENT") {
    throw new Error("ffmpeg is required to regenerate gallery fast-path images");
  }
  if (result.status !== 0) {
    throw new Error(`Failed to generate ${output}: ${result.stderr || "unknown error"}`);
  }
}

function contentHash(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function publish(tempPath, basename, width, extension) {
  const hash = contentHash(tempPath).slice(0, 12);
  const filename = `${basename}-${width}.${hash}.${extension}`;
  const finalPath = path.join(outputDir, filename);
  renameSync(tempPath, finalPath);
  return {
    src: `/images/gallery-fast-path/${filename}`,
    width,
    bytes: statSync(finalPath).size,
  };
}

function generateFormat({ input, basename, width, crf, format, index }) {
  const extension = format === "avif" ? "avif" : "jpg";
  const tempPath = path.join(
    outputDir,
    `.${basename}-${width}-${process.pid}-${index}.${extension}`,
  );
  const common = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    input,
    "-vf",
    `scale=${width}:-2:flags=lanczos`,
    "-frames:v",
    "1",
  ];
  const encoding =
    format === "avif"
      ? [
          "-c:v",
          "libsvtav1",
          "-crf",
          String(crf),
          "-preset",
          "8",
          "-pix_fmt",
          "yuv420p",
        ]
      : ["-q:v", "5"];
  runFfmpeg([...common, ...encoding, tempPath, "-y"], tempPath);
  return publish(tempPath, basename, width, extension);
}

const manifest = {};
const retainedFiles = new Set();
let generatedCount = 0;

for (const gallery of galleries) {
  for (const [galleryIndex, image] of gallery.entries()) {
    const input = path.join(root, "public", image.source);
    if (!existsSync(input)) throw new Error(`Missing source image: ${image.source}`);

    const basename = path.basename(image.source, path.extname(image.source));
    const firstSettings = FIRST_IMAGE_SETTINGS.get(image.source);
    if (galleryIndex === 0 && !firstSettings) {
      throw new Error(`Missing first-image settings for ${image.source}`);
    }

    const widths =
      galleryIndex === 0
        ? [Math.min(firstSettings.width, image.width)]
        : [...new Set([640, 960, 1200, Math.floor(image.width / 8) * 8])]
            .filter((width) => width <= image.width)
            .sort((a, b) => a - b);
    const crf = firstSettings?.crf ?? 40;
    const formats = { avif: [], jpeg: [] };

    for (const width of widths) {
      for (const format of ["avif", "jpeg"]) {
        const candidate = generateFormat({
          input,
          basename,
          width,
          crf,
          format,
          index: generatedCount,
        });
        formats[format].push(candidate);
        retainedFiles.add(path.basename(candidate.src));
        generatedCount += 1;
      }
    }

    manifest[image.source] = {
      sourceHash: contentHash(input),
      sourceWidth: image.width,
      sourceHeight: image.height,
      first: galleryIndex === 0,
      formats,
    };
  }
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

// The manifest is build data, not a public asset. Remove the legacy public copy.
const legacyManifest = path.join(outputDir, "manifest.json");
if (existsSync(legacyManifest)) unlinkSync(legacyManifest);

for (const filename of readdirSync(outputDir)) {
  if (!/\.(?:avif|jpg)$/.test(filename) || retainedFiles.has(filename)) continue;
  unlinkSync(path.join(outputDir, filename));
}

console.log(
  `Generated ${generatedCount} hashed responsive files for ${Object.keys(manifest).length} photographs`,
);
