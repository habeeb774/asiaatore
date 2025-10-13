import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'src', 'pages');
const IGNORE = new Set([
  'StyleGuide.jsx', 'OffersPage.jsx', 'CatalogPage.jsx', 'Products.jsx',
  'ProductDetailPage.jsx', 'Home.jsx', 'Chat.jsx'
]);

async function walk(dir) {
  const out = [];
  const items = await readdir(dir);
  for (const name of items) {
    const full = path.join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) out.push(...await walk(full));
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(full);
  }
  return out;
}

function strip(code) {
  const noBlock = code.replace(/\/\*[\s\S]*?\*\//g, '');
  const noLine = noBlock.replace(/^\s*\/\/.*$/gm, '');
  return noLine.trim();
}

function looksEmpty(code) {
  const s = strip(code);
  const tiny = s.length < 200;
  const hasJsx = /<[^>]+>/.test(s);
  const onlyExport = /^export\s+default\s+\w+;?$/.test(s);
  return (tiny && !hasJsx) || onlyExport;
}

(async () => {
  try {
    const files = await walk(ROOT);
    const candidates = [];
    for (const file of files) {
      const base = path.basename(file);
      if (IGNORE.has(base)) continue;
      const code = await readFile(file, 'utf8');
      if (looksEmpty(code)) {
        candidates.push(file.replace(process.cwd() + path.sep, ''));
      }
    }
    if (!candidates.length) {
      console.log('No empty/placeholder pages detected.');
      process.exit(0);
    }
    console.log('Possible empty/placeholder pages (review before removal):');
    for (const f of candidates) console.log(' -', f);
    process.exit(0);
  } catch (err) {
    console.error('Scan failed:', err.message);
    process.exit(1);
  }
})();
