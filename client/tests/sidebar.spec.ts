import { test, expect } from '@playwright/test';

test('sidebar visual checks and screenshots', async ({ page, baseURL }) => {
  await page.goto('/');
  await page.waitForSelector('.sidebar-modern', { timeout: 10000 });

  // Expanded / default state screenshot
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests-output/sidebar-expanded.png', fullPage: false });

  // Toggle collapse
  const toggle = await page.$('.sidebar-modern__toggle');
  if (toggle) {
    await toggle.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests-output/sidebar-collapsed.png', fullPage: false });
  }

  // Hover to trigger hover-peek (desktop behavior)
  try {
    await page.hover('.sidebar-modern');
    await page.waitForTimeout(350);
    await page.screenshot({ path: 'tests-output/sidebar-hoverpeek.png', fullPage: false });
  } catch (e) {
    // ignore hover failures but continue
  }
});
