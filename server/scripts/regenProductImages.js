#!/usr/bin/env node
// Regenerate local images for products and update product.image to /uploads/products/...
// Usage: node server/scripts/regenProductImages.js [count]
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import prisma from '../db/client.js';

const OUT_DIR = path.join(process.cwd(), 'uploads', 'products');

async function ensureDir(dir){
  await fs.promises.mkdir(dir, { recursive: true });
}

async function makeImage(nameAr, nameEn, idx){
  const w=800, h=600;
  const colors = ['#065f46','#0ea5e9','#4d7c0f','#f59e0b','#dc2626','#8b5cf6','#14b8a6','#374151'];
  const color = colors[idx % colors.length];
  const ar = (nameAr || '').slice(0, 22) || 'منتج';
  const en = (nameEn || '').slice(0, 26) || 'Product';
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff22"/>
        <stop offset="100%" stop-color="#00000022"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="28" fill="${color}"/>
    <rect width="100%" height="100%" rx="28" fill="url(#g)"/>
    <text x="50%" y="46%" font-size="50" font-family="Segoe UI,Roboto,system-ui" fill="#fff" text-anchor="middle" dominant-baseline="middle">${ar}</text>
    <text x="50%" y="70%" font-size="26" font-family="Segoe UI,Roboto,system-ui" fill="#fff" text-anchor="middle">${en}</text>
  </svg>`;
  const fileName = `regen-${Date.now()}-${Math.random().toString(36).slice(2,6)}.png`;
  const outPath = path.join(OUT_DIR, fileName);
  await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(outPath);
  return `/uploads/products/${fileName}`;
}

async function main(){
  const limit = Number(process.argv[2]) || 120;
  await ensureDir(OUT_DIR);
  console.log('[REGEN] Selecting products to update images...');
  // Pick recent products whose image is missing or remote placeholder
  const list = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id:true, nameAr:true, nameEn:true, image:true }
  });
  const targets = list.filter(p => !p.image || !p.image.startsWith('/uploads/'));
  console.log(`[REGEN] Will update ${targets.length} products (of ${list.length}).`);
  let done = 0;
  for (let i=0;i<targets.length;i++){
    const p = targets[i];
    try {
      const img = await makeImage(p.nameAr, p.nameEn, i);
      await prisma.product.update({ where: { id: p.id }, data: { image: img } });
      done++;
      if (done % 10 === 0) console.log(`[REGEN] ${done}/${targets.length} updated`);
    } catch (e) {
      console.warn('[REGEN] Failed for', p.id, e.message);
    }
  }
  console.log('[REGEN] Done. Updated', done, 'products.');
  await prisma.$disconnect();
}

main().catch(e=>{ console.error('[REGEN] Fatal:', e); process.exit(1); });
