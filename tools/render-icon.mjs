import sharp from "sharp";
import { statSync } from "node:fs";

const svg = "../src/assets/icons/vehicle-tracker.svg";
const out = "../src/assets/icons/vehicle-tracker.png";

// iOS app icons must be opaque with no alpha channel, so flatten onto the
// gradient's top stop before encoding.
await sharp(svg, { density: 384 })
  .resize(1024, 1024)
  .flatten({ background: "#2d3e51" })
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(out);

const { width, height, channels } = await sharp(out).metadata();
console.log(`${out}  ${width}x${height}  ${channels}ch  ${(statSync(out).size / 1024).toFixed(1)} KB`);
