/**
 * Renders the Open Graph cards: public/og.png for the site, and public/og/<slug>.png
 * for each work entry so a shared project link previews as that project rather
 * than as the homepage.
 *
 * Chrome rather than sharp/librsvg because the cards have to use the site's own
 * typefaces, and those are npm packages rather than system-installed fonts. The
 * woff2 files and app icons are inlined as data URIs so each page renders from
 * file:// with no server and no network.
 *
 * Cards are committed rather than built in CI: this needs a Chrome binary, and
 * the deploy workflow should not have to install one to publish a text change.
 *
 * Run: node tools/build-og.mjs
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const fontUri = (relPath) =>
  `data:font/woff2;base64,${readFileSync(join(root, "node_modules", relPath)).toString("base64")}`;

const serif = fontUri(
  "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2",
);
const sans = fontUri(
  "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
);

const escape = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Enough YAML for this collection: top-level `key: value` pairs, one per line.
 * Nested `spec` entries are indented or bulleted, so skipping those lines is
 * all the nesting support needed.
 */
function frontmatter(markdown) {
  const block = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) return {};

  const data = {};
  for (const line of block[1].split("\n")) {
    if (/^\s|^\s*-/.test(line)) continue;
    const pair = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (pair) data[pair[1]] = pair[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
  return data;
}

// Mirrors the light theme in src/styles/global.css.
const SHELL = (body, extraCss = "") => `<!doctype html>
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
  .name {
    font-family: "Instrument Serif", serif; font-size: 76px;
    letter-spacing: -0.015em; line-height: 1.1;
  }
  .role { font-size: 25px; color: oklch(0.525 0.008 60); }
  .statement {
    font-size: 29px; line-height: 1.5; max-width: 24ch;
    color: oklch(0.435 0.007 60); margin-top: 6px;
  }
  ${extraCss}
</style></head>
<body>${body}</body></html>`;

const siteCard = SHELL(
  `<div class="avatar">PS</div>
   <div>
     <div class="name">Pranjal Sinha</div>
     <div class="role">Senior Software Engineer &middot; San Francisco, CA</div>
   </div>
   <div class="statement">Simulation, data infrastructure, and developer tooling for autonomous vehicles.</div>`,
  `.avatar {
     width: 116px; height: 116px; border-radius: 50%;
     background: oklch(0.97 0.002 90); border: 1px solid oklch(0.905 0.003 90);
     display: flex; align-items: center; justify-content: center;
     font-family: "Instrument Serif", serif; font-size: 44px;
     color: oklch(0.435 0.007 60); letter-spacing: 0.02em;
   }`,
);

function projectCard({ title, tagline, iconUri }) {
  return SHELL(
    `${iconUri ? `<img class="icon" src="${iconUri}" alt="">` : ""}
     <div class="name">${escape(title)}</div>
     <div class="statement">${escape(tagline)}</div>
     <div class="byline">Pranjal Sinha &middot; sinpran.github.io</div>`,
    /* position:relative so the byline anchors to the 630px card rather than to
       the taller render window, which would push it below the crop. */
    `body { gap: 22px; position: relative; }
     /* Matches the .app-icon treatment on the site: iOS-style squircle radius
        with a hairline so a light icon does not float on the light card. */
     .icon {
       width: 132px; height: 132px; border-radius: 29px;
       border: 1px solid oklch(0.905 0.003 90);
     }
     .name { font-size: 68px; }
     .statement { font-size: 27px; max-width: 30ch; }
     .byline {
       position: absolute; bottom: 56px;
       font-size: 20px; color: oklch(0.62 0.008 60); letter-spacing: 0.01em;
     }`,
  );
}

/* ---------- render ---------- */

const tmp = mkdtempSync(join(tmpdir(), "og-"));

function render(html, outPath) {
  const htmlPath = join(tmp, `${basename(outPath, ".png")}.html`);
  writeFileSync(htmlPath, html);
  const shot = join(tmp, `${basename(outPath, ".png")}-raw.png`);

  // Rendered taller than the card and cropped down. Chrome headless clips the
  // last text row when content sits flush against the bottom of the viewport,
  // which silently ate the footer line at an exact 1200x630 window.
  execFileSync(
    "google-chrome",
    [
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
    ],
    { stdio: "inherit" },
  );

  return sharp(shot)
    .extract({ left: 0, top: 0, width: 1200, height: 630 })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outPath);
}

await render(siteCard, join(root, "public", "og.png"));
console.log("wrote public/og.png");

const workDir = join(root, "src", "content", "work");
const iconDir = join(root, "src", "assets", "icons");
const outDir = join(root, "public", "og");
mkdirSync(outDir, { recursive: true });

for (const file of readdirSync(workDir).filter((f) => f.endsWith(".md"))) {
  const slug = basename(file, ".md");
  const data = frontmatter(readFileSync(join(workDir, file), "utf8"));
  if (!data.title || !data.tagline) {
    throw new Error(`${file}: needs both title and tagline to build a card`);
  }

  const iconUri = data.icon
    ? `data:image/png;base64,${readFileSync(join(iconDir, data.icon)).toString("base64")}`
    : null;

  await render(projectCard({ ...data, iconUri }), join(outDir, `${slug}.png`));
  console.log(`wrote public/og/${slug}.png`);
}

rmSync(tmp, { recursive: true, force: true });
