# DDPrinterZ asset manifest

Every image shipped by dinudante.com, with its provenance and what it actually
depicts. **Filenames were treated as unreliable.** Each source was opened and
inspected as pixels, and several records were relabelled to match the
photograph rather than the other way round.

Originals are never overwritten. They live in `assets/_originals/` (20 files,
excluded from search indexing by `robots.txt`) and are the only input to
`tools/build-images.js`, which derives every responsive variant. Crops,
brightness and quality live in that file, so any derivative can be rebuilt with
`node tools/build-images.js`.

- **Rights and provenance:** all photographs are the owner's own, taken in the
  DDPrinterZ studio in Bhubaneswar. Video posters are frames from DDPrinterZ's
  own YouTube Shorts. No stock imagery, no renders presented as finished work,
  and no generated imagery depicting prints, customers, equipment or capability.
- **Authenticity:** normalisation is limited to crop, mild brightness and
  quality settings. Print characteristics — layer lines, support marks, surface
  texture — are deliberately left visible. Nothing was retouched to imply a
  finish that was not achieved.
- **Delivery:** WebP first with a JPEG fallback, explicit `width`/`height` on
  every `<img>`, `srcset`/`sizes` per placement, `loading="eager"` plus
  `fetchpriority="high"` on the hero and first gallery tile only, everything
  else lazy.

---

## Corrections made after inspecting pixels

| Owner original | What the file name implied | What the pixels actually show | Record now |
|---|---|---|---|
| `wedding-tokens.jpg` | Wedding keepsakes | A round layered wall panel in red, cream and black with raised Japanese lettering | `anime-logo-panel` — "Layered logo wall panel" |
| `anime-wall-art.jpg` | Anime wall art | A rectangular framed relief of a standing figure in a red patterned coat | `anime-figure-panel` — "Layered figure wall panel" |
| `charging-dock.jpg` | Charging dock | A pair of "DinuDante" script keyrings on a textured print bed | `name-keychains` — "Script name keyrings" |

No genuine work was removed to make the labels fit. There is no longer a
"Wedding keepsakes" or "Charging dock" record, because no photograph of either
exists in the owner's originals — inventing one would have meant publishing a
product claim with no evidence behind it.

The two wall panels and the dragon figure depict third-party characters. Their
captions describe form, colour and construction and avoid asserting any licence
or affiliation.

### Gallery — nine verified prints

| Slug | Owner original | Subject confirmed in pixels | Caption shown | Derivatives | Largest file |
|---|---|---|---|---|---|
| `phone-stand` | `phone-stand.jpg` | Honeycomb phone stand | Functional · Two-colour PLA · folding tray | 480/800/1200 webp+jpg | 162 KB |
| `name-keychains` | `charging-dock.jpg` | Script name keyrings | Personalised · Two-colour lettering · pair | 480/800/1200 webp+jpg | 361 KB |
| `blossom-jewellery-box` | `blossom-jewellery-box.jpg` | Bow-trimmed keepsake box | Décor · Lidded box · rose handle | 480/800/1200 webp+jpg | 138 KB |
| `dance-figurine` | `dance-figurine.jpg` | Classical dance figurine | Models · Fine detail · single colour | 480/800/1200 webp+jpg | 177 KB |
| `sakura-bookmark` | `sakura-bookmark.jpg` | Blossom bookmark | Personalised · Three colours · held in hand for scale | 480/800/1200 webp+jpg | 190 KB |
| `dragon-figure` | `dragon-figure.jpg` | Winged dragon figure | Models · Multicolour · green eyes, red tail fin | 480/800/1200 webp+jpg | 271 KB |
| `car-model` | `car-model.jpg` | Car model underside | Models · Green PLA · printed chassis detail | 480/800/1200 webp+jpg | 220 KB |
| `anime-logo-panel` | `wedding-tokens.jpg` | Layered logo wall panel | Décor · Three colours · stacked relief layers | 480/800/1200 webp+jpg | 235 KB |
| `anime-figure-panel` | `anime-wall-art.jpg` | Layered figure wall panel | Décor · Four colours · framed relief | 480/800/1200 webp+jpg | 254 KB |

All gallery tiles use a consistent 4:5 frame at 800 × 1000, so subject scale
stays even across the grid. The 1200px variant is the viewer image and is
requested only when a tile is opened, which is why page weight stays low even
with nine records. Alt text is per-record in `src/data.json` and describes the
object, its colours and its setting.

The 361 KB on `name-keychains-1200.jpg` is the heaviest single file on the site.
It is a close photograph of a coarse, glittery print bed, which compresses
poorly; it is only ever fetched on demand by the viewer, never on page load.

### Hero — art-directed, measured from the pixels

| Variant | Crop from `phone-stand.jpg` (900 × 1200) | Serves | Largest file |
|---|---|---|---|
| `hero-print` | `[0, 118, 900, 1035]` | above 960px | 185 KB |
| `hero-print-wide` | `[45, 140, 855, 1012]` | 960px and below | 154 KB |

The stand occupies **x 62–895, y 152–1143** in the original, measured by
thresholding the orange pixels rather than estimated by eye. Both crops contain
that whole box: a phone visitor who cannot tell what the object is gets nothing
from the hero. The mobile variant is the deliberate one — it trims desk context
from the left and empty foreground so the object is larger on a small screen,
instead of slicing the middle out of it. `src/style.css` sets the mobile
`aspect-ratio` to `855 / 1012` to match, because a shorter frame would
cover-crop the asset straight back into a band.

### Services, video posters, brand and social

| Slug | Kind | Owner original | Files | Largest file |
|---|---|---|---|---|
| `service-personalised` | service | `charging-dock.jpg` → the name keyrings | 4 | 178 KB |
| `service-functional` | service | `phone-stand.jpg` | 4 | 80 KB |
| `service-decor` | service | `dance-figurine.jpg` | 4 | 79 KB |
| `video-blossom-box` | poster | `youtube:GrVqXOJHH-E` | 4 | 35 KB |
| `video-process` | poster | `youtube:qJx8QoXDi78` | 4 | 42 KB |
| `video-mom-topper` | poster | `youtube:GqWD6Tv1fzw` | 4 | 87 KB |
| `logo` | brand | `logo.png` (1254 × 1254, 1.83 MB, preserved) | 7 | 16 KB |
| `og-default` | social | `phone-stand.jpg` | 1 | 72 KB |

Each service card carries a caption naming the real print it shows — "Real
DDPrinterZ print: two-colour script name keyrings" — so an illustrative choice
is never mistaken for a claim about a specific commission.

Posters were verified against their video titles: the green bow-trimmed box
matches "Stackable blossom jewellery box", the printed tag matches "From
filament to finished product", and the cake with a printed topper matches
"A personalised birthday gift for Mom". The middle poster carries a decorative
black border baked into the owner's own thumbnail; it is not letterboxing, and
the poster does fill its frame.

Brand derivatives replace a 1,833,082-byte original that was being scaled down
to roughly 39px in the header. The portrait itself is unchanged and preserved —
only delivery sizes were added: `logo-40` (2.3 KB) at 1x, `logo-80`/`logo-120`
for 2x and 3x, `logo-180` for apple-touch-icon, and `favicon-16/32/48`
(0.8–2.8 KB) all declared in `<head>`.

The social preview is generated at exactly 1200 × 630 from a real print, with
the DDPrinterZ wordmark, the portrait, the proposition and the domain — readable
at card size and specific to this domain rather than a cropped photograph.

### Maker section

The maker image is the studio's own `name-keychains` photograph, captioned
**"A DDPrinterZ print, not a portrait: the studio's own name keyrings."** It is
labelled as work precisely so it is not mistaken for a founder portrait. It
keeps its natural 4:5 proportions at every width.

### Code-native by choice

The making-process stages and the material comparison are HTML and CSS, not
images. They replace a 1440px infographic that overflowed the page and a
material illustration that was crowding out the prices. As text they reflow to
320px, stay readable at 200% zoom, are searchable, and cannot imply
environmental, waterproof, heat or strength guarantees that have not been
established. UI iconography is a single inline SVG sprite.

### Unresolved asset needs

Recorded rather than filled with something unrelated:

- **No workshop or equipment photograph.** Nothing on the site depicts the
  workspace or the printers, because no verified photograph of either exists in
  the originals. The earlier anime maker illustration was retired rather than
  presented as documentary evidence of a workshop.
- **No wedding or event commission photograph.** The former "Wedding keepsakes"
  record had no matching image. It stays absent until the owner supplies one.
- **No founder portrait in the maker section.** A print stands in, explicitly
  captioned as such.
- **No PLA/PETG sample photograph.** The material comparison is factual text.
  A photograph of real side-by-side samples would strengthen it.
