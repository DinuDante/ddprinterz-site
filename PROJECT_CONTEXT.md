# DDPrinterZ Website — Project Context

Last updated: 20 August 2026

This file is the durable handoff for continuing work after a fresh clone or pull.

## Current state

- Production URL: <https://dinudante.com/>
- Repository: `DinuDante/ddprinterz-site`
- Deployment: GitHub Pages from `main`
- Custom domain: `dinudante.com` via `CNAME`
- Application: dependency-free static site in `index.html`
- Current visual direction: a calm editorial system shared with `dinudante.in`, using moss green, warm ivory, muted purple and restrained red accents
- Public maker name: **DinuDante**. Do not replace it with the legal/personal name in visible website copy.

## Product and content requirements

These existing features must remain operational during future redesigns:

- Instagram ordering: `https://ig.me/m/ddprinterz`
- Instagram profile: `https://www.instagram.com/ddprinterz/`
- WhatsApp ordering: `+91 95567 03560`
- YouTube channel and three playable homepage embeds
- Email contact
- Services, pricing, ordering steps, project gallery, maker section, and contact section
- Mobile navigation and floating WhatsApp action

The site currently positions DDPrinterZ as a maker-direct custom 3D-printing studio in Bhubaneswar, Odisha, offering multicolour gifts, models, decor, PLA/PETG parts, and prototypes.

## Design system

The current design should feel stylish, simple, cinematic, and peaceful rather than loud cyberpunk.

- The navigation includes a day/night theme switch. It follows the visitor's system preference on first visit, remembers later choices in `localStorage`, updates its accessible state, and changes the browser theme colour.
- Both palettes mirror the understated `dinudante.in` visual language: monospace body copy, Georgia-style editorial display type, fine borders, compact radii, low-contrast surfaces, and sparse multicolour accent rules.
- Theme colors are semantic tokens rather than simple inversions. Keep light-mode text and outlined actions at WCAG AA contrast or better, particularly in the gallery footer and image-backed contact panel.
- Action buttons and footer links use the inline SVG symbol set in `index.html` for Instagram, WhatsApp, YouTube, email, project, and external-link icons. Icons are decorative (`aria-hidden`) so accessible names remain concise.

- Background: near-black forest green flowing into ink-purple
- Primary structural colors: deep forest green and aubergine purple
- Supporting colors: warm ivory, muted wisteria, and restrained vermilion red
- Typography: Mincho-style serif stacks for display headings and a clean humanist sans-serif stack for body copy
- Visual references: contemporary anime-film lighting, shoji-inspired geometry, subtle seigaiha texture, and sparse sakura details
- Avoid visible character faces, franchise imitation, stereotypical costumes, excessive neon, fake Japanese writing, and visual clutter
- Preserve generous spacing, rounded cards, subtle borders, and accessible contrast

The active hero image is:

- `assets/hero/anime-zen-maker-v2.jpg`

It depicts an anonymous maker seen from behind in a moonlit Japanese-inspired workshop beside a modern 3D printer. The visible face was intentionally removed. The older `anime-maker-v1.jpg` is historical and is not referenced by the live page.

The navigation logo is a code-native circular maker mon with interlocking green and purple `D` forms and a small vermilion accent. It deliberately avoids fake Japanese lettering. The floating WhatsApp control uses the supplied WhatsApp artwork at `assets/brand/whatsapp.webp` and retains an accessible label.

## Authentic project media

The current gallery uses photographs curated from the supplied local archive:

`/Users/dinu/Documents/DinuDanteWebsites/Media/iCloud Photos from Dinesh Behera.zip`

The ZIP is deliberately not tracked because it is approximately 1 GB and contains Live Photo/video companions. Keep it as the untouched high-resolution source archive.

Nine representative photographs are published in `assets/gallery/`:

- Anime wall art
- Articulated dragon
- Wedding keepsakes
- Classical dance figurine
- Sakura bookmark
- Blossom jewellery box
- Detailed car model
- Charging dock
- Phone stand

Each photograph has:

- A sharper approximately 1200px version for larger/high-density screens
- A `-640.jpg` derivative for smaller screens
- Explicit dimensions and descriptive alternative text
- Responsive `srcset`/`sizes` markup

All gallery photographs except the first are lazy-loaded. Preserve this strategy so the homepage does not download the full gallery during initial rendering.

The service cards use theme-treated versions of authentic DDPrinterZ photographs rather than synthetic product concepts:

- `assets/services/personalised-real.webp` — real red/black/white Japanese-inspired wall pieces
- `assets/services/functional-real.webp` — real orange/white honeycomb phone stand
- `assets/services/expressive-real.webp` — real classical dance figurine

These images preserve the supplied printed objects while replacing distracting workshop backgrounds and adjusting presentation lighting. Do not describe them as new or different physical products.

The contact panel uses `assets/projects/contact-blossom-real.webp`, a theme-treated version of the authentic green blossom jewellery box. Its composition leaves dark negative space for the contact copy and buttons.

## Infographics

Two generated, text-free visual explainers are integrated into the page, with accessible and editable labels provided in HTML:

- `assets/infographics/making-process.webp` — idea, modelling, printing, and hand-finishing journey
- `assets/infographics/material-guide.webp` — PLA gift/decor use versus PETG functional-part use

The services section also has a code-native four-stage information rail: source reference, design/material check, colour/print setup, and finishing/delivery.

## Video media

The homepage embeds real DDPrinterZ YouTube Shorts using privacy-enhanced `youtube-nocookie.com` URLs. Current video IDs include:

- `GrVqXOJHH-E` — stackable blossom jewellery box
- `qJx8QoXDi78` — filament-to-product process
- `GqWD6Tv1fzw` — personalized birthday gift

Earlier YouTube-derived stills remain in `assets/projects/`, but the live project gallery now uses the higher-quality supplied photographs in `assets/gallery/`.

## SEO and accessibility

The page currently includes:

- Canonical URL
- Open Graph metadata and hero image
- `LocalBusiness` structured data
- Skip link
- Semantic main navigation
- Mobile menu with `aria-expanded`
- Reduced-motion handling
- Explicit image dimensions to limit layout shift
- `rel="noopener noreferrer"` on external new-tab links

Preserve or improve these features during future work.

## Working conventions

- Keep the site static and dependency-free unless a future requirement genuinely needs a build system.
- Do not use stock photography as DDPrinterZ work.
- Do not fabricate testimonials, reviews, certifications, or project claims.
- Use authentic archive images and real DDPrinterZ video content.
- Optimize new media before committing it.
- Keep full-resolution source archives outside the deployed repository.
- Run `git diff --check` and verify all local image paths before each push.
- After pushing, confirm the GitHub Pages Actions run succeeds and that the live site serves the changed asset.

## Repository layout

```text
DDPrinterZ/
├── CNAME
├── PROJECT_CONTEXT.md
├── index.html
└── assets/
    ├── gallery/   # Responsive authentic project photography
    ├── hero/      # Anime hero artwork
    ├── infographics/ # Optimized process and material explainers
    ├── projects/  # Earlier project frames and contact-panel image
    ├── services/  # Theme-treated authentic service-card photography
    └── brand/     # Supplied WhatsApp artwork
```

## Resume checklist

After cloning or pulling:

1. Read this file and `index.html`.
2. Run `git status --short` and confirm the expected branch is `main`.
3. Check `git rev-parse HEAD` against `git rev-parse origin/main` after fetching.
4. Preserve all contact links and conversion paths.
5. Test desktop and mobile behavior after visual changes.
6. Commit scoped changes with a descriptive message and push to `main` only when verified.
