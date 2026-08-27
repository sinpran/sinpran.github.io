# sinpran.github.io

Personal site. Astro 7 + Tailwind v4, static output, no client-side JavaScript.

## Running it

Requires Node 22.12 or newer (Astro 7 will refuse to start below that).

```bash
nvm use 22
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve dist/
npm run check    # astro check: types + template diagnostics
```

## Where things live

```
src/
  content.config.ts      Zod schemas for the work and posts collections
  content/work/*.md      one file per project -> index row + detail page
  content/posts/*.md     writing; dormant until the first non-draft file
  data/site.ts           bio, links, hero copy, experience, education, skills
  styles/global.css      @theme design tokens, @font-face, component classes
  layouts/Base.astro     head, meta, OG, JSON-LD, font preloads, skip link
  components/Row.astro   the numbered editorial row primitive
  pages/                 index, work/[...slug], writing/[...slug], 404
public/                  resume.pdf, og.png, favicon.svg, robots.txt
tools/                   build and verification scripts (see below)
```

Adding a project is one Markdown file in `src/content/work/`. The `order` field
drives both the row number and the sort. Adding a post is one file in
`src/content/posts/` with `draft: false` — the Writing section appears on its
own once a published post exists.

## Design notes

Dark is the only theme, so the site ships zero JavaScript and there is no theme
flash to guard against. Tokens in `global.css` are structured so a light theme
can be added later as a `[data-theme="light"]` block rather than a rewrite.

Colours are OKLCH. Everything was checked against the canvas for WCAG AA before
being committed; note that chroma has a hard sRGB ceiling that varies with
lightness, so raising `--color-accent-bright` past `0.105` at `L=0.89` will clip.

Fonts are self-hosted from Fontsource but declared by hand in `global.css`
rather than imported, because importing the Fontsource stylesheets pulls in
cyrillic, greek and vietnamese `@font-face` rules whose files get emitted into
`dist/` and never fetched. Latin only, and the three faces are preloaded in
`Base.astro` from the same files.

## Tools

```bash
node tools/build-og.mjs     # regenerate public/og.png
node tools/render-icon.mjs  # rasterize the Vehicle Tracker SVG icon to PNG
node tools/check-layout.mjs # horizontal-overflow + broken-image check, needs preview running
```

`check-layout.mjs` loads every page at 320/390/768/1440 and fails if anything
overflows the viewport. Run it with `npm run preview` up in another shell.

## Deployment

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds with
`withastro/action@v6` and publishes via `actions/deploy-pages@v5`. This requires
the repository's Pages source to be set to **GitHub Actions** rather than
"Deploy from a branch".
