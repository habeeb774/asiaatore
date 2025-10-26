const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

(async function () {
  const url = process.argv[2] || 'http://localhost:5176';
  console.log('Running lighthouse for', url);
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.PUPPETEER_CHROME || undefined,
    chromeFlags: ['--headless','--no-sandbox']
  });
  const options = {
    port: chrome.port,
    output: 'json',
    emulatedFormFactor: 'mobile',
    throttlingMethod: 'provided'
  };
  try {
    const runnerResult = await lighthouse(url, options);
    const reportJson = runnerResult.report;
    fs.writeFileSync('client/lighthouse-report.json', reportJson);
    // also write HTML
    const htmlOptions = Object.assign({}, options, { output: 'html' });
    const runnerResultHtml = await lighthouse(url, htmlOptions);
    fs.writeFileSync('client/lighthouse-report.html', runnerResultHtml.report);
    console.log('Reports saved to client/lighthouse-report.{json,html}');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await chrome.kill();
  }
})();
