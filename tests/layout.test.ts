import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser } from "puppeteer-core";
import { launchBrowser, openPage } from "./helpers";

let browser: Browser;

beforeAll(async () => {
  browser = await launchBrowser();
});

afterAll(async () => {
  await browser?.close();
});

const WIDTHS = [320, 390, 768, 1024, 1440];
const ROUTES = ["/", "/work/fitai", "/404"];

describe("no horizontal overflow", () => {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      it(`${route} at ${width}px`, async () => {
        const page = await openPage(browser, route, { width });

        // Pull lazy images in first; an undecoded image can mask a wide element.
        await page.evaluate(async () => {
          for (const img of document.images) img.scrollIntoView();
          const deadline = Date.now() + 5000;
          while (Date.now() < deadline) {
            if ([...document.images].every((i) => i.complete)) break;
            await new Promise((r) => setTimeout(r, 100));
          }
          window.scrollTo(0, 0);
        });

        const { scrollWidth, clientWidth, offenders } = await page.evaluate(
          (vw) => {
            const bad: string[] = [];
            for (const el of document.querySelectorAll("body *")) {
              // The decorative shapes are deliberately oversized and drift past
              // the edge; their container clips them, so they are not overflow.
              // The scrollWidth assertion below still catches real escapes.
              if (el.closest("[data-backdrop]")) continue;
              const r = el.getBoundingClientRect();
              if (r.width === 0 && r.height === 0) continue;
              if (r.right > vw + 1 || r.left < -1) {
                bad.push(
                  `<${el.tagName.toLowerCase()} class="${el.className}">`,
                );
              }
            }
            return {
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              offenders: bad.slice(0, 5),
            };
          },
          width,
        );

        await page.close();
        expect(offenders).toEqual([]);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      });
    }
  }
});

describe("the layout is centred", () => {
  for (const width of [1024, 1440]) {
    it(`main is horizontally centred at ${width}px`, async () => {
      const page = await openPage(browser, "/", { width });
      const { left, right } = await page.evaluate(() => {
        const r = document.querySelector("main")!.getBoundingClientRect();
        return { left: r.left, right: window.innerWidth - r.right };
      });
      await page.close();

      expect(Math.abs(left - right)).toBeLessThanOrEqual(2);
    });
  }

  it("centres the hero text", async () => {
    const page = await openPage(browser, "/");
    const align = await page.evaluate(
      () => getComputedStyle(document.querySelector("header")!).textAlign,
    );
    await page.close();
    expect(align).toBe("center");
  });

  it("centres the avatar within the page", async () => {
    const page = await openPage(browser, "/", { width: 1280 });
    const offset = await page.evaluate(() => {
      const r = document
        .querySelector("[data-avatar]")!
        .getBoundingClientRect();
      const centre = r.left + r.width / 2;
      return Math.abs(centre - window.innerWidth / 2);
    });
    await page.close();
    expect(offset).toBeLessThanOrEqual(2);
  });

  it("keeps the reading column narrow", async () => {
    const page = await openPage(browser, "/", { width: 1440 });
    const width = await page.evaluate(
      () => document.querySelector("main")!.getBoundingClientRect().width,
    );
    await page.close();

    // Simple and centred means a narrow measure, not a 900px slab.
    expect(width).toBeLessThanOrEqual(720);
  });
});

describe("touch targets", () => {
  it("gives the theme toggle a comfortable hit area", async () => {
    const page = await openPage(browser, "/", { width: 390 });
    const box = await page.evaluate(() => {
      const r = document
        .querySelector("[data-theme-toggle]")!
        .getBoundingClientRect();
      return { w: r.width, h: r.height };
    });
    await page.close();

    expect(box.w).toBeGreaterThanOrEqual(40);
    expect(box.h).toBeGreaterThanOrEqual(40);
  });

  it("gives project links a large tap area", async () => {
    const page = await openPage(browser, "/", { width: 390 });
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll("[data-work-item]")].map(
        (el) => el.getBoundingClientRect().height,
      ),
    );
    await page.close();

    expect(heights).toHaveLength(3);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
  });
});
