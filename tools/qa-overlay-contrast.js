/*
 * Pixel-level contrast check for text that sits on top of a photograph.
 * axe cannot evaluate these (it reports "background could not be determined"),
 * so the rendered pixels are sampled directly: the brightest background pixel
 * inside each overlay is used as the worst case.
 */
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');

const BASE = process.argv[2] || 'http://localhost:4173';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGETS = [
  ['/', '.hero__caption'],
  ['/', '.card__tag'],
  ['/services.html', '.card__tag'],
  ['/work.html', '.tile__zoom'],
];

const lum = ([r, g, b]) => {
  const s = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
};
const ratio = (a, b) => {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
  let fail = 0;
  for (const [url, sel] of TARGETS) {
    for (const theme of ['night', 'day']) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1363, height: 936 });
      await page.goto(BASE + url, { waitUntil: 'networkidle0' });
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel);
      await new Promise((r) => setTimeout(r, 400));
      const box = await page.evaluate((s) => {
        const el = document.querySelector(s);
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), color: getComputedStyle(el).color };
      }, sel);
      /* Crop from a full viewport shot: clip coordinates differ between
       * Puppeteer versions, viewport coordinates do not. */
      const full = await page.screenshot();
      const { data, info } = await sharp(full)
        .extract({ left: box.x, top: box.y, width: box.w, height: box.h })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      /* Build a luminance histogram; the background is the darker mass, the
       * glyphs the lighter. Take the brightest 40th percentile pixel as the
       * worst-case background the text has to sit on. */
      const lums = [];
      for (let i = 0; i < data.length; i += info.channels) lums.push(lum([data[i], data[i + 1], data[i + 2]]));
      lums.sort((a, b) => a - b);
      const bgWorst = lums[Math.floor(lums.length * 0.6)];
      const fg = (box.color.match(/\d+/g) || [255, 255, 255]).slice(0, 3).map(Number);
      const r = (Math.max(lum(fg), bgWorst) + 0.05) / (Math.min(lum(fg), bgWorst) + 0.05);
      const ok = r >= 4.5;
      if (!ok) fail++;
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${url} ${sel} [${theme}] worst-case ${r.toFixed(2)}:1 (text ${box.color})`);
      await page.close();
    }
  }
  console.log(`\n${fail} overlay contrast failures.`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
