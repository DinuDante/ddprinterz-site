/*
 * Static verification pass for the generated site.
 *
 * Checks, for every generated page:
 *   - inline script and JSON-LD parse
 *   - every first-party href/src resolves to a real file
 *   - every same-page and cross-page #hash target exists
 *   - one H1 per page, no heading level skipped
 *   - every <img> has alt, width and height
 *   - external links open safely
 *   - unreferenced files under assets/ (excluding the archive)
 *
 * Run: node tools/check.js
 */
const fs = require('fs');
const path = require('path');

const PAGES = [
  'index.html',
  'work.html',
  'services.html',
  'privacy.html',
  'order-policy.html',
  '404.html',
];

let fail = 0;
let warn = 0;
const referenced = new Set();

const problem = (page, msg) => {
  console.log(`FAIL  ${page}: ${msg}`);
  fail++;
};
const caution = (page, msg) => {
  console.log(`WARN  ${page}: ${msg}`);
  warn++;
};

const docs = {};
for (const page of PAGES) docs[page] = fs.readFileSync(page, 'utf8');

/* Collect every id per page so cross-page hashes can be checked. */
const idsByPage = {};
for (const [page, html] of Object.entries(docs)) {
  idsByPage[page] = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

for (const [page, html] of Object.entries(docs)) {
  /* --- scripts --- */
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      new Function(m[1]);
    } catch (e) {
      problem(page, `inline script does not parse: ${e.message}`);
    }
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      problem(page, `JSON-LD does not parse: ${e.message}`);
    }
  }

  /* --- headings --- */
  const headings = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  const h1s = headings.filter((h) => h === 1).length;
  if (h1s !== 1) problem(page, `expected exactly one H1, found ${h1s}`);
  let prev = 0;
  for (const level of headings) {
    if (prev && level > prev + 1) problem(page, `heading level jumps h${prev} -> h${level}`);
    prev = level;
  }

  /* --- images --- */
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\salt=/.test(tag)) problem(page, `img without alt: ${tag.slice(0, 90)}`);
    if (!/\swidth=/.test(tag) || !/\sheight=/.test(tag))
      problem(page, `img without explicit dimensions: ${tag.slice(0, 90)}`);
  }

  /* --- links and assets --- */
  const urls = [];
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) urls.push(m[1]);
  for (const m of html.matchAll(/<meta property="og:image" content="([^"]+)"/g)) urls.push(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g))
    for (const part of m[1].split(',')) urls.push(part.trim().split(/\s+/)[0]);

  for (const url of urls) {
    if (!url || url.startsWith('data:')) continue;

    if (/^(https?:)?\/\//.test(url) || url.startsWith('mailto:') || url.startsWith('tel:')) {
      /* Our own absolute URLs (og:image) still have to resolve to a real file. */
      if (url.startsWith('https://dinudante.com/')) {
        const own = url.replace('https://dinudante.com/', '') || 'index.html';
        if (!fs.existsSync(own)) problem(page, `missing file behind absolute URL: ${url}`);
        else referenced.add(path.normalize(own));
      }
      continue; /* external: verified separately, never by fetching */
    }

    if (url.startsWith('#')) {
      const id = url.slice(1);
      if (id && !idsByPage[page].has(id)) problem(page, `same-page anchor #${id} has no target`);
      continue;
    }

    const [pathPart, hash] = url.split('#');
    const clean = pathPart.split('?')[0];
    let target = clean;
    if (target.startsWith('/')) target = target.slice(1);
    if (target === '' || target.endsWith('/')) target += 'index.html';

    if (!fs.existsSync(target)) {
      problem(page, `missing local file: ${url}`);
      continue;
    }
    referenced.add(path.normalize(target));

    if (hash) {
      const targetPage = target;
      if (idsByPage[targetPage]) {
        if (!idsByPage[targetPage].has(hash))
          problem(page, `cross-page anchor ${url} has no target in ${targetPage}`);
      } else {
        caution(page, `anchor into non-page file: ${url}`);
      }
    }
  }

  /* --- external link safety --- */
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(m[0]))
      problem(page, `target=_blank without noopener: ${m[0].slice(0, 90)}`);
  }

  /* --- known past defects must not return --- */
  if (/overflow-x\s*:\s*hidden/.test(html))
    caution(page, 'page-level overflow-x:hidden found (may be masking a layout defect)');
  if (/DRAFT/i.test(html) && page === 'order-policy.html')
    problem(page, 'order policy still contains a DRAFT marker');
}

/* --- CSS regression guards --- */
const css = fs.readFileSync('style.css', 'utf8');
if (/\.work\s*\{[^}]*color:\s*#1/.test(css))
  problem('style.css', 'legacy .work hard-coded foreground colour is back');
if (/grid-template-rows:\s*\d+px\s+\d+px/.test(css))
  problem('style.css', 'fixed two-row gallery grid is back');
for (const m of css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) {
  const asset = m[1].replace(/^\//, '');
  if (!/^(data:|https?:)/.test(asset) && !fs.existsSync(asset))
    problem('style.css', `missing asset referenced by CSS: ${m[1]}`);
}

/* --- unreferenced assets --- */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
const orphans = walk('assets').filter(
  (f) => !referenced.has(path.normalize(f)) && !f.includes('_originals'),
);
for (const o of orphans) caution('assets', `not referenced by any page: ${o}`);

console.log(`\n${fail} failures, ${warn} warnings across ${PAGES.length} pages.`);
process.exit(fail ? 1 : 0);
