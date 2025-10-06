#!/usr/bin/env node
// Import real (more realistic) product data from JSON or CSV.
// Usage:
//   node server/scripts/importProducts.js path/to/file.json [--upsert]
//   node server/scripts/importProducts.js path/to/file.csv --csv [--upsert]
// Fields expected: slug, nameEn, nameAr, shortEn, shortAr, category, price, oldPrice, stock, image
// If --upsert provided: existing slug will be updated instead of skipped.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../db/client.js';

function parseArgs(){
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Usage: node server/scripts/importProducts.js <file.json|file.csv> [--csv] [--upsert]');
    process.exit(1);
  }
  const file = path.resolve(args[0]);
  const csv = args.includes('--csv') || file.toLowerCase().endsWith('.csv');
  const upsert = args.includes('--upsert');
  return { file, csv, upsert };
}

function parseCsv(text){
  const lines = text.split(/\r?\n/).filter(l=>l.trim());
  if (!lines.length) return [];
  const header = lines[0].split(',').map(h=>h.trim());
  return lines.slice(1).map(line => {
    const cols = [];
    // Simple CSV split (no quoted commas in our simple template)
    let current='';
    for (let i=0;i<line.length;i++) {
      const ch=line[i];
      if (ch===',') { cols.push(current); current=''; } else current+=ch;
    }
    cols.push(current);
    const row = {};
    header.forEach((h,i)=>{ row[h] = cols[i] !== undefined && cols[i] !== '' ? cols[i] : null; });
    return row;
  });
}

function normalize(p){
  const num = v => v === null || v === undefined || v === '' ? null : Number(v);
  return {
    slug: p.slug?.toString().trim().toLowerCase(),
    nameEn: p.nameEn?.toString().trim() || 'Product',
    nameAr: p.nameAr?.toString().trim() || 'منتج',
    shortEn: p.shortEn?.toString().trim() || null,
    shortAr: p.shortAr?.toString().trim() || null,
    category: p.category?.toString().trim().toLowerCase() || 'general',
    price: num(p.price) ?? 0,
    oldPrice: num(p.oldPrice),
    image: p.image?.toString().trim() || null,
    rating: 0,
    stock: num(p.stock) ?? 0
  };
}

async function main(){
  const { file, csv, upsert } = parseArgs();
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(2);
  }
  let rawItems;
  if (csv) {
    rawItems = parseCsv(fs.readFileSync(file,'utf8'));
  } else {
    rawItems = JSON.parse(fs.readFileSync(file,'utf8'));
  }
  const items = rawItems.map(normalize).filter(i=>i.slug);
  console.log(`[IMPORT] Loaded ${items.length} items from`, path.basename(file));
  let created=0, updated=0, skipped=0;
  for (const p of items) {
    const existing = await prisma.product.findUnique({ where:{ slug: p.slug } });
    if (existing) {
      if (upsert) {
        await prisma.product.update({ where:{ slug: p.slug }, data:{
          nameAr: p.nameAr, nameEn: p.nameEn,
          shortAr: p.shortAr, shortEn: p.shortEn,
          category: p.category, price: p.price, oldPrice: p.oldPrice,
          image: p.image, stock: p.stock
        }});
        updated++;
      } else {
        skipped++;
      }
      continue;
    }
    await prisma.product.create({ data: {
      slug: p.slug, nameAr: p.nameAr, nameEn: p.nameEn,
      shortAr: p.shortAr, shortEn: p.shortEn,
      category: p.category, price: p.price, oldPrice: p.oldPrice,
      image: p.image, rating: p.rating, stock: p.stock
    }});
    created++;
  }
  console.log(`[IMPORT] Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch(e=>{ console.error('[IMPORT] Failed:', e); process.exit(10); });
