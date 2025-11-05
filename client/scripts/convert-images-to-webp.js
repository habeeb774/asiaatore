#!/usr/bin/env node
// Convert JPG/PNG images to WebP using imagemin API if available.
// Usage: node scripts/convert-images-to-webp.js [--src=public/images] [--out=public/images] [--quality=80]

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const argObj = args.reduce((acc, cur) => {
  const m = cur.match(/^--([^=]+)=?(.*)$/);
  if (m) acc[m[1]] = m[2] || true;
  return acc;
}, {});

const srcDir = argObj.src || 'public/images';
const outDir = argObj.out || srcDir;
const quality = Number(argObj.quality || argObj.q || 80);

async function run() {
  try {
    const imagemin = await import('imagemin');
    const webp = await import('imagemin-webp');
    const glob = path.join(srcDir, '**/*.{jpg,png,jpeg,JPG,PNG,JPEG}');
    console.log(`Converting images from ${srcDir} -> ${outDir} (quality=${quality})`);
    const files = await imagemin.default([glob], {
      destination: outDir,
      plugins: [webp.default({ quality })]
    });
    console.log(`Converted ${files.length} files to WebP in ${outDir}`);
  } catch (err) {
    console.error('Failed to run imagemin conversion.');
    console.error('Error:', err && err.message ? err.message : err);
    console.error('\nPlease ensure devDependencies "imagemin" and "imagemin-webp" are installed in the client folder:');
    console.error('  cd client; npm install --save-dev imagemin imagemin-webp');
    process.exitCode = 2;
  }
}

run();
