/*
 * Clipping check for the delivered gallery crops.
 *
 * The requirement is that a crop never cuts off a product's defining features.
 * That is testable: if pixels belonging to the *object* touch the outer edge of
 * the frame, the object runs out of the picture and has been cut.
 *
 * Background that reaches the edge is fine and expected — a desk, a print bed,
 * a hand holding the piece. So each entry declares the colours that belong to
 * the object, and only those are tested against the border ring. Images whose
 * subject legitimately fills the frame are marked `fills: true` and reported
 * rather than failed.
 *
 * Usage: node tools/check-crops.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, '..', 'assets', 'gallery');
const RING = 3; /* px of border to inspect */
const TOLERANCE = 0.004; /* share of ring pixels that may be object-coloured */

/* colour predicates, kept deliberately narrow */
const P = {
  strongRed: (r, g, b) => r > 120 && r - g > 60 && r - b > 50,
  nearWhite: (r, g, b) => Math.min(r, g, b) > 165 && Math.max(r, g, b) - Math.min(r, g, b) < 34,
  orange: (r, g, b) => r > 170 && g > 45 && g < 160 && b < 110 && r - b > 105,
  brightGreen: (r, g, b) => g > 105 && g - r > 28 && g - b > 28,
};

const ITEMS = [
  { slug: 'anime-logo-panel', parts: ['strongRed', 'nearWhite'], label: 'red ring + cream face' },
  { slug: 'anime-figure-panel', parts: ['strongRed', 'nearWhite'], label: 'red flames + white frame' },
  { slug: 'dragon-figure', parts: ['strongRed', 'brightGreen'], label: 'red tail fin + green eyes' },
  { slug: 'phone-stand', parts: ['orange'], label: 'orange body' },
  { slug: 'blossom-jewellery-box', parts: ['brightGreen'], label: 'green box' },
  { slug: 'car-model', parts: ['brightGreen'], label: 'green body' },
  { slug: 'sakura-bookmark', parts: ['strongRed'], label: 'red blossoms', fills: true },
  { slug: 'name-keychains', parts: ['brightGreen'], label: 'green lettering' },
  { slug: 'dance-figurine', parts: ['nearWhite'], label: 'white figurine' },
];

(async () => {
  let fail = 0;
  const rows = [];
  for (const item of ITEMS) {
    const file = path.join(DIR, `${item.slug}-1200.jpg`);
    if (!fs.existsSync(file)) {
      console.log(`MISSING  ${item.slug}`);
      fail++;
      continue;
    }
    const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H, channels: c } = info;
    const hit = (x, y) => {
      const i = (y * W + x) * c;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      return item.parts.some((p) => P[p](r, g, b));
    };

    const edges = { top: 0, bottom: 0, left: 0, right: 0 };
    let ring = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const onTop = y < RING, onBottom = y >= H - RING;
        const onLeft = x < RING, onRight = x >= W - RING;
        if (!(onTop || onBottom || onLeft || onRight)) continue;
        ring++;
        if (!hit(x, y)) continue;
        if (onTop) edges.top++;
        if (onBottom) edges.bottom++;
        if (onLeft) edges.left++;
        if (onRight) edges.right++;
      }

    const touched = Object.entries(edges).filter(([, n]) => n / ring > TOLERANCE);
    const ok = touched.length === 0;
    if (!ok && !item.fills) fail++;
    rows.push({ slug: item.slug, label: item.label, ok, fills: !!item.fills, edges, ring });
    const status = ok ? 'PASS' : item.fills ? 'NOTE' : 'FAIL';
    const detail = ok
      ? `${item.label} clear of all four edges`
      : `${item.label} reaches ${touched.map(([e, n]) => `${e} (${n}px)`).join(', ')}`;
    console.log(`${status}  ${item.slug.padEnd(24)} ${detail}`);
  }
  fs.writeFileSync(path.join(__dirname, 'crop-check.json'), JSON.stringify(rows, null, 2));
  console.log(`\n${rows.filter((r) => r.ok).length} clear, ${fail} clipped, ${rows.length} crops checked.`);
  process.exit(fail ? 1 : 0);
})();
