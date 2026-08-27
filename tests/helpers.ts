import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

export const BASE_URL = "http://localhost:4322";

/** Parse a built page straight out of dist/, no browser needed. */
export function loadBuilt(route: string) {
  const file = route === "/404" ? "404.html" : join(route.replace(/^\//, ""), "index.html");
  const html = readFileSync(join("dist", file), "utf8");
  return parseHTML(html).document;
}

export async function newIsolatedPage(browser: Browser): Promise<Page> {
  const context = await browser.createBrowserContext();
  return context.newPage();
}

export function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
}

/**
 * Each page gets its own browser context. Without that, localStorage is shared
 * across the whole file and a theme chosen in one test leaks into the next.
 */
export async function openPage(
  browser: Browser,
  route: string,
  opts: {
    width?: number;
    height?: number;
    colorScheme?: "light" | "dark";
    reducedMotion?: boolean;
  } = {},
): Promise<Page> {
  const page = await newIsolatedPage(browser);
  await page.setViewport({
    width: opts.width ?? 1280,
    height: opts.height ?? 900,
    deviceScaleFactor: 1,
  });

  const features = [];
  if (opts.colorScheme) {
    features.push({ name: "prefers-color-scheme", value: opts.colorScheme });
  }
  if (opts.reducedMotion) {
    features.push({ name: "prefers-reduced-motion", value: "reduce" });
  }
  if (features.length) await page.emulateMediaFeatures(features);
  await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/* ---------- colour ---------- */

export type Rgb = [number, number, number];

function relativeLuminance([r, g, b]: Rgb): number {
  const lin = [r, g, b]
    .map((c) => c / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Browser-side helpers, injected as source because they run inside page.evaluate.
 *
 * Colours are resolved through a 1x1 canvas rather than parsed from the string
 * getComputedStyle returns. Chrome reports authored `oklch()` values back as
 * `oklch(...)`, and reading those three numbers as if they were RGB produces
 * nonsense ratios. Canvas gives the actual painted sRGB bytes for any syntax.
 */
export const colourScript = `
(() => {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = ctx.canvas.height = 1;

  const paint = (value) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data;
  };

  window.__resolveColour = (value) => {
    const d = paint(value);
    return [d[0], d[1], d[2]];
  };

  const isTransparent = (value) => !value || value === 'transparent' || paint(value)[3] === 0;

  /* First ancestor with a non-transparent background: the colour text is
     actually read against. */
  window.__effectiveBackground = (el) => {
    let node = el;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (!isTransparent(bg)) return window.__resolveColour(bg);
      node = node.parentElement;
    }
    return window.__resolveColour(getComputedStyle(document.body).backgroundColor);
  };
})();
`;

declare global {
  interface Window {
    __resolveColour: (value: string) => Rgb;
    __effectiveBackground: (el: Element) => Rgb;
  }
}
