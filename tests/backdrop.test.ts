import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser } from "puppeteer-core";
import { launchBrowser, loadBuilt, openPage } from "./helpers";

let browser: Browser;

beforeAll(async () => {
  browser = await launchBrowser();
});

afterAll(async () => {
  await browser?.close();
});

const ROUTES = ["/", "/work/fitai", "/404"];

describe.each(ROUTES)("%s decorative backdrop markup", (route) => {
  const doc = loadBuilt(route);

  it("is present", () => {
    expect(doc.querySelector("[data-backdrop]")).toBeTruthy();
  });

  it("is hidden from assistive technology", () => {
    expect(doc.querySelector("[data-backdrop]")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("carries no text and no focusable children", () => {
    const backdrop = doc.querySelector("[data-backdrop]")!;
    expect(backdrop.textContent?.trim()).toBe("");
    expect(backdrop.querySelectorAll("a, button, input, [tabindex]")).toHaveLength(0);
  });
});

describe("the backdrop stays out of the way", () => {
  it("never intercepts pointer events", async () => {
    const page = await openPage(browser, "/");
    const pointerEvents = await page.evaluate(() => {
      const el = document.querySelector("[data-backdrop]")!;
      return [el, ...el.querySelectorAll("*")].map(
        (n) => getComputedStyle(n).pointerEvents,
      );
    });
    await page.close();

    expect(pointerEvents.length).toBeGreaterThan(1);
    expect(pointerEvents.every((v) => v === "none")).toBe(true);
  });

  it("is fixed and clips its own shapes", async () => {
    const page = await openPage(browser, "/");
    const style = await page.evaluate(() => {
      const s = getComputedStyle(document.querySelector("[data-backdrop]")!);
      return { position: s.position, overflow: s.overflow, zIndex: s.zIndex };
    });
    await page.close();

    expect(style.position).toBe("fixed");
    expect(style.overflow).toBe("hidden");
    // Behind everything: the content sits in the default z-index 0 flow.
    expect(Number(style.zIndex)).toBeLessThan(0);
  });

  it("does not sit on top of the text", async () => {
    const page = await openPage(browser, "/");
    // Whatever is painted at the middle of the heading must be the heading,
    // not a decorative shape.
    const hit = await page.evaluate(() => {
      const r = document.querySelector("h1")!.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return el?.closest("[data-backdrop]") === null;
    });
    await page.close();

    expect(hit).toBe(true);
  });

  it("keeps the large shapes clear of the reading column on wide screens", async () => {
    const page = await openPage(browser, "/", { width: 1440 });
    const intruders = await page.evaluate(() => {
      const column = document.querySelector("main")!.getBoundingClientRect();
      return [...document.querySelectorAll("[data-backdrop] > *")]
        .map((el) => el.getBoundingClientRect())
        // Small motes drifting past the text are fine; a 100px block is not.
        .filter((r) => r.width >= 50)
        .filter((r) => r.right > column.left && r.left < column.right)
        .map((r) => `${Math.round(r.width)}px at x=${Math.round(r.left)}`);
    });
    await page.close();

    expect(intruders).toEqual([]);
  });

  it("leaves the document scroll area alone at every width", async () => {
    for (const width of [320, 390, 768, 1440]) {
      const page = await openPage(browser, "/", { width });
      const { scrollWidth, clientWidth, scrollHeight } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
      }));
      const withoutBackdrop = await page.evaluate(() => {
        document.querySelector("[data-backdrop]")!.remove();
        return document.documentElement.scrollHeight;
      });
      await page.close();

      expect(scrollWidth, `overflowed at ${width}px`).toBeLessThanOrEqual(clientWidth);
      // A fixed layer must not lengthen the page either.
      expect(scrollHeight, `grew the page at ${width}px`).toBe(withoutBackdrop);
    }
  });
});

describe("motion preferences", () => {
  it("keeps the shape count low", async () => {
    // Each shape re-rasters every frame because the morph animates
    // border-radius. Cheap at this count, not at fifty.
    const count = loadBuilt("/").querySelectorAll("[data-backdrop] > *").length;
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(12);
  });

  it("animates the shapes by default", async () => {
    const page = await openPage(browser, "/");
    const durations = await page.evaluate(() =>
      [...document.querySelectorAll("[data-backdrop] > *")].map(
        (el) => getComputedStyle(el).animationDuration,
      ),
    );
    await page.close();

    expect(durations.length).toBeGreaterThan(0);
    // Every shape should be on a genuinely slow loop, not a twitchy one.
    for (const d of durations) expect(parseFloat(d)).toBeGreaterThanOrEqual(10);
  });

  it("removes the backdrop entirely under prefers-reduced-motion", async () => {
    const page = await openPage(browser, "/", { reducedMotion: true });
    const display = await page.evaluate(
      () => getComputedStyle(document.querySelector("[data-backdrop]")!).display,
    );
    await page.close();

    // Freezing the animation would strand the shapes mid-flight; hiding the
    // layer is the honest reading of "reduce".
    expect(display).toBe("none");
  });
});
