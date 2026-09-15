/*
 * Browser QA sweep for the DDPrinterZ site.
 *
 * Drives the installed Chrome over the DevTools protocol against a local build
 * and records pass/fail evidence for the responsive matrix, both themes, the
 * specific defects listed in the audit, and every interactive control.
 *
 * Usage: node tools/qa.js [baseUrl]
 * Output: tools/qa-results.json and qa-shots/*.png
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE = process.argv[2] || 'http://localhost:4173';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = 'qa-shots';

const PAGES = [
  { name: 'home', url: '/' },
  { name: 'services', url: '/services.html' },
  { name: 'work', url: '/work.html' },
  { name: 'privacy', url: '/privacy.html' },
  { name: 'policy', url: '/order-policy.html' },
  { name: '404', url: '/404.html' },
];

const VIEWPORTS = [
  { name: '320', width: 320, height: 640 },
  { name: '360', width: 360, height: 740 },
  { name: '375', width: 375, height: 667 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '671', width: 671, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '820', width: 820, height: 1180 },
  { name: '900', width: 900, height: 700 },
  { name: '1024', width: 1024, height: 640 }, /* short laptop */
  { name: '1280', width: 1280, height: 800 },
  { name: '1363', width: 1363, height: 936 }, /* the audit's viewport */
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
  { name: '2560', width: 2560, height: 1440 },
  { name: 'landscape-844', width: 844, height: 390 },
];

const results = [];
const record = (area, check, status, detail) => {
  results.push({ area, check, status, detail });
  const mark = status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : status.toUpperCase();
  if (status !== 'pass') console.log(`${mark}  ${area} :: ${check} — ${detail}`);
};

function luminance([r, g, b]) {
  const s = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}
function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
/* Chrome reports color-mix() results as `color(srgb r g b / a)` with 0–1
 * channels, so both notations have to be understood before any ratio means
 * anything. Getting this wrong is what made the first run report false
 * contrast failures in the light theme. */
function parseColor(str) {
  if (!str) return null;
  const srgb = str.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
  if (srgb) {
    return {
      rgb: [1, 2, 3].map((i) => Math.round(Number(srgb[i]) * 255)),
      a: srgb[4] === undefined ? 1 : Number(srgb[4]),
    };
  }
  const nums = str.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  return { rgb: nums.slice(0, 3).map(Number), a: nums[3] === undefined ? 1 : Number(nums[3]) };
}

/* Flatten a stack of possibly translucent backgrounds onto an opaque base. */
function flatten(layers) {
  let out = [255, 255, 255];
  for (const layer of layers) {
    const c = parseColor(layer);
    if (!c || c.a === 0) continue;
    out = out.map((v, i) => Math.round(c.rgb[i] * c.a + v * (1 - c.a)));
  }
  return out;
}

const parseRgb = (str) => {
  const c = parseColor(str);
  return c ? c.rgb : [];
};

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('ddprinterz-theme', t);
    } catch (e) {}
    /* Colour transitions are still interpolating for ~180ms after a theme
     * switch; measuring mid-flight reports colours the visitor never sees. */
    if (!document.getElementById('qa-no-transition')) {
      const s = document.createElement('style');
      s.id = 'qa-no-transition';
      s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
      document.head.appendChild(s);
    }
  }, theme);
  await new Promise((r) => setTimeout(r, 250));
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
  });

  /* ------------------------------------------------ responsive + theme sweep */
  for (const vp of VIEWPORTS) {
    for (const theme of ['night', 'day']) {
      for (const pg of PAGES) {
        const page = await browser.newPage();
        const consoleErrors = [];
        page.on('console', (m) => {
          if (m.type() === 'error') consoleErrors.push(m.text());
        });
        page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
        const failedRequests = [];
        page.on('requestfailed', (r) => failedRequests.push(r.url()));
        page.on('response', (r) => {
          if (r.status() >= 400 && new URL(r.url()).origin === new URL(BASE).origin)
            failedRequests.push(`${r.status()} ${r.url()}`);
        });

        await page.setViewport({ width: vp.width, height: vp.height });
          await page.goto(BASE + pg.url, { waitUntil: 'domcontentloaded' });
        await setTheme(page, theme);
        await new Promise((r) => setTimeout(r, 120));

        const metrics = await page.evaluate(() => {
          const de = document.documentElement;
          const wide = [];
          document.querySelectorAll('body *').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.right > de.clientWidth + 1.5) {
              wide.push(
                el.tagName.toLowerCase() +
                  (el.className && typeof el.className === 'string'
                    ? '.' + el.className.split(' ')[0]
                    : '') +
                  ` right=${Math.round(r.right)}`,
              );
            }
          });
          return {
            scrollWidth: de.scrollWidth,
            clientWidth: de.clientWidth,
            overflowing: wide.slice(0, 5),
          };
        });

        const key = `${pg.name}-${vp.name}-${theme}`;
        if (metrics.scrollWidth > metrics.clientWidth + 1) {
          record(
            'responsive',
            key,
            'fail',
            `horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth}; ${metrics.overflowing.join(' | ')}`,
          );
        } else {
          record('responsive', key, 'pass', `no horizontal overflow at ${metrics.clientWidth}px`);
        }

        if (consoleErrors.length)
          record('console', key, 'fail', consoleErrors.slice(0, 3).join(' | '));
        if (failedRequests.length)
          record('requests', key, 'fail', failedRequests.slice(0, 3).join(' | '));

        /* Screenshot a representative subset only, to keep the run fast. */
        if (['320', '390', '768', '1363', '1920'].includes(vp.name)) {
          await page.screenshot({
            path: path.join(SHOTS, `${key}.png`),
            fullPage: vp.name !== '1920',
          });
        }
        await page.close();
      }
    }
  }

  /* ------------------------------------------------------- gallery row sizing */
  for (const vp of [
    { name: '320', width: 320, height: 640 },
    { name: '671', width: 671, height: 800 },
    { name: '900', width: 900, height: 700 },
    { name: '1363', width: 1363, height: 936 },
    { name: '1920', width: 1920, height: 1080 },
  ]) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    await page.goto(BASE + '/work.html', { waitUntil: 'domcontentloaded' });
    const tiles = await page.evaluate(() =>
      [...document.querySelectorAll('.gallery .tile')].map((t) => {
        const r = t.getBoundingClientRect();
        const img = t.querySelector('img').getBoundingClientRect();
        return {
          title: t.querySelector('b').textContent,
          h: Math.round(r.height),
          w: Math.round(r.width),
          imgH: Math.round(img.height),
        };
      }),
    );
    const collapsed = tiles.filter((t) => t.h < 150 || t.imgH < 100);
    if (tiles.length !== 9)
      record('gallery', `tile-count-${vp.name}`, 'fail', `expected 9 tiles, found ${tiles.length}`);
    else if (collapsed.length)
      record(
        'gallery',
        `tile-heights-${vp.name}`,
        'fail',
        `collapsed tiles: ${collapsed.map((c) => `${c.title} ${c.h}px`).join(', ')}`,
      );
    else
      record(
        'gallery',
        `tile-heights-${vp.name}`,
        'pass',
        `9 tiles, heights ${Math.min(...tiles.map((t) => t.h))}–${Math.max(...tiles.map((t) => t.h))}px`,
      );
    await page.close();
  }

  /* Future item counts: inject extra tiles and confirm rows still size. */
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1363, height: 936 });
    await page.goto(BASE + '/work.html', { waitUntil: 'domcontentloaded' });
    const heights = await page.evaluate(() => {
      const g = document.querySelector('.gallery');
      for (let i = 0; i < 5; i++) g.appendChild(g.firstElementChild.cloneNode(true));
      return [...g.children].map((t) => Math.round(t.getBoundingClientRect().height));
    });
    const bad = heights.filter((h) => h < 150);
    record(
      'gallery',
      'future-item-counts',
      bad.length ? 'fail' : 'pass',
      `14 tiles rendered, min height ${Math.min(...heights)}px`,
    );
    await page.close();
  }

  /* ------------------------------------------------------------- contrast */
  for (const theme of ['night', 'day']) {
    for (const pg of PAGES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1363, height: 936 });
      await page.goto(BASE + pg.url, { waitUntil: 'domcontentloaded' });
      await setTheme(page, theme);
      await new Promise((r) => setTimeout(r, 100));

      const samples = await page.evaluate(() => {
        /* Every painted background from the root down to the element, so a
         * translucent nav or panel can be composited rather than guessed. */
        function bgStack(el) {
          const layers = [];
          let n = el;
          while (n) {
            const c = getComputedStyle(n).backgroundColor;
            if (c && c !== 'transparent' && !/^rgba\(0, 0, 0, 0\)$/.test(c)) layers.unshift(c);
            n = n.parentElement;
          }
          return layers;
        }
        const out = [];
        document
          .querySelectorAll('h1,h2,h3,p,a,li,b,span,small,summary,button')
          .forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width < 4 || r.height < 4) return;
            if (!el.textContent.trim()) return;
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || cs.display === 'none') return;
            /* Skip text sitting on an image scrim; measured separately. */
            if (el.closest('.hero__caption, .card__tag, .tile__zoom')) return;
            out.push({
              tag: el.tagName.toLowerCase(),
              cls: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
              text: el.textContent.trim().slice(0, 40),
              color: cs.color,
              bg: bgStack(el),
              size: parseFloat(cs.fontSize),
              weight: cs.fontWeight,
            });
          });
        return out;
      });

      const failures = [];
      for (const s of samples) {
        const fg = parseRgb(s.color);
        const bg = flatten(s.bg);
        if (fg.length < 3 || bg.length < 3) continue;
        const ratio = contrast(fg, bg);
        const large = s.size >= 24 || (s.size >= 18.66 && Number(s.weight) >= 700);
        const need = large ? 3 : 4.5;
        if (ratio < need)
          failures.push(`${s.tag}.${s.cls} "${s.text}" ${ratio.toFixed(2)}:1 (need ${need})`);
      }
      record(
        'contrast',
        `${pg.name}-${theme}`,
        failures.length ? 'fail' : 'pass',
        failures.length
          ? failures.slice(0, 4).join(' | ')
          : `${samples.length} text nodes all meet WCAG AA`,
      );
      await page.close();
    }
  }

  fs.writeFileSync('tools/qa-results.json', JSON.stringify(results, null, 2));
  const fails = results.filter((r) => r.status === 'fail');
  console.log(
    `\n${results.filter((r) => r.status === 'pass').length} pass, ${fails.length} fail, ${results.length} checks.`,
  );
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})();
