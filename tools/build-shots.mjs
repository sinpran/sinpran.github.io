/**
 * Renders the app screen mockups to src/assets/shots/<app>-<screen>.png.
 *
 * These are recreations of the real apps' screens, rebuilt in HTML/CSS from the
 * SwiftUI sources so the copy, the numbers and the layout match what the apps
 * actually show. They are not captures from a device: the apps are private and
 * do not build here. Anything user-visible in them should be traceable to the
 * app source rather than invented.
 *
 * Rendered at 2x in Chrome, because the mockups need the site's own typeface and
 * that is an npm package rather than a system font.
 *
 * Driven through Puppeteer rather than Chrome's --screenshot flag: combining
 * --window-size with --force-device-scale-factor gives a CSS viewport in device
 * pixels, which silently drops anything anchored to the bottom of the layout.
 * setViewport takes the two independently and gets it right.
 *
 * Run: node tools/build-shots.mjs [appFilter]
 */
import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { DEVICE } from "./shots/chrome.mjs";
import { screens as fitai } from "./shots/fitai.mjs";
import { screens as planit } from "./shots/planit.mjs";
import { screens as vehicleTracker } from "./shots/vehicle-tracker.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const fonts = {
  sans: `data:font/woff2;base64,${readFileSync(
    join(
      root,
      "node_modules",
      "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
    ),
  ).toString("base64")}`,
};

const all = [...fitai, ...planit, ...vehicleTracker];
const filter = process.argv[2];

/*
 * Only the screens the site actually shows are written by default. The rest
 * stay defined so swapping one in later is an edit rather than a redraw, but
 * they are not committed as images.
 */
const queue = filter
  ? filter === "--all"
    ? all
    : all.filter((s) => s.name.startsWith(filter))
  : all.filter((s) => s.featured);

if (queue.length === 0) {
  console.error(
    filter ? `no screens matching "${filter}"` : "no featured screens",
  );
  process.exit(1);
}

const outDir = join(root, "src", "assets", "shots");
mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "shots-"));

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"],
});

const page = await browser.newPage();
await page.setViewport({
  width: DEVICE.width,
  height: DEVICE.height,
  deviceScaleFactor: DEVICE.scale,
});

for (const { name, html } of queue) {
  const htmlPath = join(tmp, `${name}.html`);
  writeFileSync(htmlPath, html(fonts));

  await page.goto(`file://${htmlPath}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const out = join(outDir, `${name}.png`);
  await page.screenshot({
    path: out,
    clip: { x: 0, y: 0, width: DEVICE.width, height: DEVICE.height },
  });

  console.log(`wrote src/assets/shots/${name}.png`);
}

await browser.close();
rmSync(tmp, { recursive: true, force: true });
