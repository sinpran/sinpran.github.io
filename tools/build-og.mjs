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
const mono = dataUri("@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2");

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: "Instrument Serif"; src: url(${serif}) format("woff2"); font-weight: 400; }
  @font-face { font-family: "JetBrains Mono"; src: url(${mono}) format("woff2"); font-weight: 100 800; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; background: #0b0a08; color: #f0eeec;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 72px 80px; font-family: "JetBrains Mono", monospace;
    -webkit-font-smoothing: antialiased;
  }
  .name { font-size: 20px; letter-spacing: 0.22em; text-transform: uppercase; color: #898582; }
  .statement {
    font-family: "Instrument Serif", serif; font-size: 68px; line-height: 1.06;
    letter-spacing: -0.02em; max-width: 20ch;
  }
  .rule { height: 1px; background: #2d2b29; margin-bottom: 28px; }
  .footer { display: flex; align-items: center; gap: 14px; font-size: 19px; color: #b7b3b0; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #f2b95a; flex: none; }
  .accent { color: #f2b95a; }
</style></head>
<body>
  <div class="name">Pranjal Sinha</div>
  <div class="statement">Simulation, data infrastructure, and developer tooling for <span class="accent">autonomous vehicles</span>.</div>
  <div>
    <div class="rule"></div>
    <div class="footer">
      <span class="dot"></span>
      <span>Senior Software Engineer at Applied Intuition</span>
      <span style="color:#898582">&middot;</span>
      <span>San Francisco, CA</span>
    </div>
  </div>
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
