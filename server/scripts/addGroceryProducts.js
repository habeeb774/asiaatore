#!/usr/bin/env node
// Add N grocery products suitable for this store (no electronics or clothing).
// Usage: node server/scripts/addGroceryProducts.js [count]
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import prisma from '../db/client.js';

const OUT_DIR = path.join(process.cwd(), 'uploads', 'products');

async function ensureDir(dir){
  await fs.promises.mkdir(dir, { recursive: true });
}

const CATEGORY_SLUGS = [
  'dairy-eggs',
  'water-beverages',
  'sugar-tea-coffee',
  'sweets-biscuits',
  'processed',
  'condiments-sauces',
  'pasta-rice',
  'oils-ghee',
  'cleaning',
  'personal-care',
  'baby'
];

const POOL = {
  'dairy-eggs': [
    ['حليب طازج', 'Fresh Milk'], ['زبادي طبيعي', 'Natural Yogurt'], ['جبنة شرائح', 'Cheese Slices'], ['بيض مزارع', 'Farm Eggs'],
    ['لبنة', 'Labneh'], ['زبدة', 'Butter'], ['جبنة فيتا', 'Feta Cheese'], ['حليب طويل الأجل', 'Long-life Milk']
  ],
  'water-beverages': [
    ['مياه معدنية 600مل', 'Mineral Water 600ml'], ['مياه كبيرة 1.5ل', 'Water 1.5L'], ['عصير برتقال', 'Orange Juice'],
    ['عصير تفاح', 'Apple Juice'], ['مشروب غازي كولا', 'Cola Soda'], ['شاي مثلج', 'Iced Tea']
  ],
  'sugar-tea-coffee': [
    ['سكر أبيض', 'White Sugar'], ['سكر بني', 'Brown Sugar'], ['شاي أسود', 'Black Tea'], ['شاي أخضر', 'Green Tea'],
    ['قهوة عربية', 'Arabic Coffee'], ['قهوة تركية', 'Turkish Coffee'], ['قهوة سريعة التحضير', 'Instant Coffee']
  ],
  'sweets-biscuits': [
    ['بسكويت سادة', 'Plain Biscuits'], ['بسكويت بالشوكولاتة', 'Chocolate Biscuits'], ['ويفر', 'Wafer'],
    ['حلويات مشكلة', 'Assorted Sweets'], ['شوكولاتة بالحليب', 'Milk Chocolate'], ['كورن فليكس', 'Corn Flakes']
  ],
  'processed': [
    ['تونة خفيفة', 'Light Tuna'], ['فول مدمس', 'Foul Medames'], ['حمص معلب', 'Canned Chickpeas'], ['ذرة حلوة', 'Sweet Corn'],
    ['فاصوليا بيضاء', 'White Beans'], ['بازلاء وجزر', 'Peas & Carrots']
  ],
  'condiments-sauces': [
    ['كاتشب', 'Ketchup'], ['مايونيز', 'Mayonnaise'], ['خردل', 'Mustard'], ['صلصة طماطم', 'Tomato Paste'],
    ['خل أبيض', 'White Vinegar'], ['مخلل خيار', 'Pickled Cucumber']
  ],
  'pasta-rice': [
    ['مكرونة سباغيتي', 'Spaghetti Pasta'], ['مكرونة بيني', 'Penne Pasta'], ['أرز بسمتي', 'Basmati Rice'],
    ['أرز مصري', 'Egyptian Rice'], ['شعيرية', 'Vermicelli'], ['برغل', 'Bulgur']
  ],
  'oils-ghee': [
    ['زيت دوار الشمس', 'Sunflower Oil'], ['زيت ذرة', 'Corn Oil'], ['زيت زيتون', 'Olive Oil'], ['سمن نباتي', 'Vegetable Ghee']
  ],
  'cleaning': [
    ['سائل جلي', 'Dishwashing Liquid'], ['مسحوق غسيل', 'Laundry Powder'], ['مناديل مطبخ', 'Kitchen Towels'],
    ['كلور', 'Bleach'], ['مناديل مبللة', 'Wet Wipes']
  ],
  'personal-care': [
    ['شامبو', 'Shampoo'], ['بلسم شعر', 'Hair Conditioner'], ['صابون سائل', 'Liquid Soap'], ['معجون أسنان', 'Toothpaste'],
    ['فرشاة أسنان', 'Toothbrush'], ['مزيل عرق', 'Deodorant']
  ],
  'baby': [
    ['حفاضات أطفال', 'Baby Diapers'], ['مناديل أطفال', 'Baby Wipes'], ['حليب أطفال', 'Baby Formula'], ['شامبو أطفال', 'Baby Shampoo']
  ]
};

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

async function generateImage(labelAr, labelEn, idx){
  const w=800, h=600;
  const bg = ['#0ea5e9','#22c55e','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#dc2626','#475569'];
  const color = bg[idx % bg.length];
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#ffffff22"/>
        <stop offset="100%" stop-color="#00000022"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="28" fill="${color}"/>
    <rect width="100%" height="100%" rx="28" fill="url(#g)"/>
    <text x="50%" y="46%" font-size="50" font-family="Segoe UI,Roboto,system-ui" fill="#fff" text-anchor="middle" dominant-baseline="middle">${labelAr}</text>
    <text x="50%" y="70%" font-size="26" font-family="Segoe UI,Roboto,system-ui" fill="#fff" text-anchor="middle">${labelEn}</text>
  </svg>`;
  const fileName = `groc-${Date.now()}-${idx+1}.png`;
  const outPath = path.join(OUT_DIR, fileName);
  await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(outPath);
  return `/uploads/products/${fileName}`;
}

function slugify(str){
  return String(str).toLowerCase().replace(/[^a-z0-9\-\s_]+/g,'').replace(/[\s_]+/g,'-').replace(/-+/g,'-').slice(0,64);
}

async function main(){
  const total = Number(process.argv[2]) || 100;
  await ensureDir(OUT_DIR);
  console.log(`[GROCERY] Adding ${total} products...`);
  // Ensure categories exist (create missing ones minimally)
  const existingCats = await prisma.category.findMany({ select: { slug: true } }).catch(()=>[]);
  const have = new Set(existingCats.map(c => c.slug));
  const toCreate = CATEGORY_SLUGS.filter(s => !have.has(s)).map(s => ({ slug: s, nameAr: s, nameEn: s }));
  if (toCreate.length) {
    try { await prisma.category.createMany({ data: toCreate }); console.log('[GROCERY] Created missing categories:', toCreate.map(c=>c.slug).join(', ')); } catch {}
  }
  const existingCount = await prisma.product.count();
  const creations = [];
  for (let i=0;i<total;i++){
    const cat = pick(CATEGORY_SLUGS);
    const [nameAr, nameEn] = pick(POOL[cat]);
    const base = 4 + Math.round(Math.random()*56); // 4 to ~60
    const hasDiscount = Math.random() < 0.28;
    const slugBase = `${nameEn}-${cat}`;
    const slug = slugify(`${slugBase}-${existingCount + i + 1}-${Math.random().toString(36).slice(2,5)}`);
    let image;
    try { image = await generateImage(nameAr, nameEn, i); } catch (e) {
      console.warn('[IMG] generation failed:', e.message);
      image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(nameEn)}`;
    }
    creations.push({
      slug,
      nameAr,
      nameEn,
      shortAr: null,
      shortEn: null,
      category: cat,
      price: base,
      oldPrice: hasDiscount ? base + (2 + Math.round(Math.random()*8)) : null,
      image,
      rating: 0,
      stock: 20 + Math.floor(Math.random()*180)
    });
  }
  const BATCH = 25;
  let created = 0;
  for (let off=0; off<creations.length; off+=BATCH){
    const chunk = creations.slice(off, off+BATCH);
    await prisma.product.createMany({ data: chunk });
    created += chunk.length;
    console.log(`[GROCERY] Inserted ${created}/${creations.length}`);
  }
  console.log('[GROCERY] Done. Inserted:', created);
  await prisma.$disconnect();
}

main().catch(e=>{ console.error('[GROCERY] Failed:', e); process.exit(1); });
