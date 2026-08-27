import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadBuilt } from "./helpers";

const slugs = readdirSync("src/content/work")
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""));

/** Width and height out of the PNG IHDR chunk, which is always the first one. */
function pngSize(path: string): { width: number; height: number } {
  const buffer = readFileSync(path);
  expect(buffer.subarray(1, 4).toString(), `${path} is not a PNG`).toBe("PNG");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const meta = (route: string, property: string) =>
  loadBuilt(route)
    .querySelector(`meta[property="${property}"]`)
    ?.getAttribute("content") ?? null;

describe("per-project cards", () => {
  it("covers every work entry", () => {
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      expect(
        existsSync(join("dist", "og", `${slug}.png`)),
        `missing card for ${slug}`,
      ).toBe(true);
    }
  });

  it("is the size every scraper expects", () => {
    for (const slug of slugs) {
      expect(pngSize(join("dist", "og", `${slug}.png`)), slug).toEqual({
        width: 1200,
        height: 630,
      });
    }
  });

  it("is referenced by its own project page, as an absolute URL", () => {
    for (const slug of slugs) {
      const image = meta(`/work/${slug}`, "og:image");
      expect(image, slug).toBe(`https://sinpran.github.io/og/${slug}.png`);
      expect(meta(`/work/${slug}`, "og:image:width")).toBe("1200");
    }
  });

  it("gives each project a distinct card", () => {
    const images = slugs.map((slug) => meta(`/work/${slug}`, "og:image"));
    expect(new Set(images).size).toBe(slugs.length);
  });

  it("also drives the Twitter card", () => {
    const doc = loadBuilt(`/work/${slugs[0]}`);
    const twitter = doc
      .querySelector('meta[name="twitter:image"]')
      ?.getAttribute("content");
    expect(twitter).toBe(meta(`/work/${slugs[0]}`, "og:image"));
  });
});

describe("the site card", () => {
  it("still covers pages that have no card of their own", () => {
    for (const route of ["/", "/404"]) {
      expect(meta(route, "og:image"), route).toBe(
        "https://sinpran.github.io/og.png",
      );
    }
  });

  it("is the size every scraper expects", () => {
    expect(pngSize(join("dist", "og.png"))).toEqual({
      width: 1200,
      height: 630,
    });
  });
});
