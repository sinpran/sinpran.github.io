/**
 * Screenshots a page region for visual review.
 * Usage: node tools/shoot.mjs <path> <width> <selector> <out.png>
 */
import puppeteer from "puppeteer-core";

const [path = "/", width = "1440", selector = "body", out = "/tmp/shot.png"] =
  process.argv.slice(2);

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
await page.setViewport({ width: Number(width), height: 900, deviceScaleFactor: 2 });
await page.goto(`http://localhost:4321${path}`, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);

const el = await page.$(selector);
if (!el) throw new Error(`no element matching ${selector}`);

await el.scrollIntoView();
await new Promise((r) => setTimeout(r, 1500));

const imgs = await page.evaluate(() =>
  [...document.images].map((i) => ({
    src: i.currentSrc.split("/").pop(),
    complete: i.complete,
    natural: i.naturalWidth,
  })),
);
console.table(imgs);

await el.screenshot({ path: out });
console.log(`wrote ${out}`);
await browser.close();
