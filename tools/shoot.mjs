/**
 * Screenshot helper for eyeballing the site.
 *   node tools/shoot.mjs [route] [width] [theme] [out]
 * BASE_URL env var points it at a deployed site instead of the local preview.
 */
import puppeteer from "puppeteer-core";

const [, , route = "/", width = "1280", theme = "light", out = "/tmp/shot.png"] =
  process.argv;
const base = process.env.BASE_URL ?? "http://localhost:4322";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
await page.setViewport({ width: Number(width), height: 900, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((t) => localStorage.setItem("theme", t), theme);
await page.goto(base + route, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
// Let the lazy project icons decode before capturing.
await page.evaluate(async () => {
  for (const img of document.images) img.scrollIntoView();
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && ![...document.images].every((i) => i.complete)) {
    await new Promise((r) => setTimeout(r, 100));
  }
  window.scrollTo(0, 0);
});

await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`${base}${route} @${width}px ${theme} -> ${out}`);
