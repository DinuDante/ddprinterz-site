# DDPrinterZ

Static website for DDPrinterZ, a custom 3D-printing studio in Bhubaneswar,
Odisha.

- Live site: <https://dinudante.com/>
- Audit resolution and open owner decisions: [`AUDIT.md`](AUDIT.md)
- Image provenance and what each photograph shows: [`ASSET_MANIFEST.md`](ASSET_MANIFEST.md)
- Test results, environment limits and release steps: [`QA_REPORT.md`](QA_REPORT.md)
- Creative direction and continuation notes: [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)

## The root HTML and CSS are generated — do not edit them

`index.html`, `services.html`, `work.html`, `privacy.html`,
`order-policy.html`, `404.html`, `style.css`, `sitemap.xml` and `robots.txt` are
all written by `build.js`. Editing them directly works until the next build,
which silently overwrites the change.

Edit these instead:

| Source | Holds |
|---|---|
| `src/data.json` | All content — business details, projects, services, pricing, videos, FAQ |
| `src/templates/_layout.html` | The shared shell: head, header, footer, floating contact button |
| `src/style.css` | All styles, including the theme tokens |
| `src/app.js` | Theme toggle, menu, gallery viewer, video loading, hash correction |
| `build.js` | Page composition and per-page copy |
| `tools/build-images.js` | Every image crop and responsive derivative |

Originals live in `assets/_originals/` and are the only input to the image
build. They are never overwritten, and `robots.txt` keeps them out of search
indexes.

## Commands

```
npm install            # build and QA tooling only; the published site ships no dependencies
npm run build          # images + pages  (build:pages to skip the slow image step)
npm run serve          # preview on http://localhost:4173
npm run check          # links, assets, hash targets, metadata
npm run qa             # responsive, interactions, accessibility, performance

node tools/qa-overlay-contrast.js   # text over photographs, sampled from pixels
node tools/qa-float-overlap.js      # floating button never traps a control
```

Expect 0 failures from every suite. `npm run build` must be re-run after any
change under `src/`, and the generated files committed with it.

## Deployment

GitHub Pages serves the repository root of `main`, with `CNAME` set to
`dinudante.com`. There is no Actions workflow, so **pushing to `main` publishes
immediately.** Release steps and the pre-release smoke check are in
[`QA_REPORT.md`](QA_REPORT.md).
