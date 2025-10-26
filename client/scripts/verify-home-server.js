import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const distDir = path.resolve(process.cwd(), 'dist');
const port = 4173;

function serve() {
  const server = http.createServer((req, res) => {
    try {
      const urlPath = req.url.split('?')[0];
      let filePath = path.join(distDir, decodeURIComponent(urlPath));
      if (urlPath === '/' || urlPath === '') filePath = path.join(distDir, 'index.html');
      fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
          // Try index.html fallback
          const index = path.join(distDir, 'index.html');
          fs.readFile(index, (e, data) => {
            if (e) { res.writeHead(404); res.end('Not found'); return; }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
          });
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const ct = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.woff2': 'font/woff2',
          '.json': 'application/json'
        }[ext] || 'application/octet-stream';
        fs.createReadStream(filePath).pipe(res);
        res.setHeader && res.setHeader('Content-Type', ct);
      });
    } catch (e) {
      res.writeHead(500);
      res.end('Server error');
    }
  });
  return new Promise((resolve, reject) => {
    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

(async ()=>{
  console.log('Serving', distDir, 'on', port);
  const server = await serve();
  try {
    const url = `http://localhost:${port}/`;
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(20000);
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Wait up to 5s for hydration to render product cards
    const hasHome = await page.$('.home-page-wrapper') !== null;
    const hasProduct = await page.$('.product-card') !== null;
    console.log(JSON.stringify({ ok:true, url, hasHome, hasProduct }));
    try { fs.mkdirSync(path.resolve(process.cwd(),'..','reports'), { recursive: true }); } catch {}
    await page.screenshot({ path: path.resolve(process.cwd(),'..','reports','home-preview.png'), fullPage: true });
    await browser.close();
    server.close();
    process.exit(hasHome ? 0 : 2);
  } catch (e) {
    console.error(JSON.stringify({ ok:false, error: String(e) }));
    try { server.close(); } catch {}
    process.exit(1);
  }
})();
