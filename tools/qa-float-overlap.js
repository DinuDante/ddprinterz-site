/*
 * The floating WhatsApp button is fixed above the page, so whatever sits under
 * it in the bottom-right corner is covered. Text scrolls past and stays
 * readable, but a control that can never be uncovered would be unusable.
 *
 * Because the content column has no side gutter below roughly 1320px, a fixed
 * button always overlaps that column at phone and tablet widths. So the pass
 * condition is not "never overlaps" — it is "every control can be reached".
 *
 * That is decided exactly rather than by sampling scroll positions, which can
 * miss the offsets that clear a tall element. For a control at document offset
 * d with height h, in a viewport of height H, with the button occupying the
 * band [H - keepOut, H] above the viewport bottom: the control is fully clear
 * of the button while d - y + h < H - keepOut, and still on screen while
 * d - y > -h. So a horizontally-overlapping control is reachable when some
 * scroll offset y in [0, maxScroll] satisfies both.
 *
 * Usage: node tools/qa-float-overlap.js [baseUrl]
 */
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const BASE = process.argv[2] || 'http://localhost:4173';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGES = ['/', '/services.html', '/work.html', '/privacy.html', '/order-policy.html', '/404.html'];
const VIEWPORTS = [
  { name: '320', width: 320, height: 640 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 640 },
  { name: '1363', width: 1363, height: 936 },
];

const results = [];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });

  for (const vp of VIEWPORTS) {
    for (const url of PAGES) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(BASE + url, { waitUntil: 'networkidle0' });

      const out = await page.evaluate(() => {
        const fab = document.querySelector('.float-wa');
        if (!fab) return { noFab: true };
        window.scrollTo(0, 0);
        const f = fab.getBoundingClientRect();
        const H = innerHeight;
        /* how far up from the viewport bottom the button reaches */
        const keepOut = H - f.top;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - H);

        const blocking = [];
        const overlapping = [];
        document.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])').forEach((el) => {
          if (el === fab || fab.contains(el) || el.contains(fab)) return;
          const s = getComputedStyle(el);
          if (s.visibility === 'hidden' || s.display === 'none' || !el.offsetParent) return;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          /* a sticky/fixed control travels with the viewport: judge it in place */
          const pinned = s.position === 'fixed' || s.position === 'sticky' ||
            !!el.closest('.site-nav, .lightbox, aside');
          const horiz = r.left < f.right && r.right > f.left;
          if (!horiz) return;

          const label = ((el.textContent || '').trim().slice(0, 40) || el.className).replace(/\s+/g, ' ');
          if (pinned) {
            /* cannot be scrolled away from the button — overlap here is real */
            if (r.top < f.bottom && r.bottom > f.top) blocking.push(label + ' [pinned]');
            return;
          }
          const d = r.top + window.scrollY; /* document offset */
          const h = r.height;
          /* need y with  y >= d + h - H + keepOut  and  y <= d + h  (still on
           * screen). Bounds are inclusive: on a page that cannot scroll the
           * only candidate is y = 0, and a strict test would reject it even
           * when the control already sits clear of the button. */
          const lo = d + h - H + keepOut;
          const hi = d + h;
          const feasible = Math.min(hi, maxScroll) >= Math.max(lo, 0);
          overlapping.push(label);
          if (!feasible) blocking.push(label);
        });
        return { blocking, overlapping, keepOut: Math.round(keepOut), maxScroll: Math.round(maxScroll) };
      });

      const status = out.noFab ? 'fail' : out.blocking.length ? 'fail' : 'pass';
      const detail = out.noFab
        ? 'no .float-wa on page'
        : out.blocking.length
          ? `never clearable: ${out.blocking.join(' | ')}`
          : `${out.overlapping.length} controls cross the button's column, all clearable by scrolling`;
      results.push({ viewport: vp.name, url, status, detail, overlapping: out.overlapping || [] });
      console.log(`${status === 'pass' ? 'PASS' : 'FAIL'}  ${url} [${vp.name}] — ${detail}`);
      await page.close();
    }
  }

  fs.writeFileSync('tools/qa-float-overlap.json', JSON.stringify(results, null, 2));
  const fail = results.filter((r) => r.status !== 'pass').length;
  console.log(`\n${results.length - fail} pass, ${fail} fail, ${results.length} checks.`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
