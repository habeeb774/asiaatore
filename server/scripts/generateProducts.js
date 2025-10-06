#!/usr/bin/env node
// Generate 100 demo products each with a generated PNG image using sharp.
// Usage: node server/scripts/generateProducts.js [count]
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import prisma from '../db/client.js';

const OUT_DIR = path.join(process.cwd(), 'uploads', 'products');

async function ensureDir(dir){
  await fs.promises.mkdir(dir, { recursive: true });
}

function productCategories(){
  return [
    'electronics','fashion','grocery','beauty','sports','books','home','toys','kitchen','gadgets'
  ];
}

async function generateImage(index){
  const w=800, h=600;
  const bgColors = ['#1d4ed8','#059669','#9333ea','#be123c','#0f766e','#92400e','#065f46','#4d7c0f'];
  const color = bgColors[index % bgColors.length];
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="24" fill="${color}"/>
    <text x="50%" y="50%" font-size="64" font-family="system-ui,Segoe UI,Roboto" fill="#fff" text-anchor="middle" dominant-baseline="middle">P${index+1}</text>
    <text x="50%" y="85%" font-size="28" font-family="system-ui,Segoe UI,Roboto" fill="#fff" text-anchor="middle">Demo Product ${index+1}</text>
  </svg>`;
  const fileName = `prod-${Date.now()}-${index+1}.png`;
  const outPath = path.join(OUT_DIR, fileName);
  await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(outPath);
  return `/uploads/products/${fileName}`; // public URL path
}

async function main(){
  const total = Number(process.argv[2]) || 100;
  if (total <= 0) {
    console.error('Count must be > 0');
    process.exit(1);
  }
  await ensureDir(OUT_DIR);
  console.log(`[GEN] Generating ${total} products with images...`);
  const cats = productCategories();
  const existing = await prisma.product.count();
  const creations = [];
  for (let i=0;i<total;i++) {
    // generate image first
    // we do serially to avoid overwhelming sharp on Windows; can batch later
    // In case of error we continue
    let imagePath;
    try { imagePath = await generateImage(i); } catch(e){
      console.warn('[GEN] Image generation failed for index', i, e.message);
      imagePath = `https://via.placeholder.com/800x600?text=P${i+1}`;
    }
    const basePrice = 10 + (i % 50) + Math.round(Math.random()*20);
    const hasDiscount = i % 5 === 0;
    creations.push({
      slug: `gen-product-${existing + i + 1}-${Math.random().toString(36).slice(2,6)}`,
      nameAr: `منتج توليدي ${existing + i + 1}`,
      nameEn: `Generated Product ${existing + i + 1}`,
      shortAr: 'وصف آلي قصير',
      shortEn: 'Auto generated short description',
      category: cats[i % cats.length],
      price: basePrice,
      oldPrice: hasDiscount ? basePrice + 15 : null,
      image: imagePath,
      rating: (i % 5) + 1,
      stock: 50 - (i % 10)
    });
  }
  // Insert in batches to avoid hitting parameter limits
  const batchSize = 25;
  let created = 0;
  for (let offset=0; offset<creations.length; offset+=batchSize){
    const slice = creations.slice(offset, offset+batchSize);
    await prisma.product.createMany({ data: slice });
    created += slice.length;
    console.log(`[GEN] Inserted ${created}/${creations.length}`);
  }
  console.log('[GEN] Done. Total products inserted:', created);
  await prisma.$disconnect();
}

main().catch(e=>{ console.error('[GEN] Failed:', e); process.exit(1); });