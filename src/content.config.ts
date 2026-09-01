import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
// Astro 6+ decoupled the schema helper from astro:content and bundles Zod 4.
import { z } from "astro/zod";

const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    /** The single line that appears in the index row. */
    tagline: z.string(),
    /** Controls both the displayed row number and the sort order. */
    order: z.number(),
    year: z.string(),
    platform: z.string(),
    /** Lives in public/icons/. Optional so a project without art still renders. */
    icon: z.string().optional(),
    /** The pull-quote at the top of the detail page: the project's central constraint. */
    constraint: z.string(),
    /** Rendered as the spec block. Order is preserved. */
    spec: z.array(z.object({ label: z.string(), value: z.string() })),
    /** Opts the entry into an interactive demo rendered above the write-up. */
    demo: z.enum(["vin"]).optional(),
    /**
     * Screen mockups from src/assets/shots/, built by tools/build-shots.mjs.
     * Capped at two so the pair always lays out as a clean 2-up.
     */
    shots: z
      .array(
        z.object({ src: z.string(), alt: z.string(), caption: z.string() }),
      )
      .max(2)
      .optional(),
    draft: z.boolean().default(false),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { work, posts };
