import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./tests/global-setup.ts"],
    include: ["tests/**/*.test.ts"],
    // The suite builds the site and drives a real browser, so the defaults are
    // far too tight.
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // Puppeteer pages and a single preview server do not like being shared
    // across parallel workers.
    fileParallelism: false,
  },
});
