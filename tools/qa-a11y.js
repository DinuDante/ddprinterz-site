/*
 * Automated accessibility scan with axe-core, in both themes.
 * Automated scanning cannot certify WCAG conformance; it catches the machine
 * detectable subset. Keyboard and focus behaviour are covered by
 * tools/qa-interactions.js.
 *
 * Usage: node tools/qa-a11y.js [baseUrl]
 */
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const BASE = process.argv[2] || 'http://localhost:4173';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const AXE = require.resolve('axe-core/axe.min.js');
const PAGES = ['/', '/services.html', '/work.html', '/privacy.html', '/order-policy.html', '/404.html'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
  const axeSource = fs.readFileSync(AXE, 'utf8');
  const all = [];
  let violations = 0;

  for (const theme of ['night', 'day']) {
    for (const url of PAGES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1363, height: 936 });
      await page.goto(BASE + url, { waitUntil: 'networkidle0' });
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await new Promise((r) => setTimeout(r, 300));
      await page.evaluate(axeSource);
      const res = await page.evaluate(async () =>
        await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
        }),
      );
      const v = res.violations.filter((x) => x.impact !== 'minor' || true);
      violations += v.length;
      /* Record which checks axe could not decide, not just how many. These are
       * almost always text over a photograph, which tools/qa-overlay-contrast.js
       * settles by sampling the rendered pixels. */
      const inc = res.incomplete.map((x) => ({ id: x.id, nodes: x.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
      all.push({ url, theme, passes: res.passes.length, incomplete: inc.length, incompleteDetail: inc, violations: v.map((x) => ({ id: x.id, impact: x.impact, help: x.help, nodes: x.nodes.slice(0, 3).map((n) => n.target.join(' ')) })) });
      const label = `${url} [${theme}]`.padEnd(28);
      console.log(`${label} ${res.passes.length} passes, ${v.length} violations, ${res.incomplete.length} needs-review`);
      v.forEach((x) => console.log(`    ${x.impact}: ${x.id} — ${x.help} @ ${x.nodes.slice(0,2).map(n=>n.target.join(' ')).join(', ')}`));
      inc.forEach((x) => console.log(`    needs-review: ${x.id} @ ${x.nodes.join(', ')}`));
      await page.close();
    }
  }

  fs.writeFileSync('tools/qa-a11y.json', JSON.stringify(all, null, 2));
  console.log(`\nTotal violations: ${violations}`);
  await browser.close();
  process.exit(violations ? 1 : 0);
})();
