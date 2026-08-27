import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser } from "puppeteer-core";
import {
  colourScript,
  launchBrowser,
  newIsolatedPage,
  openPage,
  type Rgb,
} from "./helpers";

let browser: Browser;

beforeAll(async () => {
  browser = await launchBrowser();
});

afterAll(async () => {
  await browser?.close();
});

/** 0 = black, 1 = white. Used to assert a theme is actually light or dark. */
const brightness = (rgb: Rgb) =>
  (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;

/** Resolved through canvas: Chrome reports authored oklch() values verbatim. */
const bodyBackground = (page: import("puppeteer-core").Page): Promise<Rgb> =>
  page.evaluate((script) => {
    // eslint-disable-next-line no-eval
    eval(script);
    return window.__resolveColour(
      getComputedStyle(document.body).backgroundColor,
    );
  }, colourScript);

describe("theme selection", () => {
  it("defaults to light when the system prefers light", async () => {
    const page = await openPage(browser, "/", { colorScheme: "light" });
    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    const bg = await bodyBackground(page);
    await page.close();

    expect(theme).toBe("light");
    expect(brightness(bg)).toBeGreaterThan(0.8);
  });

  it("follows the system setting when it prefers dark", async () => {
    const page = await openPage(browser, "/", { colorScheme: "dark" });
    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    const bg = await bodyBackground(page);
    await page.close();

    expect(theme).toBe("dark");
    expect(brightness(bg)).toBeLessThan(0.2);
  });

  it("honours a stored preference over the system setting", async () => {
    const page = await newIsolatedPage(browser);
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "dark" },
    ]);
    await page.goto("http://localhost:4322/", {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate(() => localStorage.setItem("theme", "light"));
    await page.reload({ waitUntil: "networkidle0" });

    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    const bg = await bodyBackground(page);
    await page.close();

    expect(theme).toBe("light");
    expect(brightness(bg)).toBeGreaterThan(0.8);
  });
});

describe("the toggle", () => {
  it("flips the theme and the rendered background", async () => {
    const page = await openPage(browser, "/", { colorScheme: "light" });

    const before = await bodyBackground(page);
    await page.click("[data-theme-toggle]");
    const themeAfter = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    const after = await bodyBackground(page);
    await page.close();

    expect(themeAfter).toBe("dark");
    expect(brightness(before)).toBeGreaterThan(0.8);
    expect(brightness(after)).toBeLessThan(0.2);
  });

  it("persists the choice across a reload", async () => {
    const page = await openPage(browser, "/", { colorScheme: "light" });
    await page.click("[data-theme-toggle]");
    await page.reload({ waitUntil: "networkidle0" });

    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    const stored = await page.evaluate(() => localStorage.getItem("theme"));
    await page.close();

    expect(theme).toBe("dark");
    expect(stored).toBe("dark");
  });

  it("reports its state to assistive technology", async () => {
    const page = await openPage(browser, "/", { colorScheme: "light" });

    const read = () =>
      page.evaluate(() => {
        const el = document.querySelector("[data-theme-toggle]")!;
        return {
          pressed: el.getAttribute("aria-pressed"),
          label: el.getAttribute("aria-label"),
        };
      });

    const before = await read();
    await page.click("[data-theme-toggle]");
    const after = await read();
    await page.close();

    // Either aria-pressed flips, or the label rewrites itself. One must change.
    const changed =
      before.pressed !== after.pressed || before.label !== after.label;
    expect(
      changed,
      `state never changed: ${JSON.stringify({ before, after })}`,
    ).toBe(true);
  });

  it("applies the theme before first paint", async () => {
    const page = await newIsolatedPage(browser);
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "dark" },
    ]);

    // Sampled the moment parsing finishes. A deferred or module script would not
    // have run yet, so this would read null and the user would see a flash of
    // the wrong background.
    await page.evaluateOnNewDocument(() => {
      document.addEventListener("readystatechange", () => {
        const w = window as unknown as Record<string, unknown>;
        if (
          document.readyState === "interactive" &&
          w.__themeAtParse === undefined
        ) {
          w.__themeAtParse =
            document.documentElement.getAttribute("data-theme");
        }
      });
    });

    await page.goto("http://localhost:4322/", { waitUntil: "networkidle0" });
    const atParse = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__themeAtParse,
    );
    await page.close();

    expect(atParse).toBe("dark");
  });
});
