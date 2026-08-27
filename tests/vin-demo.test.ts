import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "puppeteer-core";
import { launchBrowser, loadBuilt, openPage } from "./helpers";

let browser: Browser;

beforeAll(async () => {
  browser = await launchBrowser();
});

afterAll(async () => {
  await browser?.close();
});

const ROUTE = "/work/vehicle-tracker";
const HONDA = "1HGCM82633A004352";

/*
 * The catalogue tests below hit the real vPIC service. Probe it once so they
 * can be skipped rather than failed when the network is unavailable, keeping
 * the suite runnable offline.
 */
const vpicReachable = await fetch(
  `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${HONDA}?format=json`,
)
  .then((r) => r.ok)
  .catch(() => false);

/** Blocks vPIC so the offline path can be tested on its own. */
async function cutNetwork(page: Page) {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().includes("nhtsa.dot.gov")) request.abort();
    else request.continue();
  });
}

const statusText = (page: Page) =>
  page.$eval("[data-vin-status]", (el) => el.textContent?.trim() ?? "");

async function type(page: Page, vin: string) {
  await page.click("[data-vin-input]");
  await page.type("[data-vin-input]", vin);
  // The input handler is debounced at 300ms.
  await new Promise((r) => setTimeout(r, 500));
}

describe("markup", () => {
  const doc = loadBuilt(ROUTE);

  it("only appears on the project that opts in", () => {
    expect(doc.querySelector("[data-vin-demo]")).toBeTruthy();
    expect(
      loadBuilt("/work/fitai").querySelector("[data-vin-demo]"),
    ).toBeNull();
    expect(loadBuilt("/").querySelector("[data-vin-demo]")).toBeNull();
  });

  it("labels the input and announces results politely", () => {
    const input = doc.querySelector("#vin-input")!;
    expect(doc.querySelector('label[for="vin-input"]')).toBeTruthy();
    expect(input.getAttribute("maxlength")).toBe("17");
    expect(
      doc.querySelector("[data-vin-status]")!.getAttribute("aria-live"),
    ).toBe("polite");
  });

  it("says so when JavaScript is unavailable", () => {
    expect(doc.querySelector("noscript")?.textContent).toContain("JavaScript");
  });
});

describe("offline decoding", () => {
  it("validates a good VIN with no network at all", async () => {
    const page = await openPage(browser, ROUTE);
    await cutNetwork(page);
    await type(page, HONDA);

    const status = await statusText(page);
    const segments = await page.$$eval("[data-vin-segments] li", (els) =>
      els.map((el) => el.textContent?.trim() ?? ""),
    );
    await page.close();

    expect(status).toMatch(/valid/i);
    expect(segments.length).toBe(6);
    expect(segments.join(" ")).toContain("1HG");
    expect(segments.join(" ")).toContain("004352");
  });

  it("reports the model year, maker and origin without a lookup", async () => {
    const page = await openPage(browser, ROUTE);
    await cutNetwork(page);
    await type(page, HONDA);

    const facts = await page.$eval(
      "[data-vin-facts]",
      (el) => el.textContent ?? "",
    );
    await page.close();

    expect(facts).toContain("2003");
    expect(facts).toContain("Honda");
    expect(facts).toContain("United States");
  });

  it("names the expected check digit when one character is wrong", async () => {
    const page = await openPage(browser, ROUTE);
    await cutNetwork(page);
    await type(page, "1HGCM82613A004352");

    const status = await statusText(page);
    await page.close();

    expect(status).toContain("check digit");
    expect(status).toContain("3");
  });

  it("counts down while the VIN is still too short", async () => {
    const page = await openPage(browser, ROUTE);
    await cutNetwork(page);
    await type(page, "1HGCM");

    const status = await statusText(page);
    await page.close();

    expect(status).toContain("5 of 17");
  });

  it("degrades to the offline result when the lookup fails", async () => {
    const page = await openPage(browser, ROUTE);
    await cutNetwork(page);
    await type(page, HONDA);
    await new Promise((r) => setTimeout(r, 800));

    const facts = await page.$eval(
      "[data-vin-facts]",
      (el) => el.textContent ?? "",
    );
    const scheduleHidden = await page.$eval("[data-vin-schedule]", (el) =>
      el.hasAttribute("hidden"),
    );
    await page.close();

    expect(facts).toContain("lookup unavailable");
    // Still shows what it does know.
    expect(facts).toContain("Honda");
    expect(scheduleHidden).toBe(true);
  });
});

describe("example buttons", () => {
  it("fills and decodes without typing", async () => {
    const page = await openPage(browser, ROUTE);
    await cutNetwork(page);
    await page.click("[data-vin-example]");
    await new Promise((r) => setTimeout(r, 300));

    const value = await page.$eval(
      "[data-vin-input]",
      (el) => (el as HTMLInputElement).value,
    );
    const status = await statusText(page);
    await page.close();

    expect(value).toBe(HONDA);
    expect(status).toMatch(/valid/i);
  });

  it("is reachable and operable from the keyboard", async () => {
    const page = await openPage(browser, ROUTE);
    await cutNetwork(page);

    let reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(
        () => document.activeElement?.hasAttribute("data-vin-example") ?? false,
      );
    }
    expect(reached, "never tabbed to an example button").toBe(true);

    await page.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 300));
    const status = await statusText(page);
    await page.close();

    expect(status).toMatch(/valid/i);
  });
});

describe("the filtered catalogue", () => {
  it.skipIf(!vpicReachable)(
    "filters the catalogue once attributes arrive",
    async () => {
      const page = await openPage(browser, ROUTE);
      await type(page, HONDA);
      await page.waitForSelector("[data-vin-schedule]:not([hidden])", {
        timeout: 15_000,
      });

      const applicable = await page.$$eval("[data-vin-applicable] li", (els) =>
        els.map((el) => el.textContent ?? ""),
      );
      const excluded = await page.$$eval("[data-vin-excluded] li", (els) =>
        els.map((el) => el.textContent ?? ""),
      );
      await page.close();

      expect(applicable.length).toBeGreaterThan(5);
      // A petrol Accord: keeps plugs and oil, drops the diesel-only item.
      expect(applicable.join(" ")).toContain("Spark plugs");
      expect(excluded.join(" ")).toContain("Diesel exhaust fluid");
      // Every exclusion carries its reason.
      for (const line of excluded) expect(line).toContain("—");
    },
  );

  it.skipIf(!vpicReachable)(
    "shows an electric car a visibly shorter list",
    async () => {
      const page = await openPage(browser, ROUTE);
      await type(page, "5YJ3E1EAXHF000316");
      await page.waitForSelector("[data-vin-schedule]:not([hidden])", {
        timeout: 15_000,
      });

      const excluded = await page.$$eval("[data-vin-excluded] li", (els) =>
        els.map((el) => el.textContent ?? ""),
      );
      await page.close();

      expect(excluded.join(" ")).toContain("Spark plugs");
      expect(excluded.join(" ")).toContain("Engine oil");
    },
  );
});
