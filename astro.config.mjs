// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// This is a GitHub Pages *user* site, served from the domain root.
// Setting `base` here (as project-site guides instruct) would break every asset URL.
export default defineConfig({
  site: "https://sinpran.github.io",
  integrations: [sitemap()],
  // Hover rather than viewport: the pages are small, but prefetching every link
  // on sight spends a visitor's bandwidth on pages they never open.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  vite: {
    plugins: [tailwindcss()],
  },
});
