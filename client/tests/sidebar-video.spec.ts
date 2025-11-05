import { test, expect } from '@playwright/test';

// Enable video recording for all tests in this file.
test.use({
  video: {
    mode: 'on',
    size: { width: 1280, height: 800 },
  },
});

// Increase timeout to allow slower environments to finish
test.setTimeout(60000);

test.describe('Sidebar Interaction Video', () => {
  test('records sidebar interaction: collapse/expand and hover', async ({ page }) => {
    await page.goto('/');

    // Wait for the sidebar to be ready
    await page.waitForSelector('.sidebar-modern', { timeout: 10000 });

    // Small pause so initial animation settles
    await page.waitForTimeout(300);

    // 1. Hover over sidebar (should not trigger peek since we disabled hover-peek)
    await page.hover('.sidebar-modern');
    await page.waitForTimeout(350);

    // 2. Open the sidebar if it's closed
    const headerBtn = page.locator('[data-testid="header-menu-button"]');
    const legacyOpenBtn = page.locator('[data-testid="sidebar-open"]');
    if (await headerBtn.count() && await headerBtn.isVisible()) {
      await headerBtn.click();
      await page.waitForTimeout(400);
    } else if (await legacyOpenBtn.count() && await legacyOpenBtn.isVisible()) {
      await legacyOpenBtn.click();
      await page.waitForTimeout(400);
    } else {
      // Reliable fallback: keyboard shortcut Alt+Shift+S
      await page.keyboard.down('Alt');
      await page.keyboard.down('Shift');
      await page.keyboard.press('S');
      await page.keyboard.up('Shift');
      await page.keyboard.up('Alt');
      await page.waitForTimeout(500);
    }

    // Ensure sidebar is open
    await page.waitForSelector('.sidebar-modern[data-open="true"]', { timeout: 5000 });

    // 3. Hover again to show that hover doesn't expand when collapsed
    await page.hover('.sidebar-modern');
    await page.waitForTimeout(350);

    // 4. Close then open again to capture both animations
    // Close using keyboard for consistency
    await page.keyboard.down('Alt');
    await page.keyboard.down('Shift');
    await page.keyboard.press('S');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Alt');
    await page.waitForSelector('.sidebar-modern[data-open="false"]', { timeout: 5000 });

    // Re-open again via keyboard
    await page.keyboard.down('Alt');
    await page.keyboard.down('Shift');
    await page.keyboard.press('S');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Alt');
    await page.waitForSelector('.sidebar-modern[data-open="true"]', { timeout: 5000 });

    // 5. Hover the nav area briefly
    await page.hover('.sidebar-modern__nav');
    await page.waitForTimeout(600);

    // Final screenshot for quick visual check
    try {
      await page.screenshot({ path: 'client/tests-output/sidebar-video-end.png', fullPage: false });
    } catch (err) {
      // if the page was closed or screenshot fails, ignore — video artifact is primary
      console.warn('Could not take final screenshot:', err);
    }

    // The test artifact (video) will be saved by Playwright.
    // Add a note to the test report.
    test.info().attachments.push({
      name: 'video-info',
      contentType: 'text/plain',
      body: Buffer.from('Video recording is automatically saved by Playwright due to test.use({ video: "on" }) config.'),
    });
  });
});
