import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const ROOT = process.cwd();
const TARGET_DIRS = [
  path.join('uploads'),
  path.join('client', 'public', 'images'),
  path.join('client', 'public')
];
const exts = new Set(['.jpg', '.jpeg', '.png']);

async function* walk(dir) {
  for (const name of await fs.readdir(dir)) {
    const full = path.join(dir, name);
    const stat = await fs.stat(full);
    if (stat.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dryRun: false, quality: 80, report: false };
  for (const a of args) {
    if (a === '--dry-run' || a === '-n') out.dryRun = true;
    else if (a.startsWith('--quality=')) out.quality = Number(a.split('=')[1]) || out.quality;
    else if (a.startsWith('--q=')) out.quality = Number(a.split('=')[1]) || out.quality;
    else if (a === '--report') out.report = true;
  }
  return out;
}

async function convert(file, opts) {
  try {
    const ext = path.extname(file).toLowerCase();
    if (!exts.has(ext)) return null;
    if (file.endsWith('.webp')) return null;
    const outPath = file.replace(/\.[a-zA-Z0-9]+$/, '.webp');
    const stat = await fs.stat(file).catch(() => null);
    if (!stat) return null;
    const before = stat.size;

    if (!opts.dryRun) {
      await sharp(file).webp({ quality: opts.quality }).toFile(outPath);
      const st2 = await fs.stat(outPath).catch(() => null);
      const after = st2 ? st2.size : 0;
      return { file, before, after };
    } else {
      // dry-run: estimate using in-memory conversion
      const buf = await sharp(file).webp({ quality: opts.quality }).toBuffer();
      return { file, before, after: buf.length };
    }
  } catch (e) {
    return { file, error: String(e) };
  }
}

async function main() {
  const opts = parseArgs();
  const found = [];
  for (const d of TARGET_DIRS) {
    const abs = path.resolve(ROOT, d);
    const st = await fs.stat(abs).catch(() => null);
    if (!st || !st.isDirectory()) continue;
    for await (const f of walk(abs)) found.push(f);
  }

  console.log(`Found ${found.length} files to scan (sharp)`);
  const results = [];
  for (const f of found) {
    const res = await convert(f, opts);
    if (res) results.push(res);
  }

  const converted = results.filter(r => r && !r.error && typeof r.after === 'number').length;
  console.log(`Converted ${converted} files to WebP${opts.dryRun ? ' (dry-run)' : ''}`);

  if (opts.report) {
    const withSizes = results.filter(r => r && !r.error && typeof r.before === 'number');
    const totalBefore = withSizes.reduce((s, r) => s + r.before, 0);
    const totalAfter = withSizes.reduce((s, r) => s + r.after, 0);
    const saved = totalBefore - totalAfter;
    const pct = totalBefore ? Math.round((saved / totalBefore) * 100) : 0;
    console.log('\nSize report (sharp):');
    console.log(`  Files considered: ${results.length}`);
    console.log(`  Converted: ${converted}`);
    console.log(`  Total before: ${(totalBefore/1024).toFixed(1)} KB`);
    console.log(`  Total after:  ${(totalAfter/1024).toFixed(1)} KB`);
    console.log(`  Savings: ${(saved/1024).toFixed(1)} KB (${pct}%)`);
  }
}

if (import.meta.url === `file://${process.cwd()}/client/scripts/convert-images-with-sharp.js` || process.argv[1] && process.argv[1].endsWith('convert-images-with-sharp.js')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
