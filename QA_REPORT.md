# DDPrinterZ / dinudante.com — QA report

**Build:** `node tools/build-images.js && node build.js`, asset version `f803e5a0`
**Environment:** Chrome 140 headless (`puppeteer-core` 24), Windows 11, Node 24.19
**Target:** local build served by `tools/serve.js` at `http://localhost:4173`
**Deployment status:** **not deployed.** Verified as a local build only. Release
steps are at the end of this document.

Run everything with:

```
npm run build          # images + pages
npm run check          # links, assets, hash targets, metadata
npm run qa             # responsive, interactions, accessibility, performance
node tools/qa-overlay-contrast.js    # text over photographs
node tools/qa-float-overlap.js       # floating button vs. controls
```

---

## Results

| Suite | Checks | Result | What it covers |
|---|---|---|---|
| `tools/check.js` | 6 pages | **0 failures, 0 warnings** | Every internal link, first-party asset, hash target, title, description, canonical |
| `tools/qa.js` | 210 | **210 pass, 0 fail** | 6 pages × 16 viewports × 2 themes overflow; gallery row heights; computed contrast |
| `tools/qa-interactions.js` | 69 | **69 pass, 0 fail** | Every control a visitor can operate |
| `tools/qa-a11y.js` | 12 page/theme scans | **0 violations** | axe-core, WCAG 2.0/2.1/2.2 A+AA plus best-practice |
| `tools/qa-overlay-contrast.js` | 8 | **0 failures**, worst 17.14:1 | Text on photographs, sampled from rendered pixels |
| `tools/qa-float-overlap.js` | 36 | **36 pass, 0 fail** | Floating button never permanently covers a control |
| `tools/qa-perf.js` | 4 pages | LCP 824–2036ms, CLS 0 | Measured LCP, FCP, request count, transfer weight |

### Responsive — 192 checks, no horizontal overflow anywhere

Widths tested: **320, 360, 375, 390, 430, 671, 768, 820, 900, 1024 (short
laptop, 640 high), 1280, 1363, 1440, 1920, 2560** and **844 × 390 phone
landscape**, each in both themes. The 671–900 range around the menu breakpoint
is covered by four separate widths rather than a single phone-and-desktop pair.

No page-level horizontal overflow at any width. This is verified by comparing
`scrollWidth` against `clientWidth` and naming the offending element on failure —
not concealed by `overflow-x: hidden`, which appears nowhere in the stylesheet.

Also passing: 200% zoom on four pages, `prefers-reduced-motion` honoured with the
Watch anchor still functional, and 44px minimum touch targets at 390px on the
home, work and services pages.

**No console errors and no failed requests.** Each of the 192 page loads attaches
listeners for `console` errors, `pageerror` and `requestfailed`, and records a
failure if any fires. No such record exists in `tools/qa-results.json`, so every
page loads clean in both themes at every width — no broken images, no dead
first-party requests.

### Gallery — the original collapse cannot recur

| Width | Tiles | Height range |
|---|---|---|
| 320 | 9 | 437–458px |
| 671 | 9 | 463–484px |
| 900 | 9 | 440–440px |
| 1363 | 9 | 434–456px |
| 1920 | 9 | 434–456px |

All nine render at full height at every width — against the 2px tiles the audit
found. A separate `future-item-counts` check injects **14** tiles and confirms a
minimum height of 456px, so the grid is genuinely count-independent rather than
having had one more row hard-coded.

### Interactions — 69 checks

| Area | Checks | Notable coverage |
|---|---|---|
| Watch anchor | 3 | Direct load, same-page click, cross-page click — each landing clear of the 67px sticky header |
| Other anchors | 3 | `#pricing`, `#order`, `#contact` across pages |
| Lightbox (work) | 18 | Open, focus moves in, scroll locked, enquiry context, full-image fallback, image decodes, prev/next, arrow keys, wrap at end, Escape, scroll restored, body unlocked, focus returns to trigger, Enter to open, close button, backdrop click, touch swipe |
| Lightbox (home) | 5 | Viewer present, opens in page, **does not navigate away**, count matches the 4-item sample, Escape |
| Menu | 7 | Visible on mobile, closed by default, opens, Escape closes, Escape restores focus, closes on link choice, resets on resize |
| Theme | 6 | Toggles, `aria-pressed` accurate, `theme-color` meta updates, persists across pages, invalid stored value handled, storage unavailable handled |
| Video | 6 | No third-party request before play, posters load, stable player box, play creates player, `youtube-nocookie` embed, fallback links |
| Keyboard | 4 | Skip link first, sane tab order, focus style declared, FAQ native disclosure |
| No-JS | 2 | Content and navigation present, gallery falls back to image links |
| External handoffs | 4 | Handoff inventory, WhatsApp number consistent, **prefill does not auto-send**, `target="_blank"` safety |
| Touch targets | 3 | 390px on home, work, services |
| Zoom 200% | 4 | Home, work, services, order policy |
| Reduced motion | 2 | Honoured, Watch anchor still works |
| Navigation | 2 | Active state on services and work |

**No enquiry was ever sent.** WhatsApp, Instagram and email handoffs were tested
by inspecting the URL that would open and confirming the prefilled message
requires the visitor to press send.

### Accessibility

axe-core reports **0 violations** across all 6 pages in both themes (36–42
passing rules per page). Four scans return one `color-contrast` item axe cannot
decide, in every case text sitting on a photograph:

- `/` — `.hero__caption`, `.card__tag` (both themes)
- `/services.html` — `.card__tag` on all three service cards (both themes)

axe cannot resolve a background it cannot compute, so these are measured
directly instead. `tools/qa-overlay-contrast.js` screenshots each overlay,
builds a luminance histogram of the rendered pixels and takes a worst-case
background: **17.14:1** for the hero caption and tile zoom affordance, **18.44:1**
for the card tags, against a 4.5:1 requirement. The dark scrim is
theme-independent, which is why both themes measure identically.

Automated scanning cannot certify WCAG conformance — it catches the
machine-detectable subset. Keyboard operation, focus behaviour and visible focus
are covered by the interaction suite above.

### Floating contact button

Below roughly 1320px the content column has no side gutter, so a fixed
bottom-right button always overlaps that column on phones and tablets. That is
acceptable for text, which scrolls past. What is not acceptable is a control
that can never be uncovered.

`tools/qa-float-overlap.js` therefore tests **reachability**, computing it exactly
rather than by sampling scroll offsets: for a control at document offset `d` with
height `h` in a viewport of height `H`, with the button occupying the band
`[H - keepOut, H]`, a scroll position clears it when `d - y + h < H - keepOut`
while the control is still on screen. **36 of 36 pass** across 6 pages × 6 widths.

This found a real defect: at 768px the footer's "Order policy" link sat under the
button at the very end of the document, on every page, with no scroll left to
move it clear. The footer now reserves `--fab-size` plus its gutter, and the link
clears the button by 48px at maximum scroll.

### Performance — measured, not scored

| Page | LCP | CLS | Requests | Transfer |
|---|---|---|---|---|
| `/` | 1236ms | 0 | 7 | 217 KB |
| `/services.html` | 2036ms | 0 | 7 | 366 KB |
| `/work.html` | 1060ms | 0 | 8 | 489 KB |
| `/order-policy.html` | 824ms | 0 | 4 | 73 KB |

Against the project goals of LCP ≤ 2.5s and CLS ≤ 0.1, all four pages pass in the
lab. **CLS is 0** because every image carries explicit `width`/`height` and the
CSS `aspect-ratio` matches the delivered asset.

**Lighthouse was not run**, so no Performance/Accessibility/Best-Practices/SEO
score is claimed. **No field data exists** for this domain, so no 75th-percentile
Core Web Vitals are reported. These are lab measurements from a local server on
one machine; they are not a promise about real-world performance over mobile
networks.

The published site ships no JavaScript dependencies — `src/app.js` is inlined so
there is no separate request that can fail and silently disable navigation.
`sharp`, `puppeteer-core` and `axe-core` are build and QA tooling only.

### SEO and metadata

Verified per page: unique title and description, exactly one H1, canonical URL,
Open Graph and Twitter card tags, and a 1200 × 630 preview. Favicons at 16/32/48
plus an apple-touch-icon are real files and declared in `<head>`. `robots.txt`
allows the site, disallows `/assets/_originals/`, and points to the sitemap. The
sitemap lists the five public routes and excludes the 404 page, which carries
`<meta name="robots" content="noindex">` and returns a genuine 404 status.

`LocalBusiness` structured data uses only established facts — name, description,
URL, image, email, Bhubaneswar/Odisha/IN locality, founder, Instagram and YouTube
profiles. **No street address, opening hours, rating, review, price range or legal
identity was invented**, and no FAQ or other search enhancement is claimed.

---

## Regressions specifically retested

The four defects named in the brief, plus the ones found in this session:

| Regression | Check | Result |
|---|---|---|
| Missing `#watch` target | `watch/direct-load`, `same-page-click`, `cross-page-click` | Pass, header clearance confirmed |
| Gallery row collapse | `gallery/tile-heights-*` at 5 widths + `future-item-counts` | Pass, 9 and 14 tiles |
| Dark theme colours | `contrast/*-night` on 6 pages + axe both themes + pixel sampling | Pass, 0 violations |
| Services overflow | `responsive/services-*` at 16 widths × 2 themes | Pass, no overflow |
| Home gallery left the site | `lightbox-home/does-not-navigate-away` | Pass (was failing) |
| Mobile hero crop | Visual review at 390px; crops bounded to measured object box | Fixed |
| Footer link under float button | `qa-float-overlap` 6 pages × 6 widths | Pass (was failing at 768) |

---

## Environment limits

Stated rather than papered over:

- **Chromium only.** Firefox and WebKit were not available in this environment,
  so no cross-engine testing was performed.
- **No physical devices.** Everything is headless Chrome at set viewport sizes.
  Touch ergonomics, iOS Safari, and real WhatsApp and Instagram app handoff on a
  phone were not observed. Desktop web handoff URLs were verified.
- **Not tested against the live deployment.** All results are from the local
  build. Cache and version-sensitive behaviour on GitHub Pages is unverified.
- **Video playback not asserted.** The player is proven to be created as the
  privacy-enhanced embed with a working external fallback. Whether each video
  plays through is YouTube's to answer, and was not inferred from the presence of
  an iframe or a black frame.
- **Screenshots** for all 6 pages × 5 widths × 2 themes are written to
  `qa-shots/`. They are ~35MB of regenerable evidence and are gitignored;
  `npm run qa` recreates them. The machine-readable results in
  `tools/qa-*.json` are committed instead.

---

## Release steps

Hosting is GitHub Pages serving the repository root of `main` on
`github.com/DinuDante/ddprinterz-site`, with `CNAME` set to `dinudante.com`.
There is no Actions workflow, so **a push to `main` publishes immediately.**

Nothing has been pushed. To release:

1. `npm run build` — regenerate images and pages. Never edit root HTML/CSS by
   hand; `build.js` overwrites it.
2. `npm run check` and `npm run qa` — expect 0 failures.
3. Review `git status`. The working tree also contains the previous session's
   asset reorganisation into `assets/_originals/`; commit it together so the
   originals are preserved in history.
4. Merge or push to `main`.
5. Smoke-check the live site: all 6 routes, `work.html#watch` by direct URL, one
   gallery tile opening the viewer, the theme toggle persisting across a
   navigation, and one video pressing play. Confirm `style.css?v=f803e5a0` is
   being served rather than a cached older version.

**Before release**, settle the five owner decisions in `AUDIT.md` — in particular
the order-policy approval. The page no longer carries a `DRAFT` banner, but
removing a banner is not approval, and it still contains an advance-payment
commitment (the owner's own pre-existing wording) that has not been signed off.
