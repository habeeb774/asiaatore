import fs from 'fs/promises';
import path from 'path';
import imagemin from 'imagemin';
import webp from 'imagemin-webp';
import { fileURLToPath } from 'url';

// Directories to scan (relative to repo root)
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

async function convertFile(file, opts) {
  try {
    const ext = path.extname(file).toLowerCase();
    if (!exts.has(ext)) return null;
    if (file.endsWith('.webp')) return null;

    const buf = await fs.readFile(file);
    const before = buf.length;

    const outBuf = await imagemin.buffer(buf, { plugins: [webp({ quality: opts.quality })] });
    const after = outBuf.length;

    if (!opts.dryRun) {
      const outPath = file.replace(/\.[a-zA-Z0-9]+$/, '.webp');
      await fs.writeFile(outPath, outBuf);
    }

    return { file, before, after };
  } catch (e) {
    console.error('convert error', file, e && e.message ? e.message : e);
    return { file, error: String(e) };
  }
}

async function main() {
  const args = parseArgs();
  const found = [];
  for (const d of TARGET_DIRS) {
    const abs = path.resolve(ROOT, d);
    try {
      const st = await fs.stat(abs).catch(() => null);
      if (!st || !st.isDirectory()) continue;
      for await (const f of walk(abs)) found.push(f);
    } catch (e) {
      // ignore
    }
  }

  console.log(`Found ${found.length} files to scan`);

  const results = [];
  for (const f of found) {
    const res = await convertFile(f, args);
    if (res) results.push(res);
  }

  const converted = results.filter(r => r && !r.error && typeof r.after === 'number').length;
  console.log(`Converted ${converted} files to WebP${args.dryRun ? ' (dry-run, no files written)' : ''}`);

  if (args.report) {
    const withSizes = results.filter(r => r && !r.error && typeof r.before === 'number');
    const totalBefore = withSizes.reduce((s, r) => s + r.before, 0);
    const totalAfter = withSizes.reduce((s, r) => s + r.after, 0);
    const saved = totalBefore - totalAfter;
    const pct = totalBefore ? Math.round((saved / totalBefore) * 100) : 0;
    console.log('\nSize report:');
    console.log(`  Files considered: ${results.length}`);
    console.log(`  Converted (would write): ${converted}`);
    console.log(`  Total before: ${(totalBefore/1024).toFixed(1)} KB`);
    console.log(`  Total after:  ${(totalAfter/1024).toFixed(1)} KB`);
    console.log(`  Savings: ${(saved/1024).toFixed(1)} KB (${pct}%)`);

    // show top 10 savings
    const items = withSizes.map(r => ({ file: r.file, before: r.before, after: r.after, saved: r.before - r.after }));
    items.sort((a,b) => b.saved - a.saved);
    console.log('\nTop savings (by bytes):');
    for (const it of items.slice(0, 10)) {
      console.log(` - ${path.relative(ROOT, it.file)} : ${(it.before/1024).toFixed(1)}KB -> ${(it.after/1024).toFixed(1)}KB  saved ${(it.saved/1024).toFixed(1)}KB`);
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main().catch(e => { console.error(e); process.exit(1); });
}

