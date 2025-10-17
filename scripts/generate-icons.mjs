import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(__dirname, '..');
const iconsDir = path.join(root, 'public', 'icons');
const src512 = path.join(iconsDir, 'pwa-512.png');
const out192 = path.join(iconsDir, 'pwa-192.png');

async function main() {
  if (!fs.existsSync(src512)) {
    console.error('Source icon not found:', src512);
    process.exit(1);
  }
  try {
    await sharp(src512)
      .resize(192, 192, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toFile(out192);
    console.log('Generated', out192);
  } catch (err) {
    console.error('Failed to generate 192x192 icon:', err);
    process.exit(1);
  }
}

main();
