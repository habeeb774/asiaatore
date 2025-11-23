import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', m => console.log('PAGE LOG', m.type(), m.text()));
  page.on('pageerror', err => console.error('PAGE ERROR', err.message, err.stack));
  try {
    await page.goto('http://localhost:5173/admin', { waitUntil: 'load', timeout: 60000 });
    // allow some time for client to hydrate and render
    await page.waitForTimeout(1500);
    // print partial DOM to log to assist debugging
    const bodyHtml = await page.evaluate(() => document.body.innerHTML.slice(0, 8829));
    console.log('BODY_HTML_SNIPPET', bodyHtml);
    // If our client injected a safe console capture, print the last few entries
    try {
      const captured = await page.evaluate(() => (window.__capturedConsoleErrors || null));
      console.log('CAPTURED_ERRORS', JSON.stringify(captured ? captured.slice(-10) : null, null, 2));
    } catch (e) {
      console.log('CAPTURED_ERRORS', 'eval failed', e && e.message);
    }
    // click first edit button (title="تعديل") to trigger edit flow — if present
    const editBtn = await page.$('button[title="تعديل"]');
    if (editBtn) {
      console.log('Clicking edit button to trigger inline form focus...');
      await editBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.error('Navigation error', e.stack || e.message || e);
  } finally {
    await browser.close();
  }
})();
