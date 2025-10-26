const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function run() {
  const base = process.argv[2] || 'http://127.0.0.1:5173';
  const outDir = path.resolve(__dirname, '../reports/screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pages = ['/', '/delivery', '/delivery/summary'];
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1366, height: 768 }
  ];

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    // prevent heavy animations during screenshots
    await page.evaluateOnNewDocument(() => {
      try { document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important'); } catch {}
    });

    for (const p of pages) {
      const url = new URL(p, base).href;
      for (const vp of viewports) {
        await page.setViewport({ width: vp.width, height: vp.height });
        const filename = `${p === '/' ? 'home' : p.replace(/\//g, '_').replace(/^_/, '')}-${vp.name}.png`;
        const outPath = path.join(outDir, filename);
        try {
          console.log('Loading', url, 'viewport', vp.name);
          const navTimeout = vp.name === 'desktop' ? 90000 : 45000;
          await page.setDefaultNavigationTimeout(navTimeout);
          await page.goto(url, { waitUntil: 'load', timeout: navTimeout });
          // small delay for SPA hydration
          await new Promise((r) => setTimeout(r, 900));
          await page.screenshot({ path: outPath, fullPage: false });
          console.log('Saved', outPath);
        } catch (err) {
          console.warn('Failed to capture', url, vp.name, err && err.message);
        }
      }
    }

    await page.close();
  } finally {
    await browser.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
