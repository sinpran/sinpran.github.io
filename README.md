# sinpran.github.io

Personal site. Astro 7 + Tailwind v4, static output, light and dark themes.

## Running it

Requires Node 22.12 or newer (Astro 7 will refuse to start below that).

```bash
nvm use 22
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve dist/
npm run check    # astro check: types + template diagnostics
npm test         # the full suite (builds and serves the site itself)
```

## Where things live

```
src/
  content.config.ts        Zod schemas for the work and posts collections
  content/work/*.md        one file per project -> index row + detail page
  content/posts/*.md       writing; dormant until the first non-draft file
  data/site.ts             bio, links, hero copy, experience, education, skills
  lib/vin.ts               VIN decoding: check digit, model year, origin
  lib/maintenance.ts       the applicability filter, and vPIC field mapping
  styles/global.css        light/dark tokens, @font-face, component classes
  layouts/Base.astro       head, meta, OG, JSON-LD, preloads, pre-paint theme script
  components/Avatar.astro  monogram, or a headshot if one is present
  components/Section.astro labelled section wrapper
  components/ThemeToggle.astro
  components/VinDemo.astro live VIN decoder, opt-in per work entry
  components/AppShots.astro app screen mockups, opt-in per work entry
  assets/shots/*.png       the mockups themselves (see App screens)
  pages/                   index, work/[...slug], writing/[...slug], 404
public/                    resume.pdf, favicon.svg, robots.txt
  og.png                   site card
  og/<slug>.png            one card per project, committed (see Tools)
tests/                     vitest suite (see Testing)
tools/                     build and verification scripts (see Tools)
```

Adding a project is one Markdown file in `src/content/work/`. The `order` field
drives the sort. Adding a post is one file in `src/content/posts/` with
`draft: false` — the Writing section appears on its own once a published post
exists.

## Design notes

The layout is a single centred column capped at `max-w-2xl`. The hero is centred;
body copy inside it is left-aligned, because centred multi-line paragraphs are
harder to read. Experience is deliberately one line per role — the bullet-by-bullet
version lives in the resume PDF, and duplicating it here is what made the page
read like a document rather than a site.

### Theming

Light is the default. `@theme inline` in `global.css` maps Tailwind's colour
tokens to bare custom properties (`--color-canvas: var(--canvas)`), so
`[data-theme]` swaps the whole palette at once rather than each utility baking in
a fixed value.

The theme is applied by a **blocking inline script in `<head>`**, before the
stylesheet. Anything deferred paints the default theme first and flashes. Both
the script's position and the absence of a flash are covered by tests, so this
is not a detail to refactor casually.

Colours are OKLCH and every painted text colour is checked against its actual
background for WCAG AA, in both themes, by the test suite. Chroma has a hard sRGB
ceiling that varies with lightness, so pushing saturation up at high lightness
will clip.

### Navigation

`<ClientRouter />` swaps pages in place, and `prefetch` warms a link on hover, so
a click has nothing left to fetch. Two things have to survive a swap:

- **The theme.** A swap installs the server-rendered `<html>`, which carries no
  `data-theme`. The head script re-applies on `astro:after-swap`, which runs
  before the new page paints. Without it every navigation flashes light.
- **The backdrop and the theme toggle**, via `transition:persist`. Rebuilding the
  backdrop restarts every shape from its delay, so the whole field visibly jumps.
  The toggle persists for a different reason: `is:inline` scripts do not re-run
  after a swap, so a fresh button would come back inert.

`navigation.test.ts` covers all three, and asserts the swap is genuinely
client-side by checking that a marker set on `window` survives it.

### The VIN demo

The Vehicle Tracker page opts in with `demo: vin` in its frontmatter. It exists
because the page claims the app filters a maintenance catalogue by what the VIN
decodes to, and a claim you can run is worth more than a paragraph.

Decoding is pure and offline — validity, check digit, model year, origin all fall
out of the seventeen characters. The powertrain attributes the filter actually
needs do not, so those come from NHTSA's vPIC API. That call is allowed to fail:
the offline readout stands on its own, and the catalogue simply stays hidden.
Tests run the offline path with the network cut, so the suite does not depend on
a third party being up.

### App screens

The phone screens on the project pages are **recreations, not captures**. The
three apps are private and do not build here, so each screen is rebuilt in
HTML/CSS from its own SwiftUI source and rendered through headless Chrome by
`tools/build-shots.mjs`, one module per app under `tools/shots/`.

The rule that makes them worth showing is that nothing user-visible is invented.
Copy, navigation titles, status labels, colours and number formatting are all
traceable to the app repo — Vehicle Tracker's rows read
`"<status> - next due at <n> mi"` because that is what `ComponentRow` builds,
and its accent is the literal `AccentColor.colorset` value. What _is_ invented
is the sample data: a 2013 F-150 at 96,480 miles, an Amsterdam day, a 2,400 kcal
training day. The truck is the same one the VIN demo decodes, so the page and
the demo agree.

Screens are opted into per project through a `shots` array in the Markdown
frontmatter, capped at two so the pair always lays out as a clean 2-up. Each
entry carries its own `alt` and `caption`; the alt describes the screen, the
caption makes the argument, and `shots.test.ts` fails if they are the same
string.

`build-shots.mjs` writes only the screens flagged `featured`, so the unused ones
stay defined — swapping one in later is an edit rather than a redraw — without
being committed as images. `node tools/build-shots.mjs --all` renders everything
to look at them.

The corner radius is authored as `14% / 6.5%` rather than a fixed length. The
two percentages resolve against width and height separately and land on a true
circle for this aspect ratio, so the corner stays right at any rendered size; a
fixed `rem` goes square on a phone and blobby on a wide screen.

### The backdrop

`Backdrop.astro` is the floating-shapes animation carried over from the original
site — shapes drift upward, rotate, and morph from square to circle as they fade.
Three things about it are load-bearing:

- The mass is pushed to the outer thirds so nothing large drifts through the
  reading column on a wide screen. Only the small motes cross the middle.
- The morph animates `border-radius`, which the compositor cannot accelerate, so
  each shape re-rasters per frame. That is free at ten small solid shapes and
  measurably is not at fifty; a test caps the count.
- Under `prefers-reduced-motion` the layer is removed rather than paused, since
  the global "kill all animation" rule would otherwise strand the shapes
  mid-flight at whatever opacity they held.

Shape positions, sizes and timings are a plain array at the top of the component.
`peak` scales each shape's opacity down as its size goes up.

### The avatar

`Avatar.astro` renders a monogram by default. Drop a square image at
`src/assets/avatar.jpg` (or `.png`/`.webp`) and it is picked up automatically —
no other edit needed.

### Fonts

Self-hosted from Fontsource but declared by hand in `global.css` rather than
imported, because importing the Fontsource stylesheets pulls in cyrillic, greek
and vietnamese `@font-face` rules whose files get emitted into `dist/` and never
fetched. Latin only, and both faces are preloaded in `Base.astro` from the same
files.

## Testing

`npm test` runs Vitest. `tests/global-setup.ts` builds the site and starts a
preview server on port 4322 once for the whole run.

| File                  | Checks                                                             | How                           |
| --------------------- | ------------------------------------------------------------------ | ----------------------------- |
| `structure.test.ts`   | markup, metadata, content shape                                    | parses `dist/` with linkedom  |
| `layout.test.ts`      | centring, measure, overflow, tap targets                           | real browser, computed styles |
| `theme.test.ts`       | default, system preference, persistence, no flash                  | real browser                  |
| `a11y.test.ts`        | AA contrast in both themes, focus, landmarks                       | real browser                  |
| `backdrop.test.ts`    | decorative layer is inert, clipped, behind text, reduced-motion    | real browser                  |
| `navigation.test.ts`  | swap is client-side, theme and backdrop survive it, prefetch fires | real browser                  |
| `vin.test.ts`         | check digit, charset, sections, model year, origin                 | pure, no browser              |
| `maintenance.test.ts` | applicability filter, and what it refuses to rule out              | pure, no browser              |
| `vin-demo.test.ts`    | offline decode, graceful vPIC failure, keyboard operation          | real browser                  |
| `og.test.ts`          | one card per project, right size, referenced absolutely            | reads `dist/`                 |
| `shots.test.ts`       | alt text, reserved space, stacking, no unused image committed      | `dist/` + real browser        |

Contrast is measured on the **rendered** output rather than the token list, so a
correct token applied to the wrong surface still fails. Colours are resolved
through a 1×1 canvas because Chrome reports authored `oklch()` values back
verbatim, and reading those three numbers as RGB silently produces nonsense.

Browser tests each get their own browser context; sharing one leaks
`localStorage` between tests and makes the theme cases pass or fail depending on
order.

## Tools

```bash
node tools/build-og.mjs     # regenerate public/og.png and public/og/<slug>.png
node tools/build-shots.mjs  # regenerate the featured app screens
node tools/build-shots.mjs --all       # every screen, including the unused ones
node tools/build-shots.mjs vehicle     # just the screens whose name starts with this
node tools/render-icon.mjs  # rasterize the Vehicle Tracker SVG icon to PNG
node tools/shoot.mjs / 1280 light /tmp/shot.png   # screenshot; BASE_URL targets a deploy
```

`build-shots.mjs` drives Chrome through Puppeteer rather than its `--screenshot`
flag: combining `--window-size` with `--force-device-scale-factor` yields a CSS
viewport measured in device pixels, which silently drops whatever is anchored to
the bottom of the layout — the tab bar, in this case.

OG cards are committed rather than generated in CI: rendering them needs a Chrome
binary, and the deploy workflow should not have to install one to publish a copy
change. Re-run `build-og.mjs` after editing any project's `title` or `tagline` —
`og.test.ts` will catch a missing card, but not a stale one.

## Deployment

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds with
`withastro/action@v6` and publishes via `actions/deploy-pages@v5`. This requires
the repository's Pages source to be set to **GitHub Actions** rather than
"Deploy from a branch".
