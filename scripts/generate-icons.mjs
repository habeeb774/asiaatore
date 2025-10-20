import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Icons are under client/public/icons in this monorepo
const clientDir = path.resolve(__dirname, '..', 'client');
const iconsDir = path.join(clientDir, 'public', 'icons');
const logoSvg = path.join(clientDir, 'public', 'logo.svg');
const src512 = path.join(iconsDir, 'pwa-512.png');
const out512 = src512; // ensure 512 exists
const out192 = path.join(iconsDir, 'pwa-192.png');

async function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
}

function isPngBinary(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 && buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;
  } catch { return false; }
}

function maybeDecodeBase64ToPng(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    if (isPngBinary(filePath)) return true; // already a valid PNG
    const txt = fs.readFileSync(filePath, 'utf8').trim();
    const base64 = txt.startsWith('data:') ? (txt.split(',')[1] || '') : txt;
    if (!base64 || base64.length < 100) return false;
    const buf = Buffer.from(base64, 'base64');
    // overwrite file with binary PNG
    fs.writeFileSync(filePath, buf);
    return isPngBinary(filePath);
  } catch { return false; }
}

async function generateFrom(inputPath, { force = false } = {}) {
  // Generate/overwrite 512 when forced or invalid
  const needWrite512 = force || !fs.existsSync(out512) || !isPngBinary(out512) || (fs.statSync(out512).size < 10_000);
  if (needWrite512) {
    await sharp(inputPath)
      .resize(512, 512, { fit: 'contain', background: { r:255,g:255,b:255,alpha:0 } })
      .png({ compressionLevel: 9 })
      .toFile(out512);
    console.log('Generated', out512);
  }
  await sharp(out512)
    .resize(192, 192, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(out192);
  console.log('Generated', out192);
}

async function main() {
  await ensureDir(iconsDir);
  try {
    // Prefer high-quality vector source when available
    if (fs.existsSync(logoSvg)) {
      await generateFrom(logoSvg, { force: true });
      return;
    }
    if (fs.existsSync(src512)) {
      // If src512 is actually a base64 placeholder or too small, try to repair then proceed
      const stat = fs.statSync(src512);
      const okSig = isPngBinary(src512);
      if (!okSig || stat.size < 10_000) {
        const repaired = maybeDecodeBase64ToPng(src512);
        if (!repaired) {
          console.warn('pwa-512.png is invalid or too small; please replace it.');
        }
      }
      await generateFrom(src512);
      return;
    }
    // Last resort: if 192 exists but is a base64 placeholder, repair it so dev build stops warning
    // If 192 exists but is a base64 placeholder, repair it
    const tried192 = maybeDecodeBase64ToPng(out192);
    if (tried192 && fs.existsSync(out192)) {
      console.log('Repaired', out192);
      return;
    }
    console.error('No source icon found. Place pwa-512.png in client/public/icons or logo.svg in client/public.');
    process.exit(1);
  } catch (err) {
    console.error('Icon generation failed:', err);
    process.exit(1);
  }
}

main();
