/*
 * Lab performance measurement. These are laboratory numbers from one machine
 * with a simulated slow connection; they are not field Core Web Vitals and no
 * field data exists for this site.
 *
 * Usage: node tools/qa-perf.js [baseUrl]
 */
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const BASE = process.argv[2] || 'http://localhost:4173';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGES = ['/', '/services.html', '/work.html', '/order-policy.html'];
const out = [];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--hide-scrollbars'],
  });

  for (const url of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

    const client = await page.createCDPSession();
    await client.send('Network.enable');
    /* Roughly "Slow 4G": 1.6 Mbps down, 750 Kbps up, 150 ms RTT. */
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      latency: 150,
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const transfer = { total: 0, byType: {} };
    page.on('response', async (res) => {
      try {
        const len = Number(res.headers()['content-length'] || 0);
        const type = (res.headers()['content-type'] || 'other').split(';')[0];
        const size = len || (await res.buffer().then((b) => b.length).catch(() => 0));
        transfer.total += size;
        transfer.byType[type] = (transfer.byType[type] || 0) + size;
      } catch (e) {}
    });

    await page.evaluateOnNewDocument(() => {
      window.__lcp = 0;
      window.__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__lcp = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto(BASE + url, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));

    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      return {
        lcp: Math.round(window.__lcp),
        cls: Number(window.__cls.toFixed(4)),
        fcp: fcp ? Math.round(fcp.startTime) : null,
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
        load: Math.round(nav.loadEventEnd || 0),
        requests: performance.getEntriesByType('resource').length + 1,
      };
    });

    out.push({
      url,
      ...m,
      transferKB: Math.round(transfer.total / 1024),
      byType: Object.fromEntries(
        Object.entries(transfer.byType).map(([k, v]) => [k, Math.round(v / 1024) + 'KB']),
      ),
    });
    console.log(
      `${url.padEnd(20)} LCP ${String(m.lcp).padStart(5)}ms  CLS ${String(m.cls).padStart(6)}  FCP ${String(m.fcp).padStart(5)}ms  ${m.requests} requests  ${Math.round(transfer.total / 1024)}KB`,
    );
    await page.close();
  }

  fs.writeFileSync('tools/qa-perf.json', JSON.stringify(out, null, 2));
  await browser.close();
})();
