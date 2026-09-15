/*
 * DDPrinterZ image pipeline.
 *
 * Reads the owner's original photographs from assets/_originals (kept in the
 * repository because they are already small enough) and writes the responsive
 * derivatives the site actually serves.
 *
 * Every crop rectangle below was chosen after visually inspecting the source
 * pixels. Crops, rotation and mild exposure normalisation only: no subject is
 * replaced, recoloured beyond a global exposure/saturation nudge, or composited.
 *
 * Run: node tools/build-images.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = 'assets/_originals';
const OUT_GALLERY = 'assets/gallery';
const OUT_SERVICES = 'assets/services';
const OUT_HERO = 'assets/hero';
const OUT_VIDEO = 'assets/video';
const OUT_BRAND = 'assets/brand';

const ensure = (d) => fs.mkdirSync(d, { recursive: true });

/* Gentle, uniform presentation normalisation applied to every product photo so
 * the gallery reads as one set. Geometry and material finish are untouched. */
function normalise(pipeline, { brighten = 1, saturation = 1.04 } = {}) {
  return pipeline.modulate({ brightness: brighten, saturation }).sharpen({ sigma: 0.6 });
}

async function emit(pipeline, outBase, widths, { height = null, quality = 78 } = {}) {
  const written = [];
  for (const w of widths) {
    const h = height ? Math.round((height / widths[0]) * w) : null;
    const base = pipeline.clone().resize({
      width: w,
      height: h || undefined,
      fit: 'cover',
      kernel: 'lanczos3',
    });
    const webp = `${outBase}-${w}.webp`;
    const jpg = `${outBase}-${w}.jpg`;
    await base.clone().webp({ quality, effort: 6 }).toFile(webp);
    await base.clone().jpeg({ quality: quality + 4, mozjpeg: true, progressive: true }).toFile(jpg);
    written.push(webp, jpg);
  }
  return written;
}

/* ---------------------------------------------------------------------------
 * Gallery: nine verified printed objects.
 * `crop` is [left, top, width, height] in source pixels; ratio is 4:5.
 * ------------------------------------------------------------------------- */
const GALLERY = [
  /* Both panels are photographed twice. In wedding-tokens.jpg the two objects
   * overlap horizontally, so no crop can isolate either one — the old crops
   * each carried a slice of the other panel, and the figure-panel tile showed
   * half the logo panel. In anime-wall-art.jpg they sit apart (logo ends x 555,
   * figure frame starts x 575), so both tiles are cut from that angle instead,
   * each showing only its own subject.
   *
   * Bounds read off a coordinate grid over the original, including the parts
   * that overhang: the logo panel's black tail reaches x 70, and the figure's
   * red flames rise well above its white frame to y 148. Logo panel spans
   * x 70-540, y 265-615; figure panel x 575-868, y 148-838; keyboard above
   * y 150. The figure sits left in its frame because the logo panel occupies
   * everything to its left — the leather to the right is deliberate space, not
   * a centring error. */
  {
    slug: 'anime-logo-panel',
    src: 'anime-wall-art.jpg',
    crop: [50, 155, 510, 637],
    note: 'Circular layered logo panel, isolated; keyboard cropped out above',
  },
  {
    slug: 'anime-figure-panel',
    src: 'anime-wall-art.jpg',
    crop: [555, 135, 592, 740],
    note: 'Framed layered figure panel with its flames, isolated on leather',
  },
  {
    slug: 'dragon-figure',
    src: 'dragon-figure.jpg', // 900x1200 portrait
    /* Measured: the figure spans x 20-720, y 75-1060 once the tail and its red
     * fin are included. Narrowing to 808 drops the monitor strip above and
     * about half the alarm clock at the right without touching the object. */
    crop: [0, 70, 808, 1010],
    brighten: 1.06,
  },
  {
    slug: 'dance-figurine',
    src: 'dance-figurine.jpg',
    crop: [0, 30, 900, 1125],
    brighten: 1.03,
  },
  {
    slug: 'sakura-bookmark',
    src: 'sakura-bookmark.jpg',
    crop: [14, 100, 800, 1000], // whole bookmark, biased left away from table clutter
  },
  {
    slug: 'blossom-jewellery-box',
    src: 'blossom-jewellery-box.jpg',
    crop: [0, 75, 900, 1125],
  },
  {
    slug: 'car-model',
    src: 'car-model.jpg',
    crop: [0, 40, 900, 1125],
    brighten: 1.04,
  },
  {
    slug: 'name-keychains',
    src: 'charging-dock.jpg', // misleading legacy filename; shows DinuDante name keyrings
    rotate: 180,
    crop: [90, 63, 720, 900], // centred on the two keyrings
    brighten: 1.08,
  },
  {
    slug: 'phone-stand',
    src: 'phone-stand.jpg',
    crop: [0, 30, 900, 1125],
  },
];

const GALLERY_WIDTHS = [480, 800, 1200];

/* ---------------------------------------------------------------------------
 * Service cards: square crops of the same verified photographs.
 * ------------------------------------------------------------------------- */
const SERVICES = [
  {
    slug: 'service-personalised',
    src: 'charging-dock.jpg',
    rotate: 180,
    crop: [90, 153, 720, 720],
    brighten: 1.08,
  },
  { slug: 'service-functional', src: 'phone-stand.jpg', crop: [0, 180, 900, 900] },
  { slug: 'service-decor', src: 'dance-figurine.jpg', crop: [0, 200, 900, 900], brighten: 1.03 },
];
const SERVICE_WIDTHS = [400, 800];

/* ---------------------------------------------------------------------------
 * Hero: one real printed object, with an intentional mobile crop.
 *
 * In the 900x1200 source the stand occupies x 62-895, y 152-1143 (measured from
 * the pixels, not estimated). Both crops must contain that box: a phone visitor
 * who cannot tell what the object is gets nothing from the hero. The mobile
 * frame is the deliberate variant — it trims desk context on the left and the
 * empty foreground so the object itself is larger on a small screen, rather
 * than slicing the middle out of it.
 * ------------------------------------------------------------------------- */
const HERO = {
  src: 'phone-stand.jpg',
  desktop: { crop: [0, 118, 900, 1035], out: 'hero-print', widths: [640, 900, 1280] },
  mobile: { crop: [45, 140, 855, 1012], out: 'hero-print-wide', widths: [480, 760, 1100] },
};

async function run() {
  [OUT_GALLERY, OUT_SERVICES, OUT_HERO, OUT_VIDEO, OUT_BRAND].forEach(ensure);
  const manifest = [];

  for (const item of GALLERY) {
    let p = sharp(path.join(SRC, item.src));
    if (item.rotate) p = p.rotate(item.rotate);
    p = p.extract({
      left: item.crop[0],
      top: item.crop[1],
      width: item.crop[2],
      height: item.crop[3],
    });
    p = normalise(p, { brighten: item.brighten });
    const files = await emit(p, path.join(OUT_GALLERY, item.slug), GALLERY_WIDTHS, {
      height: GALLERY_WIDTHS[0] * 1.25,
    });
    manifest.push({ kind: 'gallery', slug: item.slug, source: item.src, files });
    console.log(`gallery  ${item.slug}`);
  }

  for (const item of SERVICES) {
    let p = sharp(path.join(SRC, item.src));
    if (item.rotate) p = p.rotate(item.rotate);
    p = p.extract({
      left: item.crop[0],
      top: item.crop[1],
      width: item.crop[2],
      height: item.crop[3],
    });
    p = normalise(p, { brighten: item.brighten });
    const files = await emit(p, path.join(OUT_SERVICES, item.slug), SERVICE_WIDTHS, {
      height: SERVICE_WIDTHS[0],
    });
    manifest.push({ kind: 'service', slug: item.slug, source: item.src, files });
    console.log(`service  ${item.slug}`);
  }

  for (const key of ['desktop', 'mobile']) {
    const cfg = HERO[key];
    let p = sharp(path.join(SRC, HERO.src)).extract({
      left: cfg.crop[0],
      top: cfg.crop[1],
      width: cfg.crop[2],
      height: cfg.crop[3],
    });
    p = normalise(p, { brighten: 1.02 });
    const files = await emit(p, path.join(OUT_HERO, cfg.out), cfg.widths, {
      height: Math.round((cfg.crop[3] / cfg.crop[2]) * cfg.widths[0]),
      quality: 80,
    });
    manifest.push({ kind: 'hero', slug: cfg.out, source: HERO.src, files });
    console.log(`hero     ${cfg.out}`);
  }

  /* Video posters: each video's own first-frame poster, downloaded once into
   * assets/_originals so the page makes no third-party request before play. */
  const posters = [
    ['GrVqXOJHH-E', 'video-blossom-box'],
    ['qJx8QoXDi78', 'video-process'],
    ['GqWD6Tv1fzw', 'video-mom-topper'],
  ];
  for (const [id, slug] of posters) {
    const srcFile = path.join(SRC, `yt-${id}.jpg`);
    if (!fs.existsSync(srcFile)) {
      console.log(`poster   ${slug} SKIPPED (missing ${srcFile})`);
      continue;
    }
    let p = sharp(srcFile);
    /* GrVqXOJHH-E's original-aspect thumbnail is a tiled contact sheet; the
     * clean centre frame was located by scanning for the black separators. */
    if (id === 'GrVqXOJHH-E') {
      p = p.extract({ left: 84, top: 215, width: 296, height: 403 });
    }
    p = p.resize({ width: 720, height: 1280, fit: 'cover' });
    const files = await emit(p, path.join(OUT_VIDEO, slug), [360, 720], {
      height: 640,
      quality: 74,
    });
    manifest.push({ kind: 'poster', slug, source: `youtube:${id}`, files });
    console.log(`poster   ${slug}`);
  }

  /* Brand: small crisp variants of the approved portrait logo + favicons. */
  const logo = path.join(SRC, 'logo.png');
  if (fs.existsSync(logo)) {
    for (const size of [40, 80, 120, 180]) {
      await sharp(logo)
        .resize(size, size, { kernel: 'lanczos3' })
        .png({ compressionLevel: 9, palette: true, quality: 90 })
        .toFile(path.join(OUT_BRAND, `logo-${size}.png`));
    }
    for (const size of [16, 32, 48]) {
      await sharp(logo)
        .resize(size, size, { kernel: 'lanczos3' })
        .png({ compressionLevel: 9, palette: true, quality: 92 })
        .toFile(path.join(OUT_BRAND, `favicon-${size}.png`));
    }
    manifest.push({
      kind: 'brand',
      slug: 'logo',
      source: 'logo.png',
      files: [40, 80, 120, 180]
        .map((s) => path.join(OUT_BRAND, `logo-${s}.png`))
        .concat([16, 32, 48].map((s) => path.join(OUT_BRAND, `favicon-${s}.png`))),
    });
    console.log('brand    logo + favicon variants');
  }

  /* Social preview: a real print on the right, brand and message on the left.
   * Domain-specific, exact 1200x630, readable at card size. */
  ensure('assets/social');
  const OG_W = 1200;
  const OG_H = 630;
  const photo = await sharp(path.join(SRC, 'phone-stand.jpg'))
    .extract({ left: 0, top: 150, width: 900, height: 950 })
    .resize({ width: 520, height: OG_H, fit: 'cover', position: 'centre' })
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .toBuffer();
  const ogLogo = await sharp(path.join(SRC, "logo.png")).resize(88, 88).toBuffer();
  const ogText = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
    <style>
      .n { font: 700 40px "Segoe UI", Arial, sans-serif; fill: #f3f5f3; letter-spacing: -0.5px; }
      .h { font: 700 62px "Segoe UI", Arial, sans-serif; fill: #f3f5f3; letter-spacing: -2px; }
      .s { font: 400 30px "Segoe UI", Arial, sans-serif; fill: #b9c1bc; }
      .a { font: 600 26px "Segoe UI", Arial, sans-serif; fill: #7dd6a4; letter-spacing: 2px; }
    </style>
    <text x="180" y="118" class="n">DDPrinterZ</text>
    <text x="80" y="290" class="h">Custom 3D printing</text>
    <text x="80" y="362" class="h">in Bhubaneswar.</text>
    <text x="80" y="424" class="s">Personalised gifts · functional parts · models</text>
    <text x="80" y="540" class="a">DINUDANTE.COM</text>
  </svg>`);
  await sharp({
    create: { width: OG_W, height: OG_H, channels: 3, background: '#0f1311' },
  })
    .composite([
      { input: photo, left: OG_W - 520, top: 0 },
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="${OG_H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#0f1311"/><stop offset="1" stop-color="#0f131100"/></linearGradient></defs><rect width="200" height="${OG_H}" fill="url(#g)"/></svg>`,
        ),
        left: OG_W - 520,
        top: 0,
      },
      { input: ogLogo, left: 80, top: 52 },
      { input: ogText, left: 0, top: 0 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile('assets/social/og-default.jpg');
  manifest.push({
    kind: 'social',
    slug: 'og-default',
    source: 'phone-stand.jpg',
    files: ['assets/social/og-default.jpg'],
  });
  console.log('social   og-default.jpg');

  fs.writeFileSync(
    'tools/image-build.json',
    JSON.stringify({ generated: new Date().toISOString(), manifest }, null, 2),
  );
  console.log('\nWrote tools/image-build.json');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
