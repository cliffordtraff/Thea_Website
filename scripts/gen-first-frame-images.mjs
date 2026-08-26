import { mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "images", "first-frame");

const images = [
  {
    input: "public/images/2026/inside/inside-01.jpg",
    output: "inside-01",
    width: 1200,
    crf: 34,
  },
  {
    input: "public/images/2026/outside/outside-01.jpg",
    output: "outside-01",
    width: 640,
    crf: 40,
  },
  {
    input: "public/images/2026/dance/dance-01.jpg",
    output: "dance-01",
    width: 640,
    crf: 40,
  },
  {
    input: "public/images/2026/elevator/elevator-01.jpg",
    output: "elevator-01",
    width: 640,
    crf: 40,
  },
];

mkdirSync(outputDir, { recursive: true });

function runFfmpeg(args, output) {
  const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (result.error?.code === "ENOENT") {
    throw new Error("ffmpeg is required to regenerate first-frame images");
  }
  if (result.status !== 0) {
    throw new Error(`Failed to generate ${output}`);
  }
}

for (const image of images) {
  const input = path.join(root, image.input);
  const scale = `scale=${image.width}:-2:flags=lanczos`;
  const avifOutput = path.join(outputDir, `${image.output}.avif`);
  const jpegOutput = path.join(outputDir, `${image.output}.jpg`);

  runFfmpeg(
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      input,
      "-vf",
      scale,
      "-frames:v",
      "1",
      "-c:v",
      "libsvtav1",
      "-crf",
      String(image.crf),
      "-preset",
      "8",
      "-pix_fmt",
      "yuv420p",
      avifOutput,
      "-y",
    ],
    avifOutput,
  );

  runFfmpeg(
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      input,
      "-vf",
      scale,
      "-frames:v",
      "1",
      "-q:v",
      "4",
      jpegOutput,
      "-y",
    ],
    jpegOutput,
  );
}

console.log(`Generated ${images.length} AVIF/JPEG first-frame pairs in ${outputDir}`);
