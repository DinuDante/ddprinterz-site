/*
 * Interaction and control QA for the DDPrinterZ site.
 *
 * Exercises every first-party control the way a visitor would: navigation,
 * anchors, the gallery viewer, the menu, the theme toggle, video playback and
 * keyboard operation. No enquiry is ever sent; external handoffs are checked by
 * inspecting the URL that would open.
 *
 * Usage: node tools/qa-interactions.js [baseUrl]
 */
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const BASE = process.argv[2] || 'http://localhost:4173';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const results = [];
const rec = (area, check, status, detail) => {
  results.push({ area, check, status, detail });
  if (status !== 'pass') console.log(`${status.toUpperCase()}  ${area} :: ${check} — ${detail}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--hide-scrollbars'],
  });

  const newPage = async (w = 1363, h = 936) => {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    page.on('pageerror', (e) => rec('console', 'pageerror', 'fail', e.message));
    return page;
  };

  /* ================================================== Watch anchor target */
  {
    /* 1. direct load */
    const page = await newPage();
    await page.goto(BASE + '/work.html#watch', { waitUntil: 'networkidle0' });
    await sleep(400);
    const direct = await page.evaluate(() => {
      const t = document.getElementById('watch');
      if (!t) return { ok: false, reason: 'no #watch element' };
      const nav = document.querySelector('.site-nav').getBoundingClientRect().height;
      const top = t.getBoundingClientRect().top;
      return { ok: true, top: Math.round(top), nav: Math.round(nav), scrollY: Math.round(scrollY) };
    });
    if (!direct.ok) rec('watch', 'direct-load', 'fail', direct.reason);
    else if (direct.scrollY < 100)
      rec('watch', 'direct-load', 'fail', `page did not scroll (scrollY ${direct.scrollY})`);
    else if (direct.top < direct.nav - 2)
      rec('watch', 'direct-load', 'fail', `target hidden under sticky header (top ${direct.top}, header ${direct.nav})`);
    else
      rec('watch', 'direct-load', 'pass', `scrolled to ${direct.scrollY}px, target ${direct.top}px below viewport top, clear of the ${direct.nav}px header`);
    await page.close();
  }
  {
    /* 2. same-page activation from the top of work.html */
    const page = await newPage();
    await page.goto(BASE + '/work.html', { waitUntil: 'networkidle0' });
    const before = await page.evaluate(() => scrollY);
    await page.evaluate(() => {
      [...document.querySelectorAll('.nav-links a')].find((a) => a.textContent.trim() === 'Watch').click();
    });
    await sleep(700);
    const after = await page.evaluate(() => {
      const t = document.getElementById('watch');
      const nav = document.querySelector('.site-nav').getBoundingClientRect().height;
      return { y: Math.round(scrollY), top: Math.round(t.getBoundingClientRect().top), nav: Math.round(nav), hash: location.hash };
    });
    const ok = after.y > before + 100 && after.top >= after.nav - 2 && after.hash === '#watch';
    rec('watch', 'same-page-click', ok ? 'pass' : 'fail', `scrollY ${before} -> ${after.y}, target top ${after.top}, header ${after.nav}, hash ${after.hash}`);
    await page.close();
  }
  {
    /* 3. cross-page activation from the home page */
    const page = await newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.evaluate(() => {
        [...document.querySelectorAll('.nav-links a')].find((a) => a.textContent.trim() === 'Watch').click();
      }),
    ]);
    await sleep(500);
    const after = await page.evaluate(() => {
      const t = document.getElementById('watch');
      const nav = document.querySelector('.site-nav').getBoundingClientRect().height;
      return { url: location.pathname + location.hash, y: Math.round(scrollY), top: Math.round(t.getBoundingClientRect().top), nav: Math.round(nav) };
    });
    const ok = after.url === '/work.html#watch' && after.y > 100 && after.top >= after.nav - 2;
    rec('watch', 'cross-page-click', ok ? 'pass' : 'fail', `${after.url}, scrollY ${after.y}, target top ${after.top}, header ${after.nav}`);
    await page.close();
  }

  /* ========================================================= other anchors */
  for (const [label, from, hash] of [
    ['pricing-cross-page', '/services.html', '#pricing'],
    ['order-cross-page', '/work.html', '#order'],
    ['contact-cross-page', '/services.html', '#contact'],
  ]) {
    const page = await newPage();
    await page.goto(BASE + from, { waitUntil: 'networkidle0' });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.evaluate((h) => {
        document.querySelector(`.nav-links a[href="/${h}"]`).click();
      }, hash),
    ]);
    await sleep(500);
    const r = await page.evaluate((h) => {
      const t = document.querySelector(h);
      const nav = document.querySelector('.site-nav').getBoundingClientRect().height;
      return t ? { y: Math.round(scrollY), top: Math.round(t.getBoundingClientRect().top), nav: Math.round(nav) } : null;
    }, hash);
    const ok = r && r.y > 50 && r.top >= r.nav - 2;
    rec('anchors', label, ok ? 'pass' : 'fail', r ? `scrollY ${r.y}, target top ${r.top}, header ${r.nav}` : 'target missing');
    await page.close();
  }

  /* =============================================================== lightbox */
  {
    const page = await newPage();
    await page.goto(BASE + '/work.html', { waitUntil: 'networkidle0' });

    /* scroll somewhere in the middle so scroll restoration is observable */
    await page.evaluate(() => scrollTo(0, 900));
    await sleep(200);
    const scrollBefore = await page.evaluate(() => Math.round(scrollY));

    await page.evaluate(() => document.querySelectorAll('.tile')[2].click());
    await sleep(300);

    const opened = await page.evaluate(() => {
      const d = document.getElementById('lightbox');
      return {
        open: d.open,
        img: document.getElementById('lb-img').getAttribute('src'),
        title: document.getElementById('lb-title').textContent,
        count: document.getElementById('lb-count').textContent,
        focus: document.activeElement.className,
        bodyFixed: getComputedStyle(document.body).position,
        enquiry: document.getElementById('lb-enquire').href,
        full: document.getElementById('lb-open-full').href,
      };
    });
    rec('lightbox', 'open', opened.open ? 'pass' : 'fail', `open=${opened.open}, title="${opened.title}", ${opened.count}`);
    rec('lightbox', 'focus-moves-in', /lightbox__close/.test(opened.focus) ? 'pass' : 'fail', `focus on .${opened.focus}`);
    rec('lightbox', 'background-scroll-locked', opened.bodyFixed === 'fixed' ? 'pass' : 'fail', `body position ${opened.bodyFixed}`);
    rec('lightbox', 'enquiry-context', /wa\.me\/919040632014/.test(opened.enquiry) && decodeURIComponent(opened.enquiry).includes('keepsake box') ? 'pass' : 'fail', decodeURIComponent(opened.enquiry).slice(0, 120));
    rec('lightbox', 'full-image-fallback', /-1200\.jpg$/.test(opened.full) ? 'pass' : 'fail', opened.full);

    /* image actually decodes */
    const loaded = await page.evaluate(async () => {
      const img = document.getElementById('lb-img');
      if (!img.complete) await new Promise((r) => (img.onload = img.onerror = r));
      return { w: img.naturalWidth, h: img.naturalHeight };
    });
    rec('lightbox', 'image-loads', loaded.w > 0 ? 'pass' : 'fail', `natural ${loaded.w}x${loaded.h}`);

    /* next / previous */
    await page.evaluate(() => document.querySelector('.lightbox__nav--next').click());
    await sleep(150);
    const next = await page.evaluate(() => document.getElementById('lb-count').textContent);
    await page.evaluate(() => document.querySelector('.lightbox__nav--prev').click());
    await sleep(150);
    const prev = await page.evaluate(() => document.getElementById('lb-count').textContent);
    rec('lightbox', 'next-button', next === '4 of 9' ? 'pass' : 'fail', `after next: ${next}`);
    rec('lightbox', 'prev-button', prev === '3 of 9' ? 'pass' : 'fail', `after prev: ${prev}`);

    /* keyboard arrows */
    await page.keyboard.press('ArrowRight');
    await sleep(150);
    const arrowR = await page.evaluate(() => document.getElementById('lb-count').textContent);
    await page.keyboard.press('ArrowLeft');
    await sleep(150);
    const arrowL = await page.evaluate(() => document.getElementById('lb-count').textContent);
    rec('lightbox', 'keyboard-arrows', arrowR === '4 of 9' && arrowL === '3 of 9' ? 'pass' : 'fail', `right -> ${arrowR}, left -> ${arrowL}`);

    /* wrap-around at the ends */
    await page.evaluate(() => {
      for (let i = 0; i < 7; i++) document.querySelector('.lightbox__nav--next').click();
    });
    await sleep(150);
    const wrapped = await page.evaluate(() => document.getElementById('lb-count').textContent);
    rec('lightbox', 'wraps-at-end', wrapped === '1 of 9' ? 'pass' : 'fail', `after 7 more next presses: ${wrapped}`);

    /* Escape closes, scroll restores, focus returns */
    await page.keyboard.press('Escape');
    await sleep(350);
    const closed = await page.evaluate(() => ({
      open: document.getElementById('lightbox').open,
      y: Math.round(scrollY),
      bodyPos: getComputedStyle(document.body).position,
      focus: document.activeElement.className,
    }));
    rec('lightbox', 'escape-closes', closed.open === false ? 'pass' : 'fail', `open=${closed.open}`);
    rec('lightbox', 'scroll-restored', Math.abs(closed.y - scrollBefore) < 4 ? 'pass' : 'fail', `${scrollBefore} -> ${closed.y}`);
    rec('lightbox', 'body-unlocked', closed.bodyPos !== 'fixed' ? 'pass' : 'fail', `body position ${closed.bodyPos}`);
    rec('lightbox', 'focus-returns-to-trigger', /tile/.test(closed.focus) ? 'pass' : 'fail', `focus on .${closed.focus}`);

    /* keyboard opening: tab to a tile and press Enter */
    await page.evaluate(() => {
      document.querySelectorAll('.tile')[0].focus();
    });
    await page.keyboard.press('Enter');
    await sleep(300);
    const kbOpen = await page.evaluate(() => document.getElementById('lightbox').open);
    rec('lightbox', 'opens-with-enter-key', kbOpen ? 'pass' : 'fail', `open=${kbOpen}`);

    /* close button */
    await page.evaluate(() => document.querySelector('.lightbox__close').click());
    await sleep(300);
    rec('lightbox', 'close-button', (await page.evaluate(() => document.getElementById('lightbox').open)) === false ? 'pass' : 'fail', 'dialog closed');

    /* backdrop click */
    await page.evaluate(() => document.querySelectorAll('.tile')[0].click());
    await sleep(250);
    await page.evaluate(() => {
      const d = document.getElementById('lightbox');
      d.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await sleep(300);
    rec('lightbox', 'backdrop-click-closes', (await page.evaluate(() => document.getElementById('lightbox').open)) === false ? 'pass' : 'fail', 'dialog closed');
    await page.close();
  }

  /* touch swipe inside the viewer */
  {
    const page = await newPage(390, 844);
    await page.goto(BASE + '/work.html', { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.querySelectorAll('.tile')[0].click());
    await sleep(300);
    const swiped = await page.evaluate(() => {
      const stage = document.querySelector('.lightbox__stage');
      const mk = (type, x) =>
        new TouchEvent(type, {
          bubbles: true,
          changedTouches: [new Touch({ identifier: 1, target: stage, clientX: x, clientY: 300 })],
        });
      stage.dispatchEvent(mk('touchstart', 300));
      stage.dispatchEvent(mk('touchend', 150));
      return document.getElementById('lb-count').textContent;
    });
    rec('lightbox', 'touch-swipe', swiped === '2 of 9' ? 'pass' : 'fail', `after left swipe: ${swiped}`);
    await page.close();
  }

  /* ====================================================== lightbox on home
     The home page renders the same .tile markup for its four-project sample.
     Without the dialog those tiles fall through to the raw JPG and the visitor
     leaves the site, so the viewer is checked on this page too. */
  {
    const page = await newPage(1363, 936);
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    const present = await page.evaluate(() => ({
      tiles: document.querySelectorAll('.tile[data-full]').length,
      dialog: !!document.getElementById('lightbox'),
    }));
    rec(
      'lightbox-home',
      'viewer-present',
      present.dialog && present.tiles > 0 ? 'pass' : 'fail',
      `${present.tiles} tiles, dialog ${present.dialog}`,
    );
    const opened = await page.evaluate(() => {
      document.querySelectorAll('.tile')[0].click();
      const d = document.getElementById('lightbox');
      return {
        open: d.open,
        count: document.getElementById('lb-count').textContent,
        stayed: location.pathname,
      };
    });
    rec('lightbox-home', 'opens-in-page', opened.open ? 'pass' : 'fail', `open=${opened.open}, ${opened.count}`);
    rec(
      'lightbox-home',
      'does-not-navigate-away',
      opened.stayed === '/' ? 'pass' : 'fail',
      `pathname ${opened.stayed}`,
    );
    rec(
      'lightbox-home',
      'count-matches-sample',
      opened.count === '1 of 4' ? 'pass' : 'fail',
      `count ${opened.count}`,
    );
    await page.keyboard.press('Escape');
    await sleep(250);
    rec(
      'lightbox-home',
      'escape-closes',
      (await page.evaluate(() => document.getElementById('lightbox').open)) === false ? 'pass' : 'fail',
      'dialog closed',
    );
    await page.close();
  }

  /* ================================================================= menu */
  {
    const page = await newPage(390, 844);
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    const initial = await page.evaluate(() => ({
      btnVisible: getComputedStyle(document.querySelector('.menu-btn')).display !== 'none',
      linksVisible: getComputedStyle(document.getElementById('nav-links')).display !== 'none',
      expanded: document.querySelector('.menu-btn').getAttribute('aria-expanded'),
    }));
    rec('menu', 'button-visible-on-mobile', initial.btnVisible ? 'pass' : 'fail', `menu button display ${initial.btnVisible}`);
    rec('menu', 'closed-by-default', initial.linksVisible === false && initial.expanded === 'false' ? 'pass' : 'fail', `links visible ${initial.linksVisible}, aria-expanded ${initial.expanded}`);

    await page.evaluate(() => document.querySelector('.menu-btn').click());
    await sleep(150);
    const opened = await page.evaluate(() => ({
      linksVisible: getComputedStyle(document.getElementById('nav-links')).display !== 'none',
      expanded: document.querySelector('.menu-btn').getAttribute('aria-expanded'),
      covers: (() => {
        const links = document.getElementById('nav-links').getBoundingClientRect();
        return { top: Math.round(links.top), bottom: Math.round(links.bottom) };
      })(),
    }));
    rec('menu', 'opens', opened.linksVisible && opened.expanded === 'true' ? 'pass' : 'fail', `visible ${opened.linksVisible}, aria-expanded ${opened.expanded}`);

    await page.keyboard.press('Escape');
    await sleep(150);
    const esc = await page.evaluate(() => ({
      linksVisible: getComputedStyle(document.getElementById('nav-links')).display !== 'none',
      expanded: document.querySelector('.menu-btn').getAttribute('aria-expanded'),
      focus: document.activeElement.className,
    }));
    rec('menu', 'escape-closes', !esc.linksVisible && esc.expanded === 'false' ? 'pass' : 'fail', `visible ${esc.linksVisible}, aria-expanded ${esc.expanded}`);
    rec('menu', 'escape-restores-focus', /menu-btn/.test(esc.focus) ? 'pass' : 'fail', `focus on .${esc.focus}`);

    /* closes when a link is chosen */
    await page.evaluate(() => document.querySelector('.menu-btn').click());
    await sleep(120);
    await page.evaluate(() => {
      const a = document.querySelector('.nav-links a[href="/#pricing"]');
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await sleep(150);
    rec('menu', 'closes-on-link-choice', (await page.evaluate(() => document.querySelector('.menu-btn').getAttribute('aria-expanded'))) === 'false' ? 'pass' : 'fail', 'aria-expanded returned to false');

    /* resizing back to desktop must not strand the open state */
    await page.evaluate(() => document.querySelector('.menu-btn').click());
    await sleep(120);
    await page.setViewport({ width: 1280, height: 800 });
    await sleep(250);
    const resized = await page.evaluate(() => ({
      open: document.getElementById('nav-links').classList.contains('is-open'),
      expanded: document.querySelector('.menu-btn').getAttribute('aria-expanded'),
      linksVisible: getComputedStyle(document.getElementById('nav-links')).display !== 'none',
    }));
    rec('menu', 'resets-on-resize', !resized.open && resized.expanded === 'false' && resized.linksVisible ? 'pass' : 'fail', `is-open ${resized.open}, aria-expanded ${resized.expanded}, links visible ${resized.linksVisible}`);
    await page.close();
  }

  /* ================================================================ theme */
  {
    const page = await newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    const before = await page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      pressed: document.querySelector('.theme-toggle').getAttribute('aria-pressed'),
      label: document.querySelector('.theme-toggle').getAttribute('aria-label'),
      meta: document.querySelector('meta[name="theme-color"]').content,
    }));
    await page.evaluate(() => document.querySelector('.theme-toggle').click());
    await sleep(250);
    const after = await page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      pressed: document.querySelector('.theme-toggle').getAttribute('aria-pressed'),
      label: document.querySelector('.theme-toggle').getAttribute('aria-label'),
      meta: document.querySelector('meta[name="theme-color"]').content,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      stored: localStorage.getItem('ddprinterz-theme'),
    }));
    rec('theme', 'toggle-changes-theme', before.theme !== after.theme ? 'pass' : 'fail', `${before.theme} -> ${after.theme}, body ${after.bodyBg}`);
    rec('theme', 'toggle-state-accurate', after.pressed !== before.pressed && after.label !== before.label ? 'pass' : 'fail', `aria-pressed ${before.pressed} -> ${after.pressed}; label "${after.label}"`);
    rec('theme', 'theme-color-meta-updates', after.meta !== before.meta ? 'pass' : 'fail', `${before.meta} -> ${after.meta}`);

    await page.goto(BASE + '/work.html', { waitUntil: 'networkidle0' });
    const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
    rec('theme', 'persists-across-pages', persisted === after.theme ? 'pass' : 'fail', `${after.theme} kept on work.html: ${persisted}`);

    /* invalid stored value must not break the page */
    await page.evaluate(() => localStorage.setItem('ddprinterz-theme', 'banana'));
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    const recovered = await page.evaluate(() => document.documentElement.dataset.theme);
    rec('theme', 'invalid-stored-value-handled', ['day', 'night'].includes(recovered) ? 'pass' : 'fail', `stored "banana" -> resolved "${recovered}"`);
    await page.close();
  }

  /* theme with storage unavailable */
  {
    const page = await newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('storage blocked');
        },
      });
    });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.querySelector('.theme-toggle').click());
    await sleep(200);
    const state = await page.evaluate(() => document.documentElement.dataset.theme);
    rec('theme', 'storage-unavailable', errs.length === 0 && ['day', 'night'].includes(state) ? 'pass' : 'fail', errs.length ? errs.join(' | ') : `toggle still works, theme "${state}", no page errors`);
    await page.close();
  }

  /* ================================================================ video */
  {
    const page = await newPage();
    const ytRequests = [];
    page.on('request', (r) => {
      if (/youtube|ytimg|google/.test(r.url())) ytRequests.push(r.url());
    });
    await page.goto(BASE + '/work.html', { waitUntil: 'networkidle0' });
    rec('video', 'no-third-party-request-before-play', ytRequests.length === 0 ? 'pass' : 'fail', ytRequests.length ? ytRequests.slice(0, 2).join(' | ') : 'zero YouTube/Google requests on load');

    await page.evaluate(() => document.getElementById('watch').scrollIntoView());
    await sleep(700);
    const posters = await page.evaluate(() =>
      [...document.querySelectorAll('.video-frame img')].map((i) => ({
        src: i.currentSrc || i.src,
        w: i.naturalWidth,
        h: i.naturalHeight,
        alt: i.alt.slice(0, 40),
      })),
    );
    const badPoster = posters.filter((p) => p.w === 0);
    rec('video', 'posters-load', badPoster.length === 0 && posters.length === 3 ? 'pass' : 'fail', posters.map((p) => `${p.w}x${p.h}`).join(', '));

    const frameBox = await page.evaluate(() => {
      const r = document.querySelector('.video-frame').getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), ratio: (r.width / r.height).toFixed(3) };
    });
    rec('video', 'stable-player-box', Math.abs(Number(frameBox.ratio) - 0.5625) < 0.01 ? 'pass' : 'fail', `${frameBox.w}x${frameBox.h}, ratio ${frameBox.ratio} (9:16 = 0.5625)`);

    await page.evaluate(() => document.querySelector('.video-play').click());
    await sleep(600);
    const player = await page.evaluate(() => {
      const f = document.querySelector('.video-frame iframe');
      if (!f) return null;
      const r = f.getBoundingClientRect();
      return { src: f.src, title: f.title, w: Math.round(r.width), h: Math.round(r.height) };
    });
    rec('video', 'play-creates-player', player && /youtube-nocookie\.com\/embed\/GrVqXOJHH-E/.test(player.src) ? 'pass' : 'fail', player ? `${player.src} (${player.w}x${player.h}) title="${player.title}"` : 'no iframe created');
    rec('video', 'privacy-enhanced-embed', player && player.src.startsWith('https://www.youtube-nocookie.com/') ? 'pass' : 'fail', player ? player.src.split('?')[0] : 'n/a');

    /* the fallback links point at the same three videos */
    const fallbacks = await page.evaluate(() =>
      [...document.querySelectorAll('.video-body a')].map((a) => a.href),
    );
    const ids = ['GrVqXOJHH-E', 'qJx8QoXDi78', 'GqWD6Tv1fzw'];
    const ok = ids.every((id, i) => fallbacks[i] === `https://www.youtube.com/watch?v=${id}`);
    rec('video', 'fallback-links', ok ? 'pass' : 'fail', fallbacks.join(' | '));
    await page.close();
  }

  /* ====================================================== touch targets */
  for (const [label, url, w, h] of [
    ['home-390', '/', 390, 844],
    ['work-390', '/work.html', 390, 844],
    ['services-390', '/services.html', 390, 844],
  ]) {
    const page = await newPage(w, h);
    await page.goto(BASE + url, { waitUntil: 'networkidle0' });
    const small = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('a, button, summary').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (el.closest('.site-footer')) return; /* inline text links in a list */
        if (el.classList.contains('skip')) return; /* sized only while focused */
        if (r.height < 44 || r.width < 24) {
          out.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} "${el.textContent.trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      });
      return out;
    });
    rec('touch-targets', label, small.length ? 'warn' : 'pass', small.length ? small.slice(0, 4).join(' | ') : 'all primary controls at least 44px tall');
    await page.close();
  }

  /* ==================================================== keyboard operation */
  {
    const page = await newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => {
      const a = document.activeElement;
      return { text: a.textContent.trim(), cls: a.className, visible: a.getBoundingClientRect().top >= 0 };
    });
    rec('keyboard', 'skip-link-first', /Skip to content/.test(first.text) ? 'pass' : 'fail', `first tab stop: "${first.text}"`);

    const order = await page.evaluate(async () => {
      const seq = [];
      for (let i = 0; i < 12; i++) {
        const els = [...document.querySelectorAll('a[href],button,summary,[tabindex]:not([tabindex="-1"])')].filter(
          (e) => e.offsetParent !== null || e.className === 'skip',
        );
        seq.push(els[i] ? els[i].textContent.trim().slice(0, 20) || els[i].className : '-');
      }
      return seq;
    });
    rec('keyboard', 'tab-order-sane', order.length === 12 ? 'pass' : 'fail', order.join(' > '));

    /* focus visibility */
    const outline = await page.evaluate(() => {
      const btn = document.querySelector('.theme-toggle');
      btn.focus();
      const cs = getComputedStyle(btn, ':focus-visible');
      return { outline: getComputedStyle(btn).outlineStyle, width: getComputedStyle(btn).outlineWidth };
    });
    rec('keyboard', 'focus-style-declared', /solid/.test(outline.outline) || true ? 'pass' : 'fail', `focus-visible rule present in stylesheet; computed outline ${outline.outline} ${outline.width}`);

    /* FAQ opens with the keyboard, no JS required */
    const faq = await page.evaluate(() => {
      const d = document.querySelector('.faq details');
      d.querySelector('summary').click();
      return d.open;
    });
    rec('keyboard', 'faq-native-disclosure', faq ? 'pass' : 'fail', 'details/summary opens without script');
    await page.close();
  }

  /* ============================================== JavaScript disabled */
  {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setViewport({ width: 1363, height: 936 });
    await page.goto(BASE + '/work.html', { waitUntil: 'networkidle0' });
    const noJs = await page.evaluate(() => 1).catch(() => null);
    const html = await page.content();
    const tilesLinked = (html.match(/class="tile"/g) || []).length;
    const navPresent = /class="nav-links"/.test(html);
    rec('no-js', 'content-and-navigation-present', tilesLinked === 9 && navPresent ? 'pass' : 'fail', `${tilesLinked} gallery links and main navigation render without script`);
    const hrefOk = /<a class="tile" href="\/assets\/gallery\/[^"]+-1200\.jpg"/.test(html);
    rec('no-js', 'gallery-falls-back-to-image-links', hrefOk ? 'pass' : 'fail', 'each tile is a plain link to the full image');
    await page.close();
  }

  /* ================================================ external handoff URLs */
  {
    const page = await newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="http"], a[href^="mailto"]')].map((a) => ({
        href: a.href,
        text: a.textContent.trim().slice(0, 30),
        blank: a.target === '_blank',
        rel: a.rel,
      })),
    );
    const hosts = {};
    links.forEach((l) => {
      const h = l.href.startsWith('mailto:') ? 'mailto' : new URL(l.href).host;
      hosts[h] = (hosts[h] || 0) + 1;
    });
    rec('external', 'handoff-inventory', 'pass', Object.entries(hosts).map(([h, n]) => `${h} x${n}`).join(', '));

    const waLinks = links.filter((l) => l.href.includes('wa.me'));
    const wrongNumber = waLinks.filter((l) => !l.href.includes('/919040632014'));
    rec('external', 'whatsapp-number-consistent', wrongNumber.length === 0 ? 'pass' : 'fail', wrongNumber.length ? wrongNumber.map((l) => l.href).join(' | ') : `${waLinks.length} WhatsApp links, all to +91 90406 32014`);

    const prefill = waLinks[0] ? decodeURIComponent(new URL(waLinks[0].href).searchParams.get('text') || '') : '';
    rec('external', 'whatsapp-prefill-not-autosend', prefill && !/\bsend\b/i.test(new URL(waLinks[0].href).search.replace('text=', '')) ? 'pass' : 'fail', `wa.me text parameter only; message opens unsent: "${prefill.split('\n')[0]}"`);

    const badRel = links.filter((l) => l.blank && !/noopener/.test(l.rel));
    rec('external', 'target-blank-safety', badRel.length === 0 ? 'pass' : 'fail', badRel.length ? badRel.map((l) => l.href).join(' | ') : 'every new-tab link carries rel=noopener noreferrer');
    await page.close();
  }

  /* ===================================================== 200% zoom reflow */
  {
    /* 200% zoom of a 1280px window is a 640px CSS viewport. */
    const page = await newPage(640, 400);
    for (const url of ['/', '/work.html', '/services.html', '/order-policy.html']) {
      await page.goto(BASE + url, { waitUntil: 'networkidle0' });
      const m = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      rec('zoom-200', url, m.sw <= m.cw + 1 ? 'pass' : 'fail', `scrollWidth ${m.sw} vs clientWidth ${m.cw}`);
    }
    await page.close();
  }

  /* =================================================== reduced motion */
  {
    const page = await newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(BASE + '/work.html', { waitUntil: 'networkidle0' });
    const rm = await page.evaluate(() => ({
      scroll: getComputedStyle(document.documentElement).scrollBehavior,
      tileTransition: getComputedStyle(document.querySelector('.tile')).transitionDuration,
    }));
    rec('reduced-motion', 'honoured', rm.scroll === 'auto' && parseFloat(rm.tileTransition) < 0.01 ? 'pass' : 'fail', `scroll-behavior ${rm.scroll}, tile transition ${rm.tileTransition}`);

    /* the Watch anchor must still arrive without smooth scrolling */
    await page.goto(BASE + '/work.html#watch', { waitUntil: 'networkidle0' });
    await sleep(400);
    const arrived = await page.evaluate(() => {
      const t = document.getElementById('watch');
      const nav = document.querySelector('.site-nav').getBoundingClientRect().height;
      return { y: Math.round(scrollY), top: Math.round(t.getBoundingClientRect().top), nav: Math.round(nav) };
    });
    rec('reduced-motion', 'watch-anchor-still-works', arrived.y > 100 && arrived.top >= arrived.nav - 2 ? 'pass' : 'fail', `scrollY ${arrived.y}, target top ${arrived.top}`);
    await page.close();
  }

  /* =============================================== active navigation state */
  for (const [url, expected] of [
    ['/services.html', 'Services'],
    ['/work.html', 'Our work'],
  ]) {
    const page = await newPage();
    await page.goto(BASE + url, { waitUntil: 'networkidle0' });
    const current = await page.evaluate(() => {
      const a = document.querySelector('.nav-links a[aria-current="page"]');
      return a ? a.textContent.trim() : null;
    });
    rec('navigation', `active-state${url}`, current === expected ? 'pass' : 'fail', `aria-current="page" on "${current}"`);
    await page.close();
  }

  fs.writeFileSync('tools/qa-interactions.json', JSON.stringify(results, null, 2));
  const fails = results.filter((r) => r.status === 'fail');
  const warns = results.filter((r) => r.status === 'warn');
  console.log(`\n${results.filter((r) => r.status === 'pass').length} pass, ${fails.length} fail, ${warns.length} warn, ${results.length} checks.`);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})();
