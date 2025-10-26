import puppeteer from 'puppeteer';

(async function(){
  const url = process.env.URL || 'http://localhost:4173/';
  console.log('Opening', url);
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(20000);
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Wait for root to render a bit
    const hasHome = await page.$('.home-page-wrapper') !== null;
    const hasProduct = await page.$('.product-card') !== null;
    console.log(JSON.stringify({ ok: true, hasHome, hasProduct }));
    await page.screenshot({ path: 'reports/home-preview.png', fullPage: true });
    await browser.close();
    process.exit(hasHome ? 0 : 2);
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: String(e) }));
    process.exit(1);
  }
})();
