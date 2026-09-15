# DDPrinterZ / dinudante.com — audit resolution

Scope: `/`, `/services.html`, `/work.html`, `/privacy.html`, `/order-policy.html`,
`/404.html`, all anchors, gallery and video interactions, contact handoffs,
shared components, assets, metadata, sitemap and robots file.

Source of findings: `DinuDante_Critical_Website_Audit_2026-09-15.md` and
`AGY_dinudante_com_Production_Prompt.md` (15 September 2026). Desktop
measurements used a 1363 × 936 viewport, matching the original audit.

Canonical sources are `src/data.json`, `src/templates/_layout.html`,
`src/style.css`, `src/app.js` and `build.js`. Every file at the repository root
is generated — `node build.js` rewrites them, so root HTML/CSS is never edited
directly.

---

## The fourteen reported findings

| # | Finding | Status | How it was resolved |
|---|---|---|---|
| 1 | Four gallery tiles collapse to 2px; grid declares two fixed rows with absolutely positioned content | **Fixed** | `.gallery` is now `repeat(auto-fill, minmax(min(250px, 100%), 1fr))` with tiles as ordinary flex columns. No fixed row count, no absolute positioning, so any number of records flows — nine today, more later. |
| 2 | Dark-mode H2s and video titles compute to `rgb(17,22,18)` on a `rgb(13,21,18)` background; a legacy `.work` foreground survives | **Fixed** | The legacy `.work` rule is gone. Themes are one token set on `:root` with a single `:root[data-theme="day"]` override. axe reports 0 contrast violations on all 6 pages in both themes; text over photographs is measured separately (see below). |
| 3 | Every "Watch" link points to `/work.html#watch`, which has no `id="watch"` | **Fixed** | `work.html` has a real `<section id="watch">`. Verified three ways — direct load, same-page click and cross-page click — each landing clear of the 67px sticky header. |
| 4 | `making-process.webp` renders 1440px wide; page scrollWidth reaches 1555px at a 1363px viewport | **Fixed** | The oversized infographic is removed entirely and the process is now four code-native step cards that reflow and stay readable at 320px. No page-level horizontal overflow at any of 16 tested widths. |
| 5 | Material illustration takes 760px while the whole price list is squeezed into ~288px, rows up to 162px tall | **Fixed** | Pricing is rebuilt as a dominant left-hand price list with right-aligned prices, and compact material/quote-factor cards beside it. The illustration no longer competes with the prices. |
| 6 | `wedding-tokens.jpg` shows anime wall art; `charging-dock.jpg` shows DinuDante name pieces | **Fixed** | All nine images were opened and inspected as pixels. Records were relabelled to match what the photographs actually show, rather than captions forced onto the wrong files. No genuine work was dropped. See `ASSET_MANIFEST.md`. |
| 7 | Activating a gallery tile navigates the tab to the raw JPG | **Fixed** | An accessible `<dialog>` viewer with labelled close/prev/next, Escape, focus containment, focus restore, scroll lock and a context-carrying enquiry action. **This was still open on the home page** when this session resumed — its four-project sample used the same `.tile` markup with no dialog, so those tiles fell through to the raw JPG. Now fixed and covered by a regression check. |
| 8 | Services and Our work have no H1 | **Fixed** | Both pages have an H1, an eyebrow, a lead paragraph, an active navigation state and closing next-step actions. |
| 9 | Keychains from ₹149 and nameplates from ₹399 against a stated ₹400 minimum order — applicability unclear | **Clarified, one owner decision open** | The minimum is presented as an order **value**, with a `₹400 min. order applies` badge beside exactly the two items priced below it, plus a note that such items are quoted as part of an order reaching the minimum. The prices themselves were not changed. See open decisions. |
| 10 | Hero said "Same-week delivery" while elsewhere the site said 2–5 days | **Fixed** | The hero now says "Typically printed in 2–5 days". Production, dispatch and shipping are separated in wording throughout, and the policy page states plainly that production time is not a delivery promise and that carrier time is not guaranteed. |
| 11 | `/order-policy.html` publicly says `DRAFT — pending owner review` while containing commercial commitments | **Partly resolved — approval is the owner's to give** | The page is now coherent customer-facing copy built from the owner's own existing wording. Cancellation, refund and replacement terms are **not** invented: the page says they are not published here and are confirmed in writing with each quote. The `DRAFT` banner is gone, but removing a banner does not constitute approval — the terms still need the owner's sign-off. See open decisions. |
| 12 | `logo.png` is 1254 × 1254 / 1,833,082 bytes for a ~39px header image; no favicon declarations | **Fixed** | The approved portrait is preserved in `assets/_originals/` and now ships as `logo-40/80/120/180.png` (2.4–16.6 KB) plus `favicon-16/32/48.png`, all declared in `<head>` with an apple-touch-icon. The header image is 2.4 KB at 1x. |
| 13 | .com uses WhatsApp `+91 9556703560`; .in uses `+91 9040632014` — possibly deliberate separation | **Preserved, not changed — owner confirmation open** | The existing .com number is kept exactly as it was; the other site's number was **not** copied across. Instagram `ddprinterz`, YouTube `@DDPrinterZ` and `dineshdante.ds@gmail.com` are consistent on every page. The destination still wants owner confirmation. See open decisions. |
| 14 | Existing successes to preserve (5 routes at 200, assets reachable, theme toggle works, robots and sitemap exist) | **Preserved and extended** | All 6 routes build and serve; `tools/check.js` reports 0 failures and 0 warnings across 6 pages; the theme toggle updates state, label and `theme-color`, and persists across navigation. The audit explicitly had not proven video playback, app handoffs or mobile-menu behaviour — those are now tested directly. |

---

## Defects found in this session, beyond the original list

These were not in the audit. They were found by inspecting the work rather than
trusting it.

1. **Home-page gallery had no viewer.** `lightbox: true` was set only for
   `work.html`, so the home page rendered four `.tile[data-full]` anchors with
   no `<dialog>` to intercept them. Clicking one left the site for the raw JPG —
   the original finding #7, still live on the most-visited page. The existing
   interaction suite passed because it only ever tested `/work.html`. Fixed, and
   five `lightbox-home` checks now cover it.

2. **The mobile hero crop sliced the middle out of the product.** Measured from
   the pixels, the stand occupies x 62–895, y 152–1143 of the 900 × 1200
   original. The mobile crop was `[0, 300, 900, 600]` — cutting 148px off the top
   and 243px off the bottom — and `@media (max-width: 960px)` then forced
   `aspect-ratio: 16 / 10` with `object-fit: cover`, compressing it further into a
   band. On a phone the hero no longer read as a phone stand at all, and the
   caption covered what was left. Both crops now contain the whole object and the
   mobile CSS ratio matches the mobile asset.

3. **The same forced `16 / 10` ratio cropped the maker photo**, a 4:5 portrait of
   the studio's own name keyrings, into a thin landscape strip on mobile. The
   override is removed; it keeps its natural proportions.

4. **The floating WhatsApp button permanently covered a footer link.** Because
   the content column has no side gutter below roughly 1320px, a fixed
   bottom-right button always overlaps that column on phones and tablets. That is
   tolerable for text, which scrolls past, but at 768px the footer's "Order
   policy" link sat under the button at the very end of the document with no
   scroll left to move it clear — on all six pages. The footer now reserves the
   button's height plus its gutter (`--fab-size`), and the link clears it by 48px
   at maximum scroll. `tools/qa-float-overlap.js` proves every control on every
   page at six widths can be brought clear.

5. **`Last reviewed 15 September 2026`** implied a review that has not been
   established. Changed to `Last updated`, which is what is actually true.

6. **The asset manifest was incomplete** — brand logo variants, favicons and the
   social preview were generated but never recorded in `tools/image-build.json`.
   Now recorded.

7. **Two QA tools reported less than they knew.** The accessibility scan stored
   only a *count* of checks axe could not decide; it now records which rule and
   which elements, which is what makes the overlay-contrast measurements
   traceable. (A first version of the float-overlap check also produced false
   positives of its own — it sampled scroll positions too coarsely to find the
   offsets that clear a tall element, and then rejected a single-point scroll
   range on a strict inequality. It now solves reachability exactly.)

---

## Open decisions — owner only

These are deliberately unresolved. Each one is a commercial or factual matter
that cannot be settled from the repository, and none has been invented to close
a checklist.

1. **Order-policy approval.** The page reads as finished customer-facing copy and
   carries no draft banner, but the owner has not signed it off in anything
   available here. The advance-payment sentence ("A small advance is required to
   start the print, with the balance due on completion or delivery") is the
   owner's **own pre-existing wording**, carried over from the previous draft
   verbatim, not written by this work — but it is still an unapproved commercial
   commitment. Confirm it, amend it, or remove it.

2. **Cancellation, refunds and replacements.** Not published, by choice. The page
   says they are confirmed in writing with each quote. If the owner wants them
   public, they must supply the actual terms; nothing was drafted on their behalf.

3. **Minimum order — exact definition.** Implemented as a ₹400 minimum *order
   value*, which is the reading most consistent with the existing copy. If the
   intent is per item, or applicable only to some categories, or waived for local
   handover, the wording in `src/data.json` and the pricing note need one edit.

4. **WhatsApp destination.** `+91 9556703560` is preserved from the existing .com
   site. The .in portfolio's `+91 9040632014` was deliberately **not** propagated.
   This is the *weakest* of the open items: `PROJECT_CONTEXT.md` — the
   repository's own durable handoff — lists "WhatsApp ordering: `+91 95567
   03560`" under features that must remain operational, so the number is
   documented in the project, not merely inherited. It is listed here only
   because a repository note is not the same as the owner confirming the live
   destination today. A single test message from the owner's own phone settles
   it.

5. **Advance amount.** The policy says the amount is stated in each quote. If a
   standard percentage exists, it is not recorded anywhere in this repository.

---

## Not verified here — and why

Reported as unavailable rather than assumed:

- **Real device testing.** All results come from headless Chrome at set viewport
  sizes. No physical phone or tablet was used, so touch ergonomics, iOS Safari
  behaviour and real WhatsApp/Instagram app handoff were not observed.
- **Firefox and WebKit.** Only Chromium was available in this environment.
- **Live deployment.** Everything was verified against the local build at
  `http://localhost:4173`. Nothing has been pushed; see `QA_REPORT.md` for
  release steps.
- **Lighthouse scores.** Not run. Directly measured LCP, CLS and transfer weight
  are reported in `QA_REPORT.md` instead of an unverified score.
- **Field Core Web Vitals.** No field data exists for this domain, so only lab
  measurements are given.
- **Video playback.** The player is proven to be created, to be the
  privacy-enhanced `youtube-nocookie` embed, and to carry a working external
  fallback link. Whether each video actually plays through depends on YouTube and
  was not asserted from a black frame or the presence of an iframe.
- **Enquiry delivery.** No message was ever sent. WhatsApp, Instagram and email
  handoffs were checked by inspecting the URL that would open and confirming the
  prefill does not auto-send.
