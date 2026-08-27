/**
 * Renders the Open Graph card to public/og.png.
 *
 * Chrome rather than sharp/librsvg because the card has to use the site's own
 * typefaces, and those are npm packages rather than system-installed fonts.
 * The woff2 files are inlined as data URIs so the page renders from file://
 * with no server and no network.
 *
 * Run: node tools/build-og.mjs
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const dataUri = (relPath) =>
  `data:font/woff2;base64,${readFileSync(join(root, "node_modules", relPath)).toString("base64")}`;

const serif = dataUri("@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2");
const sans = dataUri("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");

// Mirrors the light theme in src/styles/global.css.
const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: "Instrument Serif"; src: url(${serif}) format("woff2"); font-weight: 400; }
  @font-face { font-family: "Inter"; src: url(${sans}) format("woff2-variations"); font-weight: 100 900; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: oklch(0.995 0.001 90); color: oklch(0.24 0.005 60);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 26px; padding: 72px 96px; text-align: center;
    font-family: "Inter", sans-serif; -webkit-font-smoothing: antialiased;
  }
  .avatar {
    width: 116px; height: 116px; border-radius: 50%;
    background: oklch(0.97 0.002 90); border: 1px solid oklch(0.905 0.003 90);
    display: flex; align-items: center; justify-content: center;
    font-family: "Instrument Serif", serif; font-size: 44px;
    color: oklch(0.435 0.007 60); letter-spacing: 0.02em;
  }
  .name {
    font-family: "Instrument Serif", serif; font-size: 76px;
    letter-spacing: -0.015em; line-height: 1.1;
  }
  .role { font-size: 25px; color: oklch(0.525 0.008 60); }
  .statement {
    font-size: 29px; line-height: 1.5; max-width: 24ch;
    color: oklch(0.435 0.007 60); margin-top: 6px;
  }
</style></head>
<body>
  <div class="avatar">PS</div>
  <div>
    <div class="name">Pranjal Sinha</div>
    <div class="role">Senior Software Engineer &middot; San Francisco, CA</div>
  </div>
  <div class="statement">Simulation, data infrastructure, and developer tooling for autonomous vehicles.</div>
</body></html>`;

const tmp = mkdtempSync(join(tmpdir(), "og-"));
const htmlPath = join(tmp, "og.html");
writeFileSync(htmlPath, html);

// Rendered taller than the card and cropped down. Chrome headless clips the
// last text row when content sits flush against the bottom of the viewport,
// which silently ate the footer line at an exact 1200x630 window.
const shot = join(tmp, "shot.png");
execFileSync("google-chrome", [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  `--user-data-dir=${join(tmp, "profile")}`,
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--window-size=1200,900",
  "--virtual-time-budget=3000",
  `--screenshot=${shot}`,
  `file://${htmlPath}`,
], { stdio: "inherit" });

const out = join(root, "public", "og.png");
await sharp(shot)
  .extract({ left: 0, top: 0, width: 1200, height: 630 })
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(out);

rmSync(tmp, { recursive: true, force: true });
console.log(`wrote ${out}`);
