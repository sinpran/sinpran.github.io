/**
 * Screenshots each page at several widths and reports horizontal overflow,
 * naming the specific elements that are wider than the viewport.
 *
 * Run with the preview server up: node tools/check-layout.mjs
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:4321";
const OUT = "/tmp/shots";
mkdirSync(OUT, { recursive: true });

const pages = [
  ["home", "/"],
  ["fitai", "/work/fitai/"],
  ["404", "/does-not-exist/"],
];

const widths = [320, 390, 768, 1440];

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"],
});

let failures = 0;

for (const [name, path] of pages) {
  for (const width of widths) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await page.goto(BASE + path, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);

    // Bring every lazy image into view so it decodes, otherwise a full-page
    // screenshot captures empty boxes below the fold. scrollIntoView is used
    // rather than a scrollTo sweep, which does not reliably trip the loader in
    // headless. Polled rather than listener-based: an image completing between
    // the filter and the addEventListener would never fire, and the wait hangs.
    await page.evaluate(async () => {
      for (const img of document.images) img.scrollIntoView();
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        if ([...document.images].every((i) => i.complete && i.naturalWidth > 0)) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      // Only after the loads settle. Scrolling back first cancels them.
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 100));
    });

    const brokenImages = await page.evaluate(() =>
      [...document.images]
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src),
    );
    if (brokenImages.length) {
      console.log(`  BROKEN IMAGES: ${brokenImages.join(", ")}`);
    }

    const report = await page.evaluate((vw) => {
      const doc = document.documentElement;
      const offenders = [];
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        // right edge past the viewport, allowing a sub-pixel tolerance
        if (r.right > vw + 1 || r.left < -1) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.getAttribute("class") ?? "").slice(0, 70),
            text: (el.textContent ?? "").trim().slice(0, 45),
            left: Math.round(r.left),
            right: Math.round(r.right),
          });
        }
      }
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        // only report the outermost offenders, children inherit the problem
        offenders: offenders.slice(0, 6),
      };
    }, width);

    const overflow = report.scrollWidth > report.clientWidth;
    const status = overflow ? "OVERFLOW" : "ok      ";
    console.log(
      `${status} ${name.padEnd(6)} @${String(width).padStart(4)}  scrollWidth=${report.scrollWidth} clientWidth=${report.clientWidth}`,
    );
    if (overflow) {
      failures++;
      for (const o of report.offenders) {
        console.log(`         <${o.tag} class="${o.cls}"> ${o.left}..${o.right}  ${JSON.stringify(o.text)}`);
      }
    }

    await page.screenshot({
      path: `${OUT}/${name}-${width}.png`,
      fullPage: width <= 390,
    });
    await page.close();
  }
}

await browser.close();
console.log(failures ? `\n${failures} viewport(s) overflow` : "\nno horizontal overflow anywhere");
process.exit(failures ? 1 : 0);
