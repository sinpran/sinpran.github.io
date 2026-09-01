import { readdirSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser } from "puppeteer-core";
import { launchBrowser, loadBuilt, openPage } from "./helpers";

/**
 * The app screen mockups.
 *
 * They are the largest images on the site and they sit in the middle of the
 * reading column, so the things worth pinning down are that they never shift
 * the layout, never widen the page on a phone, and always carry alt text —
 * a screenshot with an empty alt is a wasted argument for anyone not looking
 * at it.
 */

/** Every project page that declares shots, and how many it declares. */
const PAGES = [
  { route: "/work/fitai", count: 2 },
  { route: "/work/planit", count: 2 },
  { route: "/work/vehicle-tracker", count: 2 },
] as const;

const WITHOUT_SHOTS = ["/", "/404"];

describe("app screens: markup", () => {
  it("renders the declared number of screens on each project page", () => {
    for (const { route, count } of PAGES) {
      const doc = loadBuilt(route);
      const images = doc.querySelectorAll("[data-shots] img");
      expect(images.length, route).toBe(count);
    }
  });

  it("gives every screen descriptive alt text", () => {
    for (const { route } of PAGES) {
      const doc = loadBuilt(route);
      for (const img of doc.querySelectorAll("[data-shots] img")) {
        const alt = img.getAttribute("alt") ?? "";
        expect(alt.length, `${route} alt`).toBeGreaterThan(40);
        // A caption repeated as alt tells a screen reader nothing new.
        const caption =
          img.closest("li")?.querySelector("p")?.textContent ?? "";
        expect(alt, `${route} alt vs caption`).not.toBe(caption.trim());
      }
    }
  });

  it("reserves space for every screen so nothing reflows as they load", () => {
    for (const { route } of PAGES) {
      const doc = loadBuilt(route);
      for (const img of doc.querySelectorAll("[data-shots] img")) {
        expect(
          Number(img.getAttribute("width")),
          `${route} width`,
        ).toBeGreaterThan(0);
        expect(
          Number(img.getAttribute("height")),
          `${route} height`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("defers the screens, which all sit below the fold", () => {
    for (const { route } of PAGES) {
      const doc = loadBuilt(route);
      for (const img of doc.querySelectorAll("[data-shots] img")) {
        expect(img.getAttribute("loading"), route).toBe("lazy");
        expect(img.getAttribute("decoding"), route).toBe("async");
      }
    }
  });

  it("serves them as webp at more than one width", () => {
    const doc = loadBuilt("/work/fitai");
    for (const img of doc.querySelectorAll("[data-shots] img")) {
      expect(img.getAttribute("src")).toMatch(/\.webp$/);
      expect(img.getAttribute("srcset") ?? "").toMatch(/\dw/);
    }
  });

  it("leaves pages without shots alone", () => {
    for (const route of WITHOUT_SHOTS) {
      expect(loadBuilt(route).querySelector("[data-shots]"), route).toBeNull();
    }
  });

  it("ships no screen image the site never references", () => {
    const referenced = new Set(
      PAGES.flatMap(({ route }) =>
        [...loadBuilt(route).querySelectorAll("[data-shots] img")].map((img) =>
          // /_astro/fitai-today.HASH_HASH.webp -> fitai-today
          (img.getAttribute("src") ?? "").replace(/^.*\/([^/.]+)\..*$/, "$1"),
        ),
      ),
    );

    const onDisk = readdirSync(join("src", "assets", "shots"))
      .filter((file) => file.endsWith(".png"))
      .map((file) => file.replace(/\.png$/, ""));

    expect(onDisk.length).toBeGreaterThan(0);
    for (const name of onDisk) {
      expect(referenced.has(name), `${name}.png is committed but unused`).toBe(
        true,
      );
    }
  });
});

describe("app screens: layout", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser?.close();
  });

  it("fits inside a narrow phone without widening the page", async () => {
    const page = await openPage(browser, "/work/fitai", {
      width: 320,
      height: 800,
    });
    const result = await page.evaluate(() => {
      const doc = document.documentElement;
      const widest = [...document.querySelectorAll("[data-shots] *")].reduce(
        (max, el) => Math.max(max, el.getBoundingClientRect().right),
        0,
      );
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        widest,
      };
    });

    expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
    expect(result.widest).toBeLessThanOrEqual(result.clientWidth);
    await page.close();
  });

  it("stacks on a phone and sits side by side on a laptop", async () => {
    const narrow = await openPage(browser, "/work/fitai", {
      width: 390,
      height: 900,
    });
    const stacked = await narrow.evaluate(() => {
      const [a, b] = document.querySelectorAll("[data-shots] li");
      return (
        a.getBoundingClientRect().bottom <= b.getBoundingClientRect().top + 1
      );
    });
    expect(stacked, "should stack at 390px").toBe(true);
    await narrow.close();

    const wide = await openPage(browser, "/work/fitai", {
      width: 1280,
      height: 900,
    });
    const sideBySide = await wide.evaluate(() => {
      const [a, b] = document.querySelectorAll("[data-shots] li");
      return (
        a.getBoundingClientRect().right <= b.getBoundingClientRect().left + 1
      );
    });
    expect(sideBySide, "should pair at 1280px").toBe(true);
    await wide.close();
  });

  /*
   * Every project currently ships a pair, so the lone-screen layout has no page
   * of its own to load. The branch is still live — the schema allows one shot —
   * so this reproduces what AppShots emits for a single screen (one item, and
   * the grid left at one column) and checks it centres instead of hugging the
   * left column the way a stray sm:grid-cols-2 would leave it.
   */
  it("centres a lone screen rather than leaving it in the left column", async () => {
    const page = await openPage(browser, "/work/planit", {
      width: 1280,
      height: 900,
    });
    const offset = await page.evaluate(() => {
      const list = document.querySelector("[data-shots] ul")!;
      list.className = "mx-auto grid max-w-[34rem] grid-cols-1 gap-8";
      while (list.children.length > 1) list.lastElementChild!.remove();

      const img = document
        .querySelector("[data-shots] img")!
        .getBoundingClientRect();
      const main = document.querySelector("main")!.getBoundingClientRect();
      return Math.abs(
        (img.left + img.right) / 2 - (main.left + main.right) / 2,
      );
    });
    expect(offset).toBeLessThan(2);
    await page.close();
  });

  it("holds its height once decoded, so the prose below never jumps", async () => {
    const page = await openPage(browser, "/work/fitai", {
      width: 1280,
      height: 900,
    });
    const shifted = await page.evaluate(async () => {
      const before = document
        .querySelector("[data-shots]")!
        .getBoundingClientRect().height;
      await Promise.all(
        [
          ...document.querySelectorAll<HTMLImageElement>("[data-shots] img"),
        ].map((img) => img.decode().catch(() => undefined)),
      );
      const after = document
        .querySelector("[data-shots]")!
        .getBoundingClientRect().height;
      return Math.abs(after - before);
    });
    expect(shifted).toBeLessThan(1);
    await page.close();
  });

  /*
   * The radius is authored as `14% / 6.5%` so it tracks the rendered size. The
   * two percentages resolve against different axes, and only land on a circle
   * because they were picked for this image's aspect ratio — so the check has
   * to resolve them the way the browser paints them. Chrome hands percentage
   * radii back from getComputedStyle as percentages, not pixels.
   */
  it.each([1280, 390])(
    "keeps the phone corners circular at %ipx",
    async (width) => {
      const page = await openPage(browser, "/work/fitai", {
        width,
        height: 900,
      });
      const corner = await page.evaluate(() => {
        const img =
          document.querySelector<HTMLImageElement>("[data-shots] img")!;
        const box = img.getBoundingClientRect();
        const resolve = (value: string, against: number) =>
          value.endsWith("%")
            ? (parseFloat(value) / 100) * against
            : parseFloat(value);

        const [h, v = h] = getComputedStyle(img).borderTopLeftRadius.split(" ");
        return {
          horizontal: resolve(h, box.width),
          vertical: resolve(v as string, box.height),
        };
      });

      expect(corner.horizontal).toBeGreaterThan(8);
      expect(Math.abs(corner.horizontal - corner.vertical)).toBeLessThan(2);
      await page.close();
    },
  );
});
