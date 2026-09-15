/*
 * Measures where the printed object actually sits inside each owner original,
 * so crops can be chosen from pixels instead of by eye.
 *
 * Method: the outer frame of the photograph is sampled to estimate the
 * background colour, every pixel is scored by its distance from it, and the
 * longest contiguous run of above-threshold rows and columns is taken as the
 * subject. The longest *contiguous* run matters — these photographs have
 * cluttered desks, and first/last-above-threshold would stretch the box out to
 * a keyboard or a monitor at the edge of frame.
 *
 * Usage: node tools/measure-subjects.js
 */
const path = require('path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'assets', '_originals');

const FILES = [
  'phone-stand.jpg',
  'charging-dock.jpg',
  'blossom-jewellery-box.jpg',
  'dance-figurine.jpg',
  'sakura-bookmark.jpg',
  'dragon-figure.jpg',
  'car-model.jpg',
  'wedding-tokens.jpg',
  'anime-wall-art.jpg',
];

/* longest contiguous run of values above `thr` */
function longestRun(profile, thr) {
  let best = [0, -1];
  let start = -1;
  for (let i = 0; i <= profile.length; i++) {
    const on = i < profile.length && profile[i] > thr;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      if (i - 1 - start > best[1] - best[0]) best = [start, i - 1];
      start = -1;
    }
  }
  return best;
}

async function measure(file, rotate = 0) {
  let p = sharp(path.join(SRC, file));
  if (rotate) p = p.rotate(rotate);
  const { data, info } = await p.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: c } = info;
  const at = (x, y) => {
    const i = (y * W + x) * c;
    return [data[i], data[i + 1], data[i + 2]];
  };

  /* background estimate: median of the outer 4% frame */
  const border = [];
  const m = Math.max(2, Math.round(Math.min(W, H) * 0.04));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (x < m || y < m || x >= W - m || y >= H - m) border.push(at(x, y));
  const med = [0, 1, 2].map((k) => {
    const v = border.map((p) => p[k]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  });

  /* distance-from-background mask, then row and column profiles */
  const THR = 62; /* RGB euclidean distance */
  const rows = new Array(H).fill(0);
  const cols = new Array(W).fill(0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = at(x, y);
      const d = Math.hypot(r - med[0], g - med[1], b - med[2]);
      if (d > THR) {
        rows[y]++;
        cols[x]++;
      }
    }
  }
  const [y0, y1] = longestRun(rows, W * 0.06);
  const [x0, x1] = longestRun(cols, H * 0.06);
  return { file, W, H, bg: med, box: { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 } };
}

(async () => {
  console.log('file                        image      subject box            subject w x h   fill%');
  for (const f of FILES) {
    const rot = f === 'charging-dock.jpg' ? 180 : 0;
    const r = await measure(f, rot);
    const fill = ((r.box.w * r.box.h) / (r.W * r.H)) * 100;
    console.log(
      `${f.padEnd(27)} ${String(r.W + 'x' + r.H).padEnd(10)} x ${r.box.x0}-${r.box.x1}, y ${r.box.y0}-${r.box.y1}`.padEnd(75) +
        `${r.box.w}x${r.box.h}`.padEnd(16) +
        fill.toFixed(0) + '%' + (rot ? '  (rotated 180)' : ''),
    );
  }
})();
