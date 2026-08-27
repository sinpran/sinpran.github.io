import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "puppeteer-core";
import { colourScript, launchBrowser, openPage, type Rgb } from "./helpers";

let browser: Browser;

beforeAll(async () => {
  browser = await launchBrowser();
});

afterAll(async () => {
  await browser?.close();
});

const brightness = (rgb: Rgb) =>
  (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;

const bodyBackground = (page: Page): Promise<Rgb> =>
  page.evaluate((script) => {
    // eslint-disable-next-line no-eval
    eval(script);
    return window.__resolveColour(
      getComputedStyle(document.body).backgroundColor,
    );
  }, colourScript);

/**
 * Marks the current JS context. If a navigation reloads the document the marker
 * is gone, which is how these tests tell a client-side swap from a full load.
 */
async function markContext(page: Page) {
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__sameContext = true;
  });
}

const stillSameContext = (page: Page) =>
  page.evaluate(
    () => (window as unknown as Record<string, unknown>).__sameContext === true,
  );

async function clickFirstProject(page: Page) {
  await Promise.all([
    page.waitForFunction(() => location.pathname.startsWith("/work/")),
    page.click("[data-work-item]"),
  ]);
  // Let the swap settle.
  await new Promise((r) => setTimeout(r, 250));
}

describe("client-side navigation", () => {
  it("swaps the page without a full reload", async () => {
    const page = await openPage(browser, "/");
    await markContext(page);
    await clickFirstProject(page);

    const sameContext = await stillSameContext(page);
    const heading = await page.$eval("h1", (el) => el.textContent?.trim());
    await page.close();

    expect(sameContext, "the document reloaded instead of swapping").toBe(true);
    expect(heading).toBeTruthy();
  });

  it("prefetches project links so the swap has nothing to wait for", async () => {
    const page = await openPage(browser, "/");

    const prefetched: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/work/")) prefetched.push(r.url());
    });

    await page.hover("[data-work-item]");
    await new Promise((r) => setTimeout(r, 600));
    await page.close();

    expect(prefetched.length).toBeGreaterThan(0);
  });
});

describe("the theme survives navigation", () => {
  it("keeps a dark preference across a swap", async () => {
    const page = await openPage(browser, "/", { colorScheme: "light" });
    await page.click("[data-theme-toggle]");
    expect(
      await page.evaluate(() => document.documentElement.dataset.theme),
    ).toBe("dark");

    await markContext(page);
    await clickFirstProject(page);

    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    const background = await bodyBackground(page);
    const sameContext = await stillSameContext(page);
    await page.close();

    expect(sameContext).toBe(true);
    expect(theme, "theme was lost on swap").toBe("dark");
    expect(brightness(background), "background reverted to light").toBeLessThan(
      0.2,
    );
  });

  it("follows a dark system preference across a swap", async () => {
    const page = await openPage(browser, "/", { colorScheme: "dark" });
    await markContext(page);
    await clickFirstProject(page);

    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    await page.close();

    expect(theme).toBe("dark");
  });

  it("leaves the toggle working after a swap", async () => {
    const page = await openPage(browser, "/", { colorScheme: "light" });
    await clickFirstProject(page);

    await page.click("[data-theme-toggle]");
    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    const background = await bodyBackground(page);
    await page.close();

    expect(theme).toBe("dark");
    expect(brightness(background)).toBeLessThan(0.2);
  });
});

describe("the backdrop survives navigation", () => {
  it("keeps the same element rather than restarting the animation", async () => {
    const page = await openPage(browser, "/");
    await page.evaluate(() => {
      const el = document.querySelector("[data-backdrop]") as HTMLElement;
      el.dataset.tagged = "original";
    });

    await clickFirstProject(page);

    const tag = await page.$eval(
      "[data-backdrop]",
      (el) => (el as HTMLElement).dataset.tagged ?? null,
    );
    const count = await page.$$eval("[data-backdrop]", (els) => els.length);
    await page.close();

    expect(tag, "the backdrop was recreated, so its animation restarted").toBe(
      "original",
    );
    expect(count, "navigation left a duplicate backdrop behind").toBe(1);
  });
});

describe("the VIN demo after navigation", () => {
  it("is wired up when reached by a client-side swap", async () => {
    const page = await openPage(browser, "/");

    await Promise.all([
      page.waitForFunction(() => location.pathname.includes("vehicle-tracker")),
      page.click('[data-work-item][href="/work/vehicle-tracker/"]'),
    ]);
    await page.waitForSelector("[data-vin-demo]");
    await new Promise((r) => setTimeout(r, 300));

    await page.setRequestInterception(true);
    page.on("request", (r) =>
      r.url().includes("nhtsa.dot.gov") ? r.abort() : r.continue(),
    );

    await page.click("[data-vin-example]");
    await new Promise((r) => setTimeout(r, 400));

    const status = await page.$eval(
      "[data-vin-status]",
      (el) => el.textContent?.trim() ?? "",
    );
    await page.close();

    expect(status, "the demo script never bound after the swap").toMatch(
      /valid/i,
    );
  });
});
