import { describe, expect, it } from "vitest";
import { loadBuilt } from "./helpers";

const ROUTES = [
  "/",
  "/work/fitai",
  "/work/planit",
  "/work/vehicle-tracker",
  "/404",
];

describe.each(ROUTES)("%s document structure", (route) => {
  const doc = loadBuilt(route);

  it("declares its language", () => {
    expect(doc.documentElement.getAttribute("lang")).toBe("en");
  });

  it("has exactly one h1", () => {
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
  });

  it("opens with a skip link pointing at the main landmark", () => {
    const first = doc.querySelector("body a");
    expect(first?.getAttribute("href")).toBe("#main");
    expect(doc.querySelector("main")?.getAttribute("id")).toBe("main");
  });

  it("has one main landmark", () => {
    expect(doc.querySelectorAll("main")).toHaveLength(1);
  });

  it("gives every image an alt attribute", () => {
    for (const img of doc.querySelectorAll("img")) {
      expect(
        img.hasAttribute("alt"),
        `<img src="${img.getAttribute("src")}">`,
      ).toBe(true);
    }
  });

  it("gives every link discernible text", () => {
    for (const a of doc.querySelectorAll("a")) {
      const name = a.textContent?.trim() || a.getAttribute("aria-label") || "";
      expect(
        name.length,
        `<a href="${a.getAttribute("href")}">`,
      ).toBeGreaterThan(0);
    }
  });

  it("carries canonical, description and OG image", () => {
    expect(
      doc.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toMatch(/^https:\/\/sinpran\.github\.io/);
    expect(
      doc.querySelector('meta[name="description"]')?.getAttribute("content"),
    ).toBeTruthy();
    expect(
      doc.querySelector('meta[property="og:image"]')?.getAttribute("content"),
    ).toBeTruthy();
  });

  it("fetches no third-party fonts, styles or scripts", () => {
    // Only resources the browser actually requests; canonical and og:url are
    // absolute by design.
    const selector = [
      'link[rel="stylesheet"]',
      'link[rel="preload"]',
      'link[rel="preconnect"]',
      'link[rel="dns-prefetch"]',
      "script[src]",
    ].join(",");

    const external = [...doc.querySelectorAll(selector)]
      .map((el) => el.getAttribute("href") ?? el.getAttribute("src") ?? "")
      .filter((url) => /^https?:\/\//.test(url));

    expect(external).toEqual([]);
  });
});

describe.each(ROUTES)("%s theming contract", (route) => {
  const doc = loadBuilt(route);

  it("applies the theme from a blocking inline script in the head", () => {
    const scripts = [...doc.querySelectorAll("head script")];
    const themeScript = scripts.find((s) =>
      (s.textContent ?? "").includes("data-theme"),
    );

    expect(themeScript, "no inline theme script found in <head>").toBeTruthy();
    // Deferred or async would run after first paint, which is the flash.
    expect(themeScript!.hasAttribute("defer")).toBe(false);
    expect(themeScript!.hasAttribute("async")).toBe(false);
    expect(themeScript!.getAttribute("type")).not.toBe("module");
    expect(themeScript!.hasAttribute("src")).toBe(false);
  });

  it("reads a stored preference and falls back to the system setting", () => {
    const src = [...doc.querySelectorAll("head script")]
      .map((s) => s.textContent ?? "")
      .join("\n");
    expect(src).toContain("localStorage");
    expect(src).toContain("prefers-color-scheme");
  });

  it("exposes an accessible theme toggle", () => {
    const toggle = doc.querySelector("[data-theme-toggle]");
    expect(toggle, "no [data-theme-toggle] element").toBeTruthy();
    expect(toggle!.tagName.toLowerCase()).toBe("button");
    expect(toggle!.getAttribute("type")).toBe("button");

    const name =
      toggle!.getAttribute("aria-label") || toggle!.textContent?.trim() || "";
    expect(name.length).toBeGreaterThan(0);
  });
});

describe("homepage content", () => {
  const doc = loadBuilt("/");

  it("leads with an avatar", () => {
    const avatar = doc.querySelector("[data-avatar]");
    expect(avatar, "no [data-avatar] element").toBeTruthy();
    expect(doc.querySelector("header")?.contains(avatar!)).toBe(true);
  });

  it("lists every role as a single summary line with no bullet list", () => {
    const roles = doc.querySelectorAll("#experience [data-role]");
    expect(roles).toHaveLength(4);

    for (const role of roles) {
      expect(role.querySelectorAll("ul, ol")).toHaveLength(0);
      const summary = role.querySelector("[data-role-summary]");
      expect(
        summary?.textContent?.trim().length,
        "role needs one summary line",
      ).toBeGreaterThan(0);
    }
  });

  it("keeps the experience section brief", () => {
    // Guards against the dense bullet lists creeping back in.
    const text =
      doc
        .querySelector("#experience")
        ?.textContent?.replace(/\s+/g, " ")
        .trim() ?? "";
    expect(text.length).toBeLessThan(1200);
  });

  it("links each project to its detail page", () => {
    const items = doc.querySelectorAll("[data-work-item]");
    expect(items).toHaveLength(3);

    const hrefs = [...items].map((el) =>
      el.matches("a")
        ? el.getAttribute("href")
        : el.querySelector("a")?.getAttribute("href"),
    );
    expect(hrefs.sort()).toEqual([
      "/work/fitai/",
      "/work/planit/",
      "/work/vehicle-tracker/",
    ]);
  });

  it("does not render a writing section while there are no published posts", () => {
    expect(doc.querySelector("#writing")).toBeNull();
  });
});
