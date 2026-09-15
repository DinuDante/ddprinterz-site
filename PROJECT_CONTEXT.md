# DDPrinterZ Website — Project Context

Last updated: 15 September 2026

This file is the durable handoff for continuing work after a fresh clone or
pull. It replaces a version dated 20 August 2026 that described a single-page
site, an anime hero image, two infographics and a gallery labelled from
filenames — all of which have since changed. See [`AUDIT.md`](AUDIT.md) for why.

## Current state

- Production URL: <https://dinudante.com/>
- Repository: `DinuDante/ddprinterz-site`
- Deployment: GitHub Pages from `main`, no Actions workflow — **a push to `main`
  publishes immediately**
- Custom domain: `dinudante.com` via `CNAME`
- Public maker name: **DinuDante**. Do not replace it with the legal or personal
  name in visible website copy.

### Architecture — read this before editing anything

The site is six generated pages, not a single hand-edited file. `index.html`,
`services.html`, `work.html`, `privacy.html`, `order-policy.html`, `404.html`,
`style.css`, `sitemap.xml` and `robots.txt` are **all output**. `build.js`
overwrites them. Edit `src/data.json`, `src/templates/_layout.html`,
`src/style.css`, `src/app.js`, `build.js` or `tools/build-images.js` instead, and
re-run `npm run build`. See [`README.md`](README.md) for the full table.

The published site is still dependency-free — `src/app.js` is inlined into every
page, so there is no script request that can fail and disable navigation, and
everything degrades to working HTML without JavaScript. `sharp`,
`puppeteer-core` and `axe-core` are build and QA tooling only.

## Product and content requirements

These must remain operational through any future redesign:

- Instagram ordering: `https://ig.me/m/ddprinterz`
- Instagram profile: `https://www.instagram.com/ddprinterz/`
- WhatsApp ordering: `+91 95567 03560` — this is the **.com** number. The
  separate `dinudante.in` portfolio uses `+91 9040632014`; the split appears
  deliberate. Do not copy one site's number to the other.
- Email: `dineshdante.ds@gmail.com`
- YouTube channel `@DDPrinterZ` and the three real Shorts (IDs below)
- Services, pricing, ordering steps, project gallery, maker section, contact
  section
- Mobile navigation and the floating WhatsApp action
- Day/night theme switch: follows the system preference on first visit, remembers
  the choice in `localStorage` under `ddprinterz-theme`, tolerates an invalid or
  unavailable store, updates its accessible label and the browser theme colour

## Design system

The direction set by `AGY_dinudante_com_Production_Prompt.md` supersedes the
earlier "shared editorial language with dinudante.in" note, which called for
monospace body copy. Premium presentation must not be confused with low
contrast, huge empty regions, forced full-screen sections or motion-heavy
browsing.

- Confident typography on calm neutral surfaces, with controlled colour. A
  readable sans-serif carries body and interface text; expressive serif is
  reserved for limited roles such as the maker quote. **Not** dense monospace.
- The real print colours supply most of the personality — orange, green, red
  objects against neutral surfaces.
- Both themes are one semantic token set on `:root` with a single
  `:root[data-theme="day"]` override. Do not reintroduce a per-component
  foreground override: a stale `.work` rule is exactly what made dark-mode
  headings near-invisible before.
- The approved portrait logo stays small and crisp beside the DDPrinterZ
  wordmark. It ships as `logo-40/80/120/180.png`, never the 1.83 MB original.
- Icons are one inline SVG sprite, decorative (`aria-hidden`) so accessible names
  stay concise.
- Touch targets: 44px is the project minimum (`--tap`).
- No visible franchise character faces in *generated* artwork, no fake Japanese
  lettering, no visual clutter.

## Authentic project media

The untouched high-resolution source archive stays outside the repository:

`/Users/dinu/Documents/DinuDanteWebsites/Media/iCloud Photos from Dinesh Behera.zip`

(~1 GB, includes Live Photo companions.) Keep it untracked.

Working originals live in `assets/_originals/` (20 files) and are the **only**
input to `tools/build-images.js`. They are never overwritten, and `robots.txt`
disallows `/assets/_originals/`.

**Filenames in that folder are not reliable descriptions of their contents.**
Three were provably wrong, and the old gallery labels in the previous version of
this file were derived from them, which is how anime wall art came to be
published as "Wedding keepsakes". Always inspect the pixels.
[`ASSET_MANIFEST.md`](ASSET_MANIFEST.md) records what each file actually shows.

The nine published gallery records are: honeycomb phone stand, script name
keyrings, bow-trimmed keepsake box, classical dance figurine, blossom bookmark,
winged dragon figure, car model underside, layered logo wall panel, layered
figure wall panel. There is no "Wedding keepsakes" or "Charging dock" record,
because no photograph of either exists — do not re-add a label without an image.

Derivatives are 480/800/1200 WebP + JPEG at a consistent 4:5 frame (the old
`-640.jpg` scheme is gone). Only the hero and the first gallery tile are eager
with `fetchpriority="high"`; everything else is lazy. The 1200px variants are
viewer-only and are never fetched on page load — preserve this, or page weight
triples.

The making-process stages and the material comparison are **code-native HTML**.
They replaced `making-process.webp` (1440px, overflowed the page to 1555px
scrollWidth) and a material illustration that squeezed the price list to 288px.
Do not reintroduce them as images.

## Video media

Three real DDPrinterZ Shorts on `/work.html#watch`, poster-first: nothing is
requested from YouTube until the visitor presses play, and then it is a
privacy-enhanced `youtube-nocookie.com` embed with a descriptive iframe title.
Each card keeps a visible "Watch on YouTube instead" fallback.

- `GrVqXOJHH-E` — stackable blossom jewellery box
- `qJx8QoXDi78` — filament-to-product process
- `GqWD6Tv1fzw` — personalised birthday gift

Do not invent new "latest" videos. Posters are frames from these videos and are
verified against their titles.

## SEO and accessibility

Per page: unique title and description, exactly one H1, canonical URL, Open
Graph and Twitter tags, a real 1200 × 630 preview at
`assets/social/og-default.jpg`, and declared favicons at 16/32/48 plus an
apple-touch-icon. `404.html` is `noindex` and excluded from the sitemap.

`LocalBusiness` structured data carries **verified facts only** — no street
address, opening hours, rating, review, price range or legal identity. No FAQ or
other search enhancement is claimed.

Target is WCAG 2.2 AA. Current state: 0 axe violations across 6 pages in both
themes. Text sitting on photographs cannot be judged by axe and is measured from
rendered pixels by `tools/qa-overlay-contrast.js` — keep that passing when
touching any overlay.

## Working conventions

- Never edit generated root files; edit `src/` and rebuild.
- Keep the published site dependency-free.
- Do not use stock photography as DDPrinterZ work.
- Do not fabricate testimonials, reviews, certifications, ratings, delivery
  promises or project claims.
- Do not present generated imagery as evidence of prints, customers, equipment
  or capability. If a needed photograph does not exist, record the gap — do not
  fill it with something unrelated.
- Distinguish production time from dispatch and delivery. "Typically printed in
  2–5 days" is a production statement, not a delivery guarantee.
- Never publish policy terms the owner has not approved. Removing a `DRAFT`
  banner is not approval. Open decisions are listed in [`AUDIT.md`](AUDIT.md).
- Do not conceal layout defects with blanket `overflow-x: hidden`; it appears
  nowhere in the stylesheet and should stay that way.
- Optimise new media through `tools/build-images.js` rather than by hand.
- Run `npm run check` and `npm run qa` before any push; expect 0 failures.
- Never send a real enquiry as a production test.

## Repository layout

```text
ddprinterz-site/
├── CNAME  README.md  PROJECT_CONTEXT.md
├── AUDIT.md  ASSET_MANIFEST.md  QA_REPORT.md
├── build.js                 # page generator — writes every root .html/.css
├── package.json
├── src/
│   ├── data.json            # all content
│   ├── templates/_layout.html
│   ├── style.css
│   └── app.js
├── tools/
│   ├── build-images.js      # crops + responsive derivatives
│   ├── serve.js  check.js
│   ├── qa.js  qa-interactions.js  qa-a11y.js  qa-perf.js
│   ├── qa-overlay-contrast.js  qa-float-overlap.js
│   └── *.json               # committed results + image manifest
├── assets/
│   ├── _originals/          # owner originals, never overwritten, noindex
│   ├── gallery/  hero/  services/  video/  brand/  social/
└── (generated) index.html services.html work.html privacy.html
    order-policy.html 404.html style.css sitemap.xml robots.txt
```

`qa-shots/` holds ~35MB of regenerable QA screenshots and is gitignored.

## Resume checklist

1. Read this file, [`AUDIT.md`](AUDIT.md) (especially the open owner decisions)
   and [`QA_REPORT.md`](QA_REPORT.md).
2. `git status --short`; confirm the branch and that generated files are in sync
   with `src/` — if unsure, run `npm run build` and check the diff is empty.
3. `git fetch` then compare `git rev-parse HEAD` against `origin/main`.
4. `npm install && npm run build && npm run check && npm run qa` — expect 0
   failures before changing anything.
5. Preserve every contact link and conversion path.
6. Re-run the suites after visual changes, and inspect the actual rendered pages
   at mobile and desktop in both themes. A passing HTTP request proves nothing
   about a gallery, an anchor or a player control.
7. Commit scoped changes with a descriptive message. Push to `main` only when
   verified, and only with the owner's go-ahead — the push is the publish.
