import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser } from "puppeteer-core";
import {
  colourScript,
  contrastRatio,
  launchBrowser,
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

/**
 * Every distinct text colour actually painted on the page, paired with the
 * background it sits on. Checking rendered output rather than the token list
 * catches a token applied to the wrong surface.
 */
type Sample = { fg: Rgb; bg: Rgb; size: number; sample: string };

async function sampleTextColours(
  page: import("puppeteer-core").Page,
): Promise<Sample[]> {
  return page.evaluate((script) => {
    // eslint-disable-next-line no-eval
    eval(script);
    const toRgb = window.__resolveColour;
    const bgOf = window.__effectiveBackground;

    const seen = new Map<string, Sample>();

    for (const el of document.querySelectorAll("body *")) {
      const text = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim() ?? "")
        .join("")
        .trim();
      if (!text) continue;

      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      if (Number(style.opacity) === 0) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const fg = toRgb(style.color);
      const bg = bgOf(el);
      const size =
        parseFloat(style.fontSize) *
        (Number(style.fontWeight) >= 700 ? 1.2 : 1);
      const key = `${fg.join()}|${bg.join()}|${Math.round(size)}`;
      if (!seen.has(key))
        seen.set(key, { fg, bg, size, sample: text.slice(0, 40) });
    }
    return [...seen.values()];
  }, colourScript);
}

describe.each(["light", "dark"] as const)("%s theme contrast", (scheme) => {
  it("meets WCAG AA for every painted text colour", async () => {
    const page = await openPage(browser, "/", { colorScheme: scheme });
    const samples = await sampleTextColours(page);
    await page.close();

    expect(samples.length).toBeGreaterThan(5);

    const failures = samples
      .map((s) => ({ ...s, ratio: contrastRatio(s.fg, s.bg) }))
      // AA is 3.0 for large text (>=24px, or >=18.66px bold), 4.5 otherwise.
      .filter((s) => s.ratio < (s.size >= 24 ? 3 : 4.5))
      .map(
        (s) =>
          `${s.ratio.toFixed(2)}:1  rgb(${s.fg}) on rgb(${s.bg}) @${Math.round(s.size)}px  "${s.sample}"`,
      );

    expect(failures).toEqual([]);
  });
});

describe("keyboard access", () => {
  it("shows a visible focus ring when tabbing to the theme toggle", async () => {
    const page = await openPage(browser, "/");

    // Tab rather than calling focus(): :focus-visible keys off the interaction
    // that moved focus, so a programmatic focus would not prove a keyboard user
    // sees anything.
    let reached = false;
    for (let i = 0; i < 12 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(
        () =>
          document.activeElement?.hasAttribute("data-theme-toggle") ?? false,
      );
    }
    expect(reached, "never tabbed to the theme toggle").toBe(true);

    const outline = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement!);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) || 0 };
    });
    await page.close();

    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThanOrEqual(1);
  });

  it("reveals the skip link when it receives focus", async () => {
    const page = await openPage(browser, "/");
    const box = await page.evaluate(() => {
      const el = document.querySelector('a[href="#main"]') as HTMLElement;
      el.focus();
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    });
    await page.close();

    expect(box.w).toBeGreaterThan(1);
    expect(box.h).toBeGreaterThan(1);
  });

  it("puts the skip link first in the tab order", async () => {
    const page = await openPage(browser, "/");
    await page.keyboard.press("Tab");
    const href = await page.evaluate(() =>
      document.activeElement?.getAttribute("href"),
    );
    await page.close();

    expect(href).toBe("#main");
  });
});

describe("landmarks", () => {
  it("labels every navigation region", async () => {
    const page = await openPage(browser, "/");
    const unlabelled = await page.evaluate(() =>
      [...document.querySelectorAll("nav")]
        .filter(
          (n) =>
            !n.getAttribute("aria-label") && !n.getAttribute("aria-labelledby"),
        )
        .map((n) => n.outerHTML.slice(0, 80)),
    );
    await page.close();

    expect(unlabelled).toEqual([]);
  });

  it("orders headings without skipping a level", async () => {
    const page = await openPage(browser, "/");
    const levels = await page.evaluate(() =>
      [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) =>
        Number(h.tagName[1]),
      ),
    );
    await page.close();

    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });
});
