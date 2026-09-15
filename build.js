const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));
const layout = fs.readFileSync('src/templates/_layout.html', 'utf8');

function renderPage(pageConfig) {
  let html = layout;
  html = html.replace('{{title}}', pageConfig.title);
  html = html.replace(/{{description}}/g, pageConfig.description);
  html = html.replace(/{{canonical}}/g, data.site.url + pageConfig.path);
  html = html.replace('{{og_title}}', pageConfig.title);
  html = html.replace('{{og_image}}', pageConfig.og_image || `${data.site.url}assets/hero/anime-zen-maker-v2.jpg`);
  html = html.replace('{{schema}}', pageConfig.schema || '');
  html = html.replace('{{content}}', pageConfig.content);
  fs.writeFileSync(pageConfig.filename, html);
  console.log(`Generated ${pageConfig.filename}`);
}

const indexContent = `
<header id="top">
  <div class="wrap hero">
    <div>
      <p class="eyebrow">Made by DinuDante in Bhubaneswar</p>
      <h1 class="display">Ideas,<br><span>made real.</span></h1>
      <p class="lead">Custom 3D printing for gifts, prototypes and practical ideas made locally in Bhubaneswar.</p>
      <div class="actions">
        <a class="btn ig" href="${data.site.instagram}" target="_blank" rel="noopener noreferrer"><svg class="icon" aria-hidden="true"><use href="#icon-instagram"/></svg>Start a print</a>
        <a class="btn" href="work.html"><svg class="icon" aria-hidden="true"><use href="#icon-cube"/></svg>See real work</a>
      </div>
      <div class="trust">
        <span>Typical turnaround 2–5 days</span>
        <span>True multicolour</span>
        <span>Maker-direct support</span>
      </div>
    </div>
    <div class="art" aria-label="DDPrinterZ 3D-print illustration">
      <div class="printer"></div>
    </div>
  </div>
</header>

<section id="pricing">
  <div class="wrap prices">
    <div>
      <p class="eyebrow">Simple pricing</p>
      <h2 class="title">Clear from<br>the start.</h2>
      <p class="muted">Starting prices help you plan before we confirm your custom quote.</p>
      <div class="material-visual">
        <img src="assets/infographics/material-guide.webp" alt="Visual comparison of PLA for colourful indoor objects and PETG for durable functional parts" width="760" height="760" loading="lazy" decoding="async">
        <div class="material-key">
          <div><b>PLA</b><span>Colourful gifts & décor</span></div>
          <div><b>PETG</b><span>Durable functional parts</span></div>
        </div>
      </div>
    </div>
    <div>
      <div class="price-list">
        ${data.pricing.map(p => `<div class="price"><b>${p.name}</b><span>${p.desc}</span><b>${p.price}</b></div>`).join('')}
      </div>
      <p class="note">Minimum order ₹400 · Delivery in Bhubaneswar · India-wide shipping at cost</p>
    </div>
  </div>
</section>

<section class="order" id="order">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">How to order</p>
        <h2 class="title">From your idea<br>to your hands.</h2>
      </div>
      <p>Most orders are ready in 2–5 days. Timing is confirmed before printing begins.</p>
    </div>
    <div class="steps">
      <article class="step"><span class="number">1</span><h3>Send the idea</h3><p>Send a photo, sketch or STL on <a href="${data.site.instagram}" target="_blank" rel="noopener noreferrer"><svg class="icon" aria-hidden="true"><use href="#icon-instagram"/></svg>Instagram</a> or <a href="${data.site.whatsapp_url}" target="_blank" rel="noopener noreferrer"><svg class="icon" aria-hidden="true"><use href="#icon-whatsapp"/></svg>WhatsApp</a>.</p></article>
      <article class="step"><span class="number">2</span><h3>Design & Print Check</h3><p>Confirm dimensions, material, colours and whether design help is needed.</p></article>
      <article class="step"><span class="number">3</span><h3>Quote & Approval</h3><p>Price, expected timeline, and advance. A small advance starts the print.</p></article>
      <article class="step"><span class="number">4</span><h3>Print & Quality Check</h3><p>Slice, print, inspect and finish.</p></article>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Why DDPrinterZ</p>
        <h2 class="title">Local care.<br>Professional output.</h2>
      </div>
    </div>
    <div class="why">
      <div><b>True multicolour</b><span>Bambu Lab AMS for vivid, integrated colour.</span></div>
      <div><b>Fast & local</b><span>Made in Bhubaneswar without the intercity wait.</span></div>
      <div><b>Maker-direct</b><span>Speak with the person making your print.</span></div>
      <div><b>Quality checked</b><span>Inspected and finished before delivery.</span></div>
    </div>
  </div>
</section>

<section id="faq">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">FAQ</p>
        <h2 class="title">Common questions</h2>
      </div>
    </div>
    <div class="faq-list" style="display:grid; gap: 24px;">
      ${data.faq.map(f => `<div class="faq-item"><h3 style="margin:0 0 8px; font-size:1.1rem; color:var(--ink);">${f.q}</h3><p style="margin:0; color:var(--muted);">${f.a}</p></div>`).join('')}
    </div>
  </div>
</section>

<section>
  <div class="wrap maker">
    <div class="maker-photo" role="img" aria-label="Green low-poly meditating figure printed by DDPrinterZ"></div>
    <div class="maker-copy">
      <p class="eyebrow">Meet your maker</p>
      <blockquote>“I started DDPrinterZ to make custom 3D printing personal, approachable and local to Bhubaneswar.”</blockquote>
      <p>I’m DinuDante—an engineering maker printing your objects locally in Bhubaneswar. You work directly with me from the first reference image to the final quality check.</p>
      <p><strong>DinuDante · Founder, DDPrinterZ</strong></p>
    </div>
  </div>
</section>

<section id="contact">
  <div class="wrap">
    <div class="contact">
      <p class="eyebrow">Start a print with DinuDante</p>
      <h2 class="title">What should we<br>make together?</h2>
      <p>Send me your idea—even if it’s rough. I’ll help with the next step and reply with a clear quote.</p>
      <div class="actions">
        <a class="btn ig" href="${data.site.instagram}" target="_blank" rel="noopener noreferrer"><svg class="icon" aria-hidden="true"><use href="#icon-instagram"/></svg>DM on Instagram</a>
        <a class="btn wa" href="${data.site.whatsapp_url}" target="_blank" rel="noopener noreferrer"><svg class="icon" aria-hidden="true"><use href="#icon-whatsapp"/></svg>WhatsApp</a>
        <a class="btn" href="mailto:${data.site.email}"><svg class="icon" aria-hidden="true"><use href="#icon-mail"/></svg>Email me</a>
      </div>
    </div>
  </div>
</section>
`;

const schema = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"DDPrinterZ","description":"Custom 3D printing in Bhubaneswar","areaServed":"Bhubaneswar, Odisha, India","email":"dineshdante.ds@gmail.com","sameAs":["https://www.instagram.com/ddprinterz/","https://www.youtube.com/@DDPrinterZ"]}</script>`;

renderPage({
  filename: 'index.html',
  path: '',
  title: 'DDPrinterZ | Custom 3D Printing in Bhubaneswar, Odisha',
  description: 'Custom 3D printing in Bhubaneswar for personalised gifts, prototypes, functional parts and multicolour models. Work directly with DinuDante.',
  content: indexContent,
  schema: schema
});

const workContent = `
<section class="work" id="work" style="padding-top: 140px;">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Real DDPrinterZ projects</p>
        <h2 class="title">Fresh off my<br>print bed.</h2>
      </div>
      <p class="muted">Every photograph below comes from the DinuDante workshop—real prints, real details, no stock imagery.</p>
    </div>
    <div class="gallery">
      ${data.projects.map(p => `
      <a class="tile" href="${p.img}">
        <div class="visual">
          <img src="${p.img_thumb}" srcset="${p.img_thumb} 640w, ${p.img} 1200w" sizes="(max-width:670px) 86vw, 24vw" alt="${p.title}" loading="lazy" width="900" height="1200" decoding="async">
        </div>
        <div class="label"><b>${p.title}</b><span>${p.desc}</span></div>
      </a>`).join('')}
    </div>
    
    <div class="head" style="margin-top: 100px;">
      <div>
        <p class="eyebrow">Watch the process</p>
        <h2 class="title">Featured DDPrinterZ Shorts</h2>
      </div>
    </div>
    <div class="video-grid">
      ${data.videos.map(v => `
      <article class="video-card">
        <div class="video-frame">
          <iframe src="https://www.youtube-nocookie.com/embed/${v.id}" title="${v.title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
        <div class="video-copy"><small>${v.tag}</small><h3>${v.title}</h3></div>
      </article>`).join('')}
    </div>
  </div>
</section>
`;

renderPage({
  filename: 'work.html',
  path: 'work.html',
  title: 'Real 3D Printing Projects | DDPrinterZ',
  description: 'View real 3D printing projects completed by DDPrinterZ in Bhubaneswar. Personalised gifts, prototypes, and detailed multicolour models.',
  content: workContent
});

const servicesContent = `
<section id="services" style="padding-top: 140px;">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">What we make</p>
        <h2 class="title">From thoughtful gifts<br>to working prototypes.</h2>
      </div>
      <p class="muted">Bring a photo, sketch or STL. We’ll turn it into a polished physical object.</p>
    </div>
    <div class="cards">
      <article class="card real-card">
        <small>01 / PERSONAL</small>
        <img class="service-photo" src="assets/services/personalised-real.webp" alt="Real red, black and white Japanese-inspired wall pieces printed by DDPrinterZ" width="900" height="900" decoding="async">
        <div>
          <h3>Personalised gifts</h3>
          <p>Nameplates, keychains, lithophane lamps and one-of-one gifts for weddings and festivals.</p>
        </div>
      </article>
      <article class="card real-card">
        <small>02 / FUNCTIONAL</small>
        <img class="service-photo" src="assets/services/functional-real.webp" alt="Real orange and white honeycomb phone stand printed by DDPrinterZ" width="900" height="900" decoding="async">
        <div>
          <h3>Prototypes & projects</h3>
          <p>Dependable PLA and PETG parts for startups, makers and engineering students.</p>
        </div>
      </article>
      <article class="card real-card">
        <small>03 / EXPRESSIVE</small>
        <img class="service-photo" src="assets/services/expressive-real.webp" alt="Real classical dance figurine printed by DDPrinterZ" width="900" height="900" decoding="async">
        <div>
          <h3>Models & décor</h3>
          <p>Architectural models, planters, figurines, organisers and Odia-inspired pieces.</p>
        </div>
      </article>
    </div>
    
    <div class="process-panel" style="margin-top: 80px;">
      <img src="assets/infographics/making-process.webp" alt="Illustrated journey from an idea sketch through 3D modelling and printing to a finished object" width="1440" height="540" loading="lazy" decoding="async">
      <div class="process-legend">
        <div><small>01</small><b>Share the idea</b></div>
        <div><small>02</small><b>Shape the model</b></div>
        <div><small>03</small><b>Print in colour</b></div>
        <div><small>04</small><b>Finish by hand</b></div>
      </div>
    </div>
  </div>
</section>
`;

renderPage({
  filename: 'services.html',
  path: 'services.html',
  title: 'Custom Gifts, Prototypes & 3D Printing Services | DDPrinterZ',
  description: 'DDPrinterZ offers custom 3D printing services in Bhubaneswar including personalised gifts, functional prototypes, and models using PLA and PETG.',
  content: servicesContent
});

const privacyContent = `
<section style="padding-top: 140px;">
  <div class="wrap" style="max-width: 800px; margin: 0 auto;">
    <h1 class="title">Privacy Policy</h1>
    <div style="margin-top: 40px; color: var(--muted); line-height: 1.8;">
      <p>Your privacy is important. DDPrinterZ operates this website to showcase 3D printing services in Bhubaneswar.</p>
      <h3 style="color: var(--ink); margin-top: 30px;">Data Collection</h3>
      <p>This static website does not use Google Analytics, Meta Pixel, or any invasive tracking scripts. We do not collect personal data when you merely browse.</p>
      <h3 style="color: var(--ink); margin-top: 30px;">Third-Party Services</h3>
      <p>Videos on this site are embedded using YouTube's privacy-enhanced mode (youtube-nocookie). When you interact with our social links (Instagram, WhatsApp), you are subject to their respective privacy policies.</p>
      <h3 style="color: var(--ink); margin-top: 30px;">Customer Content</h3>
      <p>If you share photos or designs with us for a custom order, they remain yours. A completed order is not automatically a public portfolio asset. We only use project photos publicly when permission is established or when the design is entirely owned by DDPrinterZ.</p>
    </div>
  </div>
</section>
`;

renderPage({
  filename: 'privacy.html',
  path: 'privacy.html',
  title: 'Privacy Policy | DDPrinterZ',
  description: 'Privacy Policy for DDPrinterZ custom 3D printing services in Bhubaneswar.',
  content: privacyContent
});

const policyContent = `
<section style="padding-top: 140px;">
  <div class="wrap" style="max-width: 800px; margin: 0 auto;">
    <h1 class="title">Order Policy</h1>
    <div style="margin-top: 40px; color: var(--muted); line-height: 1.8;">
      <p>DRAFT — pending owner review.</p>
      <h3 style="color: var(--ink); margin-top: 30px;">Custom Nature</h3>
      <p>All custom products are produced to approved specifications. Due to the custom nature of 3D printing, slight variations in colour or surface texture (layer lines) are a normal part of the process.</p>
      <h3 style="color: var(--ink); margin-top: 30px;">Advance Payment</h3>
      <p>A small advance payment is required to start printing, with the balance due upon completion/delivery.</p>
      <h3 style="color: var(--ink); margin-top: 30px;">Cancellations & Changes</h3>
      <p>Changes or cancellations are only possible before printing begins. Once a custom print has started, we cannot offer refunds.</p>
      <h3 style="color: var(--ink); margin-top: 30px;">Customer-Supplied Files</h3>
      <p>Customers must have the right or permission to use any designs or logos they submit. DDPrinterZ does not claim ownership of third-party trademarks or characters.</p>
      <h3 style="color: var(--ink); margin-top: 30px;">Safety</h3>
      <p>FDM prints are not certified for food contact, medical use, or load-bearing safety-critical use unless explicitly stated.</p>
    </div>
  </div>
</section>
`;

renderPage({
  filename: 'order-policy.html',
  path: 'order-policy.html',
  title: 'Order Policy | DDPrinterZ',
  description: 'Order, payment, and cancellation policies for DDPrinterZ custom 3D printing services.',
  content: policyContent
});

const notFoundContent = `
<section style="padding-top: 140px; min-height: 70vh; display: flex; align-items: center;">
  <div class="wrap" style="text-align: center;">
    <h1 class="display">404</h1>
    <p class="lead" style="margin: 20px auto; max-width: 400px; color: var(--muted);">That idea isn't on this layer.</p>
    <div class="actions" style="justify-content: center; margin-top: 40px;">
      <a class="btn" href="/">Return Home</a>
      <a class="btn ig" href="work.html">See real prints</a>
    </div>
  </div>
</section>
`;

renderPage({
  filename: '404.html',
  path: '404.html',
  title: 'Page Not Found | DDPrinterZ',
  description: 'The requested page could not be found.',
  content: notFoundContent
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${data.site.url}</loc></url>
  <url><loc>${data.site.url}work.html</loc></url>
  <url><loc>${data.site.url}services.html</loc></url>
  <url><loc>${data.site.url}privacy.html</loc></url>
  <url><loc>${data.site.url}order-policy.html</loc></url>
</urlset>`;
fs.writeFileSync('sitemap.xml', sitemap);
console.log('Generated sitemap.xml');

const robots = `User-agent: *
Allow: /
Sitemap: ${data.site.url}sitemap.xml
`;
fs.writeFileSync('robots.txt', robots);
console.log('Generated robots.txt');
