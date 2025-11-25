import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';

;(async function () {
  const url = process.argv[2] || process.env.LH_URL || 'http://localhost:5176';
  console.log('Running lighthouse for', url);
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.PUPPETEER_CHROME || undefined,
    chromeFlags: [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-cache',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio'
    ]
  });
  const formFactor = process.env.LH_FORM_FACTOR || 'mobile';
  const throttlingMethod = process.env.LH_THROTTLING || 'simulate';
  const options = {
    port: chrome.port,
    output: 'json',
    emulatedFormFactor: formFactor,
    throttlingMethod,
    onlyCategories: process.env.LH_CATEGORIES ? process.env.LH_CATEGORIES.split(',') : undefined,
  };
  try {
    const runnerResult = await lighthouse(url, options);
    const reportJson = runnerResult.report;
    fs.writeFileSync('client/lighthouse-report.json', reportJson);
    // also write HTML
    const htmlOptions = { ...options, output: 'html' };
    const runnerResultHtml = await lighthouse(url, htmlOptions);
    fs.writeFileSync('client/lighthouse-report.html', runnerResultHtml.report);
    const summary = {
      requestedUrl: url,
      formFactor,
      throttlingMethod,
      performanceScore: runnerResult.lhr.categories.performance.score,
      firstContentfulPaint: runnerResult.lhr.audits['first-contentful-paint'].displayValue,
      largestContentfulPaint: runnerResult.lhr.audits['largest-contentful-paint'].displayValue,
      totalBlockingTime: runnerResult.lhr.audits['total-blocking-time'].displayValue,
      timeToInteractive: runnerResult.lhr.audits['interactive'].displayValue,
      speedIndex: runnerResult.lhr.audits['speed-index'].displayValue,
    };
    fs.writeFileSync('client/lighthouse-summary.json', JSON.stringify(summary, null, 2));
    console.log('Summary:', summary);
    console.log('Reports saved to client/lighthouse-report.{json,html}');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await chrome.kill();
  }
})();
