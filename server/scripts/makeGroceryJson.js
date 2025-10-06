#!/usr/bin/env node
// Generate a JSON file with N grocery products, suitable for server/scripts/importProducts.js
// Usage: node server/scripts/makeGroceryJson.js [count] [outFile]
import fs from 'fs';
import path from 'path';

const CATEGORY_SLUGS = [
  'dairy-eggs','water-beverages','sugar-tea-coffee','sweets-biscuits','processed',
  'condiments-sauces','pasta-rice','oils-ghee','cleaning','personal-care','baby'
];

const POOL = {
  'dairy-eggs': [
    ['Fresh Milk','حليب طازج'], ['Natural Yogurt','زبادي طبيعي'], ['Cheese Slices','جبنة شرائح'], ['Farm Eggs','بيض مزارع'],
    ['Labneh','لبنة'], ['Butter','زبدة'], ['Feta Cheese','جبنة فيتا'], ['Long-life Milk','حليب طويل الأجل']
  ],
  'water-beverages': [
    ['Mineral Water 600ml','مياه معدنية 600مل'], ['Water 1.5L','مياه كبيرة 1.5ل'], ['Orange Juice','عصير برتقال'],
    ['Apple Juice','عصير تفاح'], ['Cola Soda','مشروب غازي كولا'], ['Iced Tea','شاي مثلج']
  ],
  'sugar-tea-coffee': [
    ['White Sugar','سكر أبيض'], ['Brown Sugar','سكر بني'], ['Black Tea','شاي أسود'], ['Green Tea','شاي أخضر'],
    ['Arabic Coffee','قهوة عربية'], ['Turkish Coffee','قهوة تركية'], ['Instant Coffee','قهوة سريعة التحضير']
  ],
  'sweets-biscuits': [
    ['Plain Biscuits','بسكويت سادة'], ['Chocolate Biscuits','بسكويت بالشوكولاتة'], ['Wafer','ويفر'],
    ['Assorted Sweets','حلويات مشكلة'], ['Milk Chocolate','شوكولاتة بالحليب'], ['Corn Flakes','كورن فليكس']
  ],
  'processed': [
    ['Light Tuna','تونة خفيفة'], ['Foul Medames','فول مدمس'], ['Canned Chickpeas','حمص معلب'], ['Sweet Corn','ذرة حلوة'],
    ['White Beans','فاصوليا بيضاء'], ['Peas & Carrots','بازلاء وجزر']
  ],
  'condiments-sauces': [
    ['Ketchup','كاتشب'], ['Mayonnaise','مايونيز'], ['Mustard','خردل'], ['Tomato Paste','صلصة طماطم'],
    ['White Vinegar','خل أبيض'], ['Pickled Cucumber','مخلل خيار']
  ],
  'pasta-rice': [
    ['Spaghetti Pasta','مكرونة سباغيتي'], ['Penne Pasta','مكرونة بيني'], ['Basmati Rice','أرز بسمتي'],
    ['Egyptian Rice','أرز مصري'], ['Vermicelli','شعيرية'], ['Bulgur','برغل']
  ],
  'oils-ghee': [
    ['Sunflower Oil','زيت دوار الشمس'], ['Corn Oil','زيت ذرة'], ['Olive Oil','زيت زيتون'], ['Vegetable Ghee','سمن نباتي']
  ],
  'cleaning': [
    ['Dishwashing Liquid','سائل جلي'], ['Laundry Powder','مسحوق غسيل'], ['Kitchen Towels','مناديل مطبخ'],
    ['Bleach','كلور'], ['Wet Wipes','مناديل مبللة']
  ],
  'personal-care': [
    ['Shampoo','شامبو'], ['Hair Conditioner','بلسم شعر'], ['Liquid Soap','صابون سائل'], ['Toothpaste','معجون أسنان'],
    ['Toothbrush','فرشاة أسنان'], ['Deodorant','مزيل عرق']
  ],
  'baby': [
    ['Baby Diapers','حفاضات أطفال'], ['Baby Wipes','مناديل أطفال'], ['Baby Formula','حليب أطفال'], ['Baby Shampoo','شامبو أطفال']
  ]
};

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function slugify(str){
  return String(str).toLowerCase().replace(/[^a-z0-9\-\s_]+/g,'').replace(/[\s_]+/g,'-').replace(/-+/g,'-').slice(0,64);
}

function makeItem(i){
  const cat = pick(CATEGORY_SLUGS);
  const [nameEn, nameAr] = pick(POOL[cat]);
  const price = +(4 + Math.round(Math.random()*56) + Math.random()).toFixed(2);
  const oldPrice = Math.random() < 0.28 ? +(price + (1 + Math.random()*6)).toFixed(2) : null;
  const slug = slugify(`${nameEn}-${cat}-${i+1}-${Math.random().toString(36).slice(2,5)}`);
  const image = `https://images.placeholderapi.com/800x600?bg=fff&fg=333&text=${encodeURIComponent(nameEn.replace(/\s+/g,'+'))}`;
  const stock = 20 + Math.floor(Math.random()*180);
  return { slug, nameEn, nameAr, shortEn: null, shortAr: null, category: cat, price, oldPrice, stock, image };
}

const total = Number(process.argv[2]) || 100;
const outFile = path.resolve(process.argv[3] || path.join('server','data','grocery_100.json'));
const items = Array.from({ length: total }, (_,i) => makeItem(i));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(items, null, 2), 'utf8');
console.log('Wrote', items.length, 'items to', outFile);
