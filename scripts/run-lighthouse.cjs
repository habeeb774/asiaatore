const lighthouseModule = require('lighthouse');
const lighthouse = lighthouseModule.default || lighthouseModule;
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

(async function () {
  const url = process.argv[2] || 'http://localhost:5176';
  console.log('Running lighthouse for', url);
  let chrome;
  let puppeteerInstance;
  let port = process.env.LH_PORT || 9222;
  // Try to use puppeteer to launch Chrome with a stable remote debugging port.
  try {
    const puppeteer = require('puppeteer');
    puppeteerInstance = await puppeteer.launch({
      args: [
        `--remote-debugging-port=${port}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
    });
    console.log('Launched puppeteer Chrome on port', port);
  } catch (e) {
    // Fallback to chrome-launcher
    chrome = await chromeLauncher.launch({
      chromePath: process.env.PUPPETEER_CHROME || undefined,
      chromeFlags: ['--headless','--no-sandbox','--disable-features=IsolateOrigins,site-per-process']
    });
    port = chrome.port;
  }

  const options = {
    port,
    output: 'json',
    emulatedFormFactor: 'mobile',
    throttlingMethod: 'provided'
  };
  try {
      const runnerResult = await lighthouse(url, options);
      const reportJson = runnerResult.report;
      const repoRoot = require('path').resolve(__dirname, '..');
      const outJson = require('path').join(repoRoot, 'client', 'lighthouse-report.json');
      const outHtml = require('path').join(repoRoot, 'client', 'lighthouse-report.html');
      fs.writeFileSync(outJson, reportJson);
      // also write HTML
      const htmlOptions = Object.assign({}, options, { output: 'html' });
      const runnerResultHtml = await lighthouse(url, htmlOptions);
      fs.writeFileSync(outHtml, runnerResultHtml.report);
    console.log('Reports saved to client/lighthouse-report.{json,html}');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    try {
      if (puppeteerInstance) {
        await puppeteerInstance.close();
      }
      if (chrome && chrome.kill) {
        await chrome.kill();
      }
    } catch (e) {
      // ignore
    }
  }
})();
