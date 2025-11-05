import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  const outDir = path.resolve(process.cwd(), 'client', 'tests-output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ recordVideo: { dir: outDir, size: { width: 1280, height: 800 } } });
  const page = await context.newPage();

  console.log('Opening /');
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('aside', { timeout: 10000 });

  await page.waitForTimeout(300);
  const toggle = await page.$('button[title="طي / فتح القائمة"]');
  if (toggle) {
    await toggle.click();
    await page.waitForTimeout(400);
    await toggle.click();
    await page.waitForTimeout(400);
  }

  await page.hover('nav').catch(() => {});
  await page.waitForTimeout(600);

  await context.close();
  await browser.close();

  // Find the most recent .webm file in outDir
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.webm')).map(f => ({ f, m: fs.statSync(path.join(outDir, f)).mtimeMs }));
  if (files.length === 0) {
    console.error('No video file found in', outDir);
    process.exit(1);
  }
  files.sort((a,b)=>b.m-a.m);
  console.log('Saved video:', path.join(outDir, files[0].f));
}

run().catch(err=>{ console.error(err); process.exit(2); });
