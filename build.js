/*
 * DDPrinterZ static site generator.
 *
 * Canonical sources live in src/: data.json (content), templates/_layout.html
 * (shared shell), style.css and app.js. Everything at the repository root is
 * generated — never edit the generated HTML/CSS directly.
 *
 * Run: node build.js
 */
const fs = require('fs');
const crypto = require('crypto');

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));
const layout = fs.readFileSync('src/templates/_layout.html', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8');
const script = fs.readFileSync('src/app.js', 'utf8');
const S = data.site;

/* Cache-busting token so a deployed CSS change is never served stale. */
const assetVersion = crypto.createHash('sha1').update(css).digest('hex').slice(0, 8);

/* --- helpers ------------------------------------------------------------- */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* WhatsApp deep link. Opens the chat with the message prefilled; the visitor
 * still has to press send. */
function wa(context) {
  const lines = [
    `Hi DinuDante, I'd like a custom 3D print from DDPrinterZ.`,
    '',
    `Item: ${context}`,
    'Reference photo / file:',
    'Approximate size:',
    'Quantity:',
    'Colours:',
    'Needed by:',
  ];
  return `https://wa.me/${S.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function ig() {
  return S.instagramDm;
}

function mailto(subject) {
  return `mailto:${S.email}?subject=${encodeURIComponent(subject)}`;
}

/* Responsive <picture>: WebP first, JPEG fallback, explicit dimensions. */
function picture({ base, widths, alt, sizes, width, height, loading = 'lazy', fetchpriority, className = '', art }) {
  const webp = widths.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
  const jpg = widths.map((w) => `${base}-${w}.jpg ${w}w`).join(', ');
  const fallback = `${base}-${widths[widths.length - 1]}.jpg`;
  /* Art direction: a deliberately different crop below art.media. */
  const artWebp = art ? art.widths.map((w) => `${art.base}-${w}.webp ${w}w`).join(', ') : '';
  const artJpg = art ? art.widths.map((w) => `${art.base}-${w}.jpg ${w}w`).join(', ') : '';
  const artSources = art
    ? `<source media="${art.media}" type="image/webp" srcset="${artWebp}" sizes="${art.sizes}">
      <source media="${art.media}" srcset="${artJpg}" sizes="${art.sizes}">
      `
    : '';
  return `<picture>
      ${artSources}<source type="image/webp" srcset="${webp}" sizes="${sizes}">
      <img${className ? ` class="${className}"` : ''} src="${fallback}" srcset="${jpg}" sizes="${sizes}" width="${width}" height="${height}" alt="${esc(alt)}" loading="${loading}"${
        fetchpriority ? ` fetchpriority="${fetchpriority}"` : ''
      } decoding="${loading === 'eager' ? 'sync' : 'async'}">
    </picture>`;
}

const ICONS = `<svg aria-hidden="true" width="0" height="0" style="position:absolute;overflow:hidden">
  <symbol id="i-instagram" viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm11.5 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></symbol>
  <symbol id="i-youtube" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.7V8.3l6.3 3.7-6.3 3.7Z"/></symbol>
  <symbol id="i-whatsapp" viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.2-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.4-.2-3 .8.8-2.9-.2-.4A8 8 0 1 1 12 20Zm4.4-5.9-1.8-.8c-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1-1.4-.7-2.4-1.5-3.3-3-.2-.3 0-.4.1-.6l.5-.6c.1-.2.1-.4 0-.6l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1.1 1.5-1 2.5.1 1.2.8 2.5 1 2.7.1.2 2 3.2 5 4.3.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.2-.2-.4-.3Z"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><path d="M2 5h20v14H2V5Zm2 2v.5l8 5 8-5V7H4Zm16 10V9.8l-8 5-8-5V17h16Z"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M9.6 16.2 5.4 12l-1.4 1.4 5.6 5.6L21 7.6 19.6 6.2 9.6 16.2Z"/></symbol>
  <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"/></symbol>
  <symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5Z"/></symbol>
  <symbol id="i-expand" viewBox="0 0 24 24"><path d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 5.7 18.3l-1.4-1.4L10.6 12 4.3 5.7l1.4-1.4L12 10.6l6.3-6.3 1.4 1.4Z" transform="translate(0.6 0)"/></symbol>
  <symbol id="i-prev" viewBox="0 0 24 24"><path d="M15.4 6 14 4.6 6.6 12 14 19.4l1.4-1.4L9.4 12l6-6Z"/></symbol>
  <symbol id="i-next" viewBox="0 0 24 24"><path d="M8.6 6 10 4.6 17.4 12 10 19.4 8.6 18l6-6-6-6Z"/></symbol>
  <symbol id="i-moon" viewBox="0 0 24 24"><path d="M12.4 3a7.6 7.6 0 1 0 8.6 10.7A8.6 8.6 0 0 1 12.4 3Z"/></symbol>
  <symbol id="i-sun" viewBox="0 0 24 24"><path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0-6 1.6 3.2h-3.2L12 1Zm0 22-1.6-3.2h3.2L12 23ZM1 12l3.2-1.6v3.2L1 12Zm22 0-3.2 1.6v-3.2L23 12ZM4.2 4.2l3.4 1-1.4 1.4-2-2.4Zm15.6 15.6-3.4-1 1.4-1.4 2 2.4ZM4.2 19.8l2-2.4 1.4 1.4-3.4 1Zm15.6-15.6-2 2.4-1.4-1.4 3.4-1Z"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z"/></symbol>
</svg>`;

const NAV_ITEMS = [
  { href: '/services.html', label: 'Services', match: 'services' },
  { href: '/work.html', label: 'Our work', match: 'work' },
  { href: '/work.html#watch', label: 'Watch', match: null },
  { href: '/#pricing', label: 'Pricing', match: null },
  { href: '/#order', label: 'How to order', match: null },
  { href: '/#contact', label: 'Contact', match: null },
];

function navFor(pageKey) {
  return NAV_ITEMS.map((item) => {
    const current = item.match && item.match === pageKey ? ' aria-current="page"' : '';
    return `<a href="${item.href}"${current}>${item.label}</a>`;
  }).join('\n        ');
}

const LIGHTBOX = `<dialog class="lightbox" id="lightbox" aria-labelledby="lb-title">
  <div class="lightbox__inner">
    <div class="lightbox__stage">
      <img id="lb-img" src="" alt="" width="1200" height="1500">
      <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous project">
        <svg class="icon" aria-hidden="true"><use href="#i-prev"/></svg>
      </button>
      <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next project">
        <svg class="icon" aria-hidden="true"><use href="#i-next"/></svg>
      </button>
      <button class="lightbox__close" type="button" aria-label="Close viewer">
        <svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>
      </button>
    </div>
    <div class="lightbox__foot">
      <div class="lightbox__meta">
        <b id="lb-title"></b>
        <span id="lb-caption"></span>
      </div>
      <p class="lightbox__count" id="lb-count"></p>
      <div class="actions">
        <a class="btn btn--primary btn--small" id="lb-enquire" href="${wa('a custom print')}" target="_blank" rel="noopener noreferrer">
          <svg class="icon" aria-hidden="true"><use href="#i-whatsapp"/></svg>Enquire about this
        </a>
        <a class="btn btn--small" id="lb-open-full" href="#" target="_blank" rel="noopener noreferrer">
          <svg class="icon" aria-hidden="true"><use href="#i-external"/></svg>Open full image
        </a>
      </div>
    </div>
  </div>
</dialog>`;

function renderPage(page) {
  let html = layout;
  const replacements = {
    title: page.title,
    description: page.description,
    canonical: S.url + page.path,
    og_title: page.ogTitle || page.title,
    og_image: `${S.url}assets/social/og-default.jpg`,
    assetVersion,
    head: page.head || '',
    icons: ICONS,
    nav: navFor(page.key),
    content: page.content,
    dialog: page.lightbox ? LIGHTBOX : '',
    script,
    instagram: S.instagram,
    youtube: S.youtube,
    email: S.email,
    portfolio: S.portfolio,
    whatsappFloat: wa('(tell me what you would like printed)'),
  };
  for (const [key, value] of Object.entries(replacements)) {
    html = html.split(`{{${key}}}`).join(value);
  }
  fs.writeFileSync(page.filename, html);
  console.log(`  ${page.filename}`);
}

/* --- shared blocks ------------------------------------------------------- */

function galleryTiles(projects, { compact = false, eagerFirst = true } = {}) {
  const tiles = projects
    .map((p, i) => {
      const base = `/assets/gallery/${p.slug}`;
      return `<a class="tile" href="${base}-1200.jpg"
        data-full="${base}-1200.jpg"
        data-title="${esc(p.title)}"
        data-caption="${esc(p.category + ' · ' + p.caption)}"
        data-alt="${esc(p.alt)}"
        data-enquiry="${esc(wa(p.enquiry))}">
        <span class="tile__media">
          ${picture({
            base,
            widths: [480, 800, 1200],
            alt: p.alt,
            sizes: compact
              ? '(max-width: 680px) 90vw, (max-width: 1100px) 45vw, 260px'
              : '(max-width: 680px) 90vw, (max-width: 1100px) 45vw, 290px',
            width: 800,
            height: 1000,
            loading: eagerFirst && i === 0 ? 'eager' : 'lazy',
            fetchpriority: eagerFirst && i === 0 ? 'high' : undefined,
          })}
          <span class="tile__zoom"><svg class="icon" aria-hidden="true"><use href="#i-expand"/></svg></span>
        </span>
        <span class="tile__body">
          <b>${esc(p.title)}</b>
          <span>${esc(p.category)} · ${esc(p.caption)}</span>
        </span>
      </a>`;
    })
    .join('\n      ');
  return `<div class="gallery${compact ? ' gallery--compact' : ''}">
      ${tiles}
    </div>`;
}

function contactSection() {
  return `<section class="section" id="contact">
  <div class="wrap">
    <div class="contact-panel">
      <p class="eyebrow">Start a print</p>
      <h2 class="h-section">Tell me what you would like made.</h2>
      <p style="margin-top:16px">Send a photo, a sketch or an STL file with the size, quantity, colours and the date you need it. I reply with a clear quote before anything is printed. Messages open with the details already filled in — nothing is sent until you press send.</p>
      <ul class="contact-list">
        <li>
          <a href="${ig()}" target="_blank" rel="noopener noreferrer">
            <svg class="icon" aria-hidden="true"><use href="#i-instagram"/></svg>
            <span><b>Instagram DM</b><span>${esc(S.instagramHandle)} · preferred</span></span>
          </a>
        </li>
        <li>
          <a href="${wa('(tell me what you would like printed)')}" target="_blank" rel="noopener noreferrer">
            <svg class="icon" aria-hidden="true"><use href="#i-whatsapp"/></svg>
            <span><b>WhatsApp</b><span>${esc(S.whatsappDisplay)}</span></span>
          </a>
        </li>
        <li>
          <a href="${mailto('Custom 3D print enquiry')}">
            <svg class="icon" aria-hidden="true"><use href="#i-mail"/></svg>
            <span><b>Email</b><span>${esc(S.email)}</span></span>
          </a>
        </li>
        <li>
          <a href="${S.youtube}" target="_blank" rel="noopener noreferrer">
            <svg class="icon" aria-hidden="true"><use href="#i-youtube"/></svg>
            <span><b>YouTube</b><span>${esc(S.youtubeHandle)} · see prints in motion</span></span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</section>`;
}

/* --- pages --------------------------------------------------------------- */

const homeSample = [
  data.projects[0],
  data.projects[1],
  data.projects[2],
  data.projects[3],
];

const indexContent = `<section class="wrap hero">
  <div class="hero__grid">
    <div>
      <p class="eyebrow">Custom 3D printing · ${esc(S.location)}</p>
      <h1 class="display">Your idea,<br>printed in Bhubaneswar.</h1>
      <p class="lead">DDPrinterZ is a one-person studio run by DinuDante. Send a photo, a sketch or an STL file and get back a real object — a personalised gift, a working part or a detailed model — printed in colour on Bambu Lab machines.</p>
      <div class="actions">
        <a class="btn btn--primary" href="${ig()}" target="_blank" rel="noopener noreferrer">
          <svg class="icon" aria-hidden="true"><use href="#i-instagram"/></svg>Send your idea
        </a>
        <a class="btn" href="/work.html">See real prints</a>
      </div>
      <ul class="trust">
        <li><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>Typically printed in 2–5 days</li>
        <li><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>Two-colour AMS printing</li>
        <li><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>You talk to the maker</li>
      </ul>
    </div>
    <figure class="hero__media" style="margin:0">
      ${picture({
        base: '/assets/hero/hero-print',
        widths: [640, 900, 1280],
        alt: 'Orange and white honeycomb phone stand printed by DDPrinterZ, standing on a wooden desk',
        sizes: '(max-width: 960px) 92vw, 46vw',
        width: 900,
        height: 1035,
        loading: 'eager',
        fetchpriority: 'high',
        art: {
          media: '(max-width: 960px)',
          base: '/assets/hero/hero-print-wide',
          widths: [480, 760, 1100],
          sizes: '92vw',
        },
      })}
      <figcaption class="hero__caption">A real DDPrinterZ print: honeycomb phone stand, PLA in two colours.</figcaption>
    </figure>
  </div>
</section>

<section class="section section--sunk" id="work-preview">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Recent prints</p>
        <h2 class="h-section">Real objects, photographed as they came off the printer.</h2>
      </div>
      <p>Every photograph on this site is of an actual DDPrinterZ print. No stock images, no renders presented as finished work.</p>
    </div>
    ${galleryTiles(homeSample, { compact: true, eagerFirst: false })}
    <div class="actions actions--center" style="margin-top:32px">
      <a class="btn" href="/work.html">See all ${data.projects.length} projects</a>
      <a class="btn btn--quiet" href="/work.html#watch">Watch the process</a>
    </div>
  </div>
</section>

<section class="section" id="services">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">What I make</p>
        <h2 class="h-section">Three kinds of work.</h2>
      </div>
      <p>Most enquiries fall into one of these. If yours does not, ask anyway — the answer is usually yes or a suggestion.</p>
    </div>
    <div class="grid-3">
      ${data.services
        .map(
          (s) => `<article class="card">
        <div class="card__media">
          ${picture({
            base: '/' + s.image,
            widths: [400, 800],
            alt: s.alt,
            sizes: '(max-width: 680px) 90vw, (max-width: 1100px) 45vw, 360px',
            width: 400,
            height: 400,
          })}
          <span class="card__tag">${esc(s.tag)}</span>
        </div>
        <div class="card__body">
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.blurb)}</p>
          <a class="btn btn--small" href="${wa(s.enquiry)}" target="_blank" rel="noopener noreferrer">
            <svg class="icon" aria-hidden="true"><use href="#i-whatsapp"/></svg>Ask about this
          </a>
        </div>
      </article>`,
        )
        .join('\n      ')}
    </div>
    <div class="actions actions--center" style="margin-top:32px">
      <a class="btn" href="/services.html">More about each service</a>
    </div>
  </div>
</section>

<section class="section section--sunk" id="pricing">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Indicative pricing</p>
        <h2 class="h-section">What things start at.</h2>
      </div>
      <p>Starting prices to help you plan. Your final price is confirmed in a quote before any printing begins.</p>
    </div>
    <div class="pricing-grid">
      <div>
        <div class="price-table">
          ${data.pricing
            .map(
              (p) => `<div class="price-row">
            <p class="price-row__name">${esc(p.name)}${
              p.belowMinimum
                ? ` <span class="badge-min">${esc(S.minimumOrder)} min. order applies</span>`
                : ''
            }</p>
            <p class="price-row__value">${esc(p.price)}</p>
            <p class="price-row__desc">${esc(p.desc)}</p>
          </div>`,
            )
            .join('\n          ')}
        </div>
        <p class="note" style="margin-top:16px">Minimum order value is ${esc(S.minimumOrder)}. Items priced below that are quoted as part of an order that reaches the minimum — ask and I will confirm what your order comes to. Local handover in Bhubaneswar; India-wide shipping charged at cost.</p>
      </div>
      <div class="price-aside">
        <div class="material-card">
          <h3>PLA <span>₹4/g</span></h3>
          <p>Colour and fine detail. The right choice for gifts, figurines, wall pieces and indoor décor.</p>
        </div>
        <div class="material-card">
          <h3>PETG <span>₹5/g</span></h3>
          <p>Tougher and more heat-tolerant than PLA. Used for functional parts that get handled or take stress.</p>
        </div>
        <div class="quote-factors">
          <p class="note" style="margin:0 0 12px"><strong style="color:var(--ink)">What changes the price</strong></p>
          <dl>
          ${data.quoteFactors
            .map((f) => `<dt>${esc(f.term)}</dt><dd>${esc(f.def)}</dd>`)
            .join('\n          ')}
        </dl>
      </div>
    </div>
  </div>
</section>

<section class="section" id="order">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">How to order</p>
        <h2 class="h-section">From your idea to your hands.</h2>
      </div>
      <p>Production for a typical order takes about 2–5 days. Dispatch or delivery is arranged after production finishes, and your timeline is confirmed with your quote.</p>
    </div>
    <div class="steps">
      ${data.steps
        .map(
          (s, i) => `<article class="step">
        <p class="step__num">${i + 1}</p>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.body)}</p>
      </article>`,
        )
        .join('\n      ')}
    </div>
    <div class="actions actions--center" style="margin-top:32px">
      <a class="btn btn--primary" href="${ig()}" target="_blank" rel="noopener noreferrer">
        <svg class="icon" aria-hidden="true"><use href="#i-instagram"/></svg>Start on Instagram
      </a>
      <a class="btn" href="${wa('(tell me what you would like printed)')}" target="_blank" rel="noopener noreferrer">
        <svg class="icon" aria-hidden="true"><use href="#i-whatsapp"/></svg>Start on WhatsApp
      </a>
      <a class="btn btn--quiet" href="/order-policy.html">Read the order policy</a>
    </div>
  </div>
</section>

<section class="section section--sunk">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Why DDPrinterZ</p>
        <h2 class="h-section">Local, direct, and made to order.</h2>
      </div>
    </div>
    <div class="tiles">
      ${data.why
        .map(
          (w) => `<div class="tile-fact"><b>${esc(w.title)}</b><span>${esc(w.body)}</span></div>`,
        )
        .join('\n      ')}
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Questions</p>
        <h2 class="h-section">Before you send your idea.</h2>
      </div>
    </div>
    <div class="faq">
      ${data.faq
        .map(
          (f) => `<details>
        <summary>${esc(f.q)}</summary>
        <p>${esc(f.a)}</p>
      </details>`,
        )
        .join('\n      ')}
    </div>
  </div>
</section>

<section class="section" id="maker">
  <div class="wrap">
    <div class="maker">
      <figure class="maker__media" style="margin:0">
        ${picture({
          base: '/assets/gallery/name-keychains',
          widths: [480, 800],
          alt: 'A pair of keyrings reading DinuDante in green script on a white outline, lying on a textured print bed',
          sizes: '(max-width: 960px) 92vw, 300px',
          width: 480,
          height: 600,
        })}
        <figcaption>A DDPrinterZ print, not a portrait: the studio's own name keyrings.</figcaption>
      </figure>
      <div>
        <p class="eyebrow">Meet the maker</p>
        <blockquote>“I started DDPrinterZ to make custom 3D printing personal, approachable and local to Bhubaneswar.”</blockquote>
        <p>I'm DinuDante — the designer, the printer operator and the person replying to your messages. You work with me directly, from the first reference image to the final quality check.</p>
        <p><strong style="color:var(--ink)">DinuDante</strong> · Founder, DDPrinterZ · <a href="${S.portfolio}" target="_blank" rel="noopener noreferrer" style="color:var(--ink);text-decoration-color:var(--accent);text-underline-offset:3px">personal portfolio</a></p>
      </div>
    </div>
  </div>
</section>

${contactSection()}`;

const localBusiness = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'DDPrinterZ',
  description:
    'Maker-direct custom 3D printing studio in Bhubaneswar, Odisha. Personalised gifts, functional parts and detailed models in PLA and PETG.',
  url: S.url,
  image: `${S.url}assets/social/og-default.jpg`,
  email: S.email,
  areaServed: { '@type': 'City', name: 'Bhubaneswar' },
  address: { '@type': 'PostalAddress', addressLocality: 'Bhubaneswar', addressRegion: 'Odisha', addressCountry: 'IN' },
  founder: { '@type': 'Person', name: 'DinuDante' },
  sameAs: [S.instagram, S.youtube],
};

renderPage({
  filename: 'index.html',
  path: '',
  key: 'home',
  title: 'DDPrinterZ — custom 3D printing in Bhubaneswar',
  description:
    'Maker-direct custom 3D printing in Bhubaneswar. Personalised gifts, functional parts and detailed models in PLA and PETG, from ₹149. Send a photo or STL for a quote.',
  content: indexContent,
  /* The home page shows a four-project sample with the same .tile markup, so it
   * needs the viewer too — without it those tiles fall through to the raw JPG. */
  lightbox: true,
  head: `<script type="application/ld+json">${JSON.stringify(localBusiness)}</script>`,
});

/* --- work ---------------------------------------------------------------- */

const workContent = `<section class="wrap page-head">
  <p class="eyebrow">Our work</p>
  <h1 class="display">Real DDPrinterZ prints.</h1>
  <p class="lead">Nine projects photographed in the studio — personalised pieces, functional parts and detail models. Open any project to see it larger and ask for something similar.</p>
</section>

<section class="section" id="gallery" style="padding-top:0">
  <div class="wrap">
    ${galleryTiles(data.projects)}
    <div class="actions actions--center" style="margin-top:40px">
      <a class="btn btn--primary" href="${ig()}" target="_blank" rel="noopener noreferrer">
        <svg class="icon" aria-hidden="true"><use href="#i-instagram"/></svg>Ask for something like this
      </a>
      <a class="btn" href="${S.instagram}" target="_blank" rel="noopener noreferrer">
        <svg class="icon" aria-hidden="true"><use href="#i-external"/></svg>More on Instagram
      </a>
    </div>
  </div>
</section>

<section class="section section--sunk" id="watch">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Watch</p>
        <h2 class="h-section">Printing, finishing and the reveal.</h2>
      </div>
      <p>Three DDPrinterZ Shorts, each filmed during an actual project. Players load only when you press play, so nothing is requested from YouTube until then.</p>
    </div>
    <div class="video-grid">
      ${data.videos
        .map(
          (v) => `<article class="video-card">
        <div class="video-frame">
          ${picture({
            base: '/' + v.poster,
            widths: [360, 720],
            alt: v.alt,
            sizes: '(max-width: 680px) 90vw, (max-width: 1100px) 45vw, 330px',
            width: 360,
            height: 640,
          })}
          <button class="video-play" type="button" data-video-id="${esc(v.id)}" data-video-title="${esc(v.title)}" aria-label="Play video: ${esc(v.title)}">
            <span class="video-play__disc"><svg class="icon" aria-hidden="true"><use href="#i-play"/></svg></span>
          </button>
        </div>
        <div class="video-body">
          <small>${esc(v.tag)}</small>
          <h3>${esc(v.title)}</h3>
          <a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener noreferrer">Watch on YouTube instead</a>
        </div>
      </article>`,
        )
        .join('\n      ')}
    </div>
    <div class="actions actions--center" style="margin-top:32px">
      <a class="btn" href="${S.youtube}" target="_blank" rel="noopener noreferrer">
        <svg class="icon" aria-hidden="true"><use href="#i-youtube"/></svg>All videos on YouTube
      </a>
    </div>
  </div>
</section>

${contactSection()}`;

renderPage({
  filename: 'work.html',
  path: 'work.html',
  key: 'work',
  title: 'Our work — real 3D printing projects | DDPrinterZ',
  description:
    'Nine real 3D printing projects from the DDPrinterZ studio in Bhubaneswar: personalised keyrings, functional stands, figurines, layered wall panels and detail models.',
  content: workContent,
  lightbox: true,
});

/* --- services ------------------------------------------------------------ */

const PROCESS = [
  { title: 'Share a reference', body: 'A photo, a sketch, a product link or an STL file. Anything that shows what you want.' },
  { title: 'Design and material check', body: 'I confirm the size, whether it needs modelling work, and whether PLA or PETG suits the job.' },
  { title: 'Colour and print setup', body: 'Colours are chosen and loaded into the AMS, then the piece is printed in one run where possible.' },
  { title: 'Finishing and handover', body: 'Supports removed, edges cleaned, piece inspected, then local handover or shipping at cost.' },
];

const servicesContent = `<section class="wrap page-head">
  <p class="eyebrow">Services</p>
  <h1 class="display">What DDPrinterZ makes.</h1>
  <p class="lead">Three kinds of work, all printed to order in Bhubaneswar. Bring a photo, a sketch, a reference link or an STL file — a finished 3D model is helpful but never required.</p>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="grid-3">
      ${data.services
        .map(
          (s, i) => `<article class="card" id="${esc(s.slug)}">
        <div class="card__media">
          ${picture({
            base: '/' + s.image,
            widths: [400, 800],
            alt: s.alt,
            sizes: '(max-width: 680px) 90vw, (max-width: 1100px) 45vw, 360px',
            width: 400,
            height: 400,
            /* First card is the largest element above the fold on this page. */
            loading: i === 0 ? 'eager' : 'lazy',
            fetchpriority: i === 0 ? 'high' : undefined,
          })}
          <span class="card__tag">${esc(s.tag)}</span>
        </div>
        <div class="card__body">
          <h2 style="font-size:var(--step-2)">${esc(s.title)}</h2>
          <p>${esc(s.blurb)}</p>
          <ul class="card__list">
            ${s.examples.map((e) => `<li>${esc(e)}</li>`).join('\n            ')}
          </ul>
          <p class="note">${esc(s.imageCaption)}</p>
          <a class="btn btn--small btn--primary" href="${wa(s.enquiry)}" target="_blank" rel="noopener noreferrer">
            <svg class="icon" aria-hidden="true"><use href="#i-whatsapp"/></svg>Enquire about ${esc(s.tag.toLowerCase())}
          </a>
        </div>
      </article>`,
        )
        .join('\n      ')}
    </div>
  </div>
</section>

<section class="section section--sunk" id="process">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">How a print is made</p>
        <h2 class="h-section">Four stages, start to finish.</h2>
      </div>
      <p>The same four stages apply whether the piece is a keyring or a prototype housing.</p>
    </div>
    <div class="steps">
      ${PROCESS.map(
        (p, i) => `<article class="step">
        <p class="step__num">${i + 1}</p>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.body)}</p>
      </article>`,
      ).join('\n      ')}
    </div>
  </div>
</section>

<section class="section" id="materials">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Materials</p>
        <h2 class="h-section">PLA or PETG.</h2>
      </div>
      <p>Two materials cover almost everything DDPrinterZ prints. I will tell you which one suits your piece when I quote it.</p>
    </div>
    <div class="grid-3">
      <div class="material-card">
        <h3>PLA <span>₹4/g</span></h3>
        <p>Best colour reproduction and the finest surface detail. Used for gifts, figurines, bookmarks, wall pieces and indoor décor.</p>
      </div>
      <div class="material-card">
        <h3>PETG <span>₹5/g</span></h3>
        <p>Tougher and more heat-tolerant than PLA. Used for stands, brackets, enclosures and parts that get handled regularly.</p>
      </div>
      <div class="material-card">
        <h3>Not suitable for <span>note</span></h3>
        <p>These are FDM prints. They are not certified for food contact, medical use or safety-critical loads, and layer lines are a normal part of the finish.</p>
      </div>
    </div>
    <div class="actions actions--center" style="margin-top:40px">
      <a class="btn btn--primary" href="${wa('(tell me what you would like printed)')}" target="_blank" rel="noopener noreferrer">
        <svg class="icon" aria-hidden="true"><use href="#i-whatsapp"/></svg>Discuss your project
      </a>
      <a class="btn" href="/#pricing">See pricing</a>
      <a class="btn btn--quiet" href="/work.html">See real prints</a>
    </div>
  </div>
</section>

${contactSection()}`;

renderPage({
  filename: 'services.html',
  path: 'services.html',
  key: 'services',
  title: 'Services — gifts, prototypes and models | DDPrinterZ',
  description:
    'Custom 3D printing services in Bhubaneswar: personalised gifts, functional parts and prototypes, and detailed models and décor, printed in PLA and PETG by DinuDante.',
  content: servicesContent,
});

/* --- privacy ------------------------------------------------------------- */

const privacyContent = `<section class="wrap page-head">
  <p class="eyebrow">Legal</p>
  <h1 class="display">Privacy.</h1>
  <p class="lead">What this website does and does not collect. Last updated 15 September 2026.</p>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap prose">
    <h2>The short version</h2>
    <p>This is a static website. It has no accounts, no forms, no analytics and no advertising or tracking scripts. Browsing it does not create a record that DDPrinterZ can see.</p>

    <h2>Hosting</h2>
    <p>The site is published with GitHub Pages on the domain dinudante.com. Like any web host, GitHub receives the requests your browser makes — including your IP address and browser user-agent — in order to serve the pages. DDPrinterZ does not have access to those server logs.</p>

    <h2>What is stored in your browser</h2>
    <p>One item only: your light or dark theme choice, saved under the key <code>ddprinterz-theme</code> in your browser's local storage so the site does not switch back on your next visit. It stays on your device, is never sent anywhere, and you can clear it with your browser's site-data controls. If storage is unavailable the site still works and simply follows your system theme.</p>

    <h2>Embedded video</h2>
    <p>The videos on the work page are hosted on YouTube. Nothing is requested from YouTube until you press play — the previews are images served from this site. Once you press play, a privacy-enhanced <code>youtube-nocookie.com</code> player loads and your interaction with it is governed by Google's privacy policy rather than this one.</p>

    <h2>Messaging and email</h2>
    <p>The Instagram, WhatsApp and email buttons hand you over to those apps or services with a message prepared for you. Nothing is sent until you send it. Anything you then send — including reference photos and files — is handled by that provider under its own terms, and reaches DDPrinterZ as an ordinary message.</p>

    <h2>Your project files and photos</h2>
    <p>Files and reference images you send for a custom order remain yours. A completed order does not automatically become a public portfolio item; project photos are published only where the design is DDPrinterZ's own or permission has been established.</p>

    <h2>Questions</h2>
    <p>Email <a href="mailto:${S.email}">${esc(S.email)}</a> and ask.</p>
  </div>
</section>`;

renderPage({
  filename: 'privacy.html',
  path: 'privacy.html',
  key: 'privacy',
  title: 'Privacy | DDPrinterZ',
  description:
    'What the DDPrinterZ website stores: no analytics or tracking, one local theme preference, and YouTube players that load only when you press play.',
  content: privacyContent,
});

/* --- order policy -------------------------------------------------------- */

const policyContent = `<section class="wrap page-head">
  <p class="eyebrow">Ordering</p>
  <h1 class="display">Order policy.</h1>
  <p class="lead">How a DDPrinterZ order is quoted, made and handed over. Last updated 15 September 2026.</p>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap prose">
    <h2>Everything is made to order</h2>
    <p>DDPrinterZ does not hold stock. Each piece is printed for your order using FDM 3D printing, to the specification you approve.</p>
    <p>Layer lines, small colour variation between batches and light surface texture are normal characteristics of this process, not defects. Where a piece needs supports, the contact points are cleaned by hand and may remain slightly visible.</p>

    <h2>Quote and approval</h2>
    <p>Before anything is printed you receive a quote covering the material, colours, size, quantity, price and expected production time. Work begins once you approve it.</p>
    <p>A small advance is required to start the print, with the balance due on completion or delivery. The exact amount is stated in your quote.</p>
    <p>The minimum order value is ${esc(S.minimumOrder)}. Items listed below that price are quoted as part of an order that reaches the minimum.</p>

    <h2>Production and delivery are separate</h2>
    <p>Production for a typical order takes about 2 to 5 days, depending on the current print queue and the complexity of the piece. That is the time to make your print, not a delivery promise.</p>
    <p>Dispatch or handover is arranged once production is finished: local collection or delivery in Bhubaneswar, or India-wide shipping charged at cost. Shipping time depends on the carrier and your address and is not guaranteed by DDPrinterZ.</p>

    <h2>Changes</h2>
    <p>Changes to size, colour, quantity or design are straightforward before printing starts. Once a made-to-order print is under way, tell me as soon as possible and I will confirm what is still possible for that piece and what it would cost.</p>

    <h2>Designs and files you send</h2>
    <p>By sending a design, logo, photograph or model you confirm that you have the right to have it reproduced. DDPrinterZ does not claim ownership of third-party trademarks, characters or designs, and may decline a request where permission is unclear.</p>

    <h2>Intended use and safety</h2>
    <p>These are FDM prints in PLA or PETG. They are not certified for food contact, medical use, electrical safety or load-bearing and safety-critical applications, and PLA in particular softens in sustained heat such as a closed car in summer. If your piece has a demanding use, say so in your enquiry so the material can be chosen with that in mind.</p>

    <div class="callout">
      <p><strong style="color:var(--ink)">Not covered on this page.</strong> Cancellation, refund and replacement terms are not published here. They are confirmed in writing with your quote before you pay any advance. If a published policy matters to you before you order, ask and I will put the terms for your order in writing.</p>
    </div>

    <p style="margin-top:32px">Questions about an order: <a href="${ig()}" target="_blank" rel="noopener noreferrer">Instagram DM</a>, <a href="${wa('(a question about an order)')}" target="_blank" rel="noopener noreferrer">WhatsApp</a> or <a href="mailto:${S.email}">${esc(S.email)}</a>.</p>
  </div>
</section>`;

renderPage({
  filename: 'order-policy.html',
  path: 'order-policy.html',
  key: 'policy',
  title: 'Order policy | DDPrinterZ',
  description:
    'How DDPrinterZ orders work: made-to-order printing, quote and approval, the ₹400 minimum order value, production time versus delivery, and intended-use limits.',
  content: policyContent,
});

/* --- 404 ----------------------------------------------------------------- */

const notFoundContent = `<section class="wrap page-head">
  <p class="eyebrow">404</p>
  <h1 class="display">That page isn't here.</h1>
  <p class="lead">The link may be old or mistyped. Everything on the site is one step away:</p>
  <div class="actions" style="margin-top:32px">
    <a class="btn btn--primary" href="/">Home</a>
    <a class="btn" href="/work.html">Our work</a>
    <a class="btn" href="/services.html">Services</a>
    <a class="btn btn--quiet" href="/#pricing">Pricing</a>
  </div>
</section>`;

renderPage({
  filename: '404.html',
  path: '404.html',
  key: '404',
  title: 'Page not found | DDPrinterZ',
  description: 'That page could not be found. Browse DDPrinterZ services, work and pricing instead.',
  content: notFoundContent,
  head: '<meta name="robots" content="noindex">',
});

/* --- static outputs ------------------------------------------------------ */

fs.writeFileSync('style.css', css);
console.log('  style.css');

const routes = ['', 'services.html', 'work.html', 'privacy.html', 'order-policy.html'];
fs.writeFileSync(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${S.url}${r}</loc></url>`).join('\n')}
</urlset>
`,
);
console.log('  sitemap.xml');

fs.writeFileSync(
  'robots.txt',
  `User-agent: *
Allow: /
Disallow: /assets/_originals/

Sitemap: ${S.url}sitemap.xml
`,
);
console.log('  robots.txt');

console.log(`\nBuilt with asset version ${assetVersion}`);
