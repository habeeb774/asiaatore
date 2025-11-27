# 📁 الملفات المطلوبة للنشر على السيرفر

## 🎯 قائمة الملفات والمجلدات التي يجب رفعها

### 📦 **الملفات الأساسية (مطلوبة للنشر)**

```
my-store/
├── 📁 server/                    # Backend files
│   ├── 📄 index.js               # Main server file
│   ├── 📄 package.json           # Server dependencies
│   ├── 📄 package-lock.json      # Lock file for dependencies
│   ├── 📁 middleware/            # Custom middleware
│   ├── 📁 routes/                # API routes
│   ├── 📁 utils/                 # Server utilities
│   ├── 📁 uploads/               # File upload directory (create if not exists)
│   └── 📄 .env.production        # Production environment variables
│
├── 📁 client/                    # Frontend build output
│   └── 📁 dist/                  # Built frontend files
│       ├── 📄 index.html         # Main HTML file
│       ├── 📁 assets/            # Static assets (JS, CSS, images, fonts)
│       ├── 📄 sw.js              # Service worker
│       ├── 📄 manifest.webmanifest # PWA manifest
│       └── 📄 registerSW.js      # Service worker registration
│
├── 📁 prisma/                    # Database files
│   ├── 📄 schema.prisma          # Database schema
│   ├── 📁 migrations/            # Database migrations
│   └── 📄 seed.js                # Database seed data (optional)
│
├── 📄 package.json               # Root package.json
├── 📄 package-lock.json          # Root lock file
├── 📄 .gitignore                 # Git ignore file
└── 📄 DEPLOYMENT_CHECKLIST.md    # Deployment guide
```

## 🚀 **طريقة النشر خطوة بخطوة**

### 1. **تحضير الملفات للنشر**

```bash
# 1. بناء الواجهة الأمامية
cd client
npm run build

# 2. بناء الواجهة الخلفية
cd ../server
npm run build

# 3. التأكد من وجود مجلد dist
ls -la client/dist/
```

### 2. **الملفات التي يجب رفعها (Method 1: Full Upload)**

#### **الخيار الأفضل**: رفـع المشروع بالكامل
```bash
# رفع المجلدات التالية:
- server/ (بما في ذلك node_modules بعد التنصيب على السيرفر)
- client/dist/ (ملفات البناء النهائية)
- prisma/ (ملفات قاعدة البيانات)
- package.json (الملف الرئيسي)
- package-lock.json (ملف القفل)
- .env.production (متغيرات البيئة)
```

#### **الخيار الأصغر**: رفع الملفات الأساسية فقط
```bash
# الملفات الدنيا المطلوبة:
server/index.js
server/package.json
server/.env.production
client/dist/
prisma/schema.prisma
package.json
```

### 3. **الملفات التي يجب NOT رفعها**

```
❌ لا ترفع هذه الملفات:
├── 📁 client/src/               # Source code (not needed in production)
├── 📁 client/public/             # Public folder (built into dist/)
├── 📁 node_modules/              # Install on server
├── 📁 .git/                      # Git repository
├── 📄 .env.development           # Development environment
├── 📄 vite.config.js             # Vite config (development)
├── 📄 README.md                  # Documentation
└── 📄 .gitignore                 # Git ignore file
```

## 📋 **قائمة التحقق قبل الرفع**

### ✅ **التحقق من الملفات المطلوبة**

```bash
# التحقق من وجود ملفات البناء
[✓] client/dist/index.html
[✓] client/dist/assets/ (جميع ملفات JS/CSS)
[✓] client/dist/sw.js
[✓] client/dist/manifest.webmanifest

# التحقق من ملفات السيرفر
[✓] server/index.js
[✓] server/package.json
[✓] server/.env.production (مع القيم الحقيقية)

# التحقق من ملفات قاعدة البيانات
[✓] prisma/schema.prisma
[✓] prisma/migrations/ (إذا موجودة)
```

### 🔧 **الإعدادات على السيرفر**

```bash
# 1. رفع الملفات إلى السيرفر
scp -r server/ user@server:/path/to/app/
scp -r client/dist/ user@server:/path/to/app/client/
scp -r prisma/ user@server:/path/to/app/
scp package.json user@server:/path/to/app/

# 2. على السيرفر: تنصيب الاعتماديات
cd /path/to/app
npm install
cd server
npm install

# 3. إعداد قاعدة البيانات
npx prisma migrate deploy
npx prisma generate

# 4. إضافة بيانات أولية (اختياري)
npx prisma db seed

# 5. تشغيل التطبيق
npm start
```

## 🎯 **الملفات النهائية للنشر (Minimal Set)**

### **إذا كنت تريد أقل عدد من الملفات:**

```
📁 minimal-deployment/
├── 📁 server/
│   ├── 📄 index.js
│   ├── 📄 package.json
│   ├── 📁 middleware/
│   ├── 📁 routes/
│   ├── 📁 utils/
│   └── 📄 .env.production
├── 📁 client/
│   └── 📁 dist/
│       ├── 📄 index.html
│       ├── 📁 assets/
│       ├── 📄 sw.js
│       └── 📄 manifest.webmanifest
├── 📁 prisma/
│   ├── 📄 schema.prisma
│   └── 📁 migrations/
├── 📄 package.json
└── 📄 package-lock.json
```

## 🚨 **ملاحظات هامة**

### **⚠️ تنبيهات الأمان**
1. **لا ترفع أبداً** ملفات `.env` التي تحتوي على مفاتيح حقيقية
2. **تأكد** من أن `.env.production` يحتوي على قيم الإنتاج الحقيقية
3. **لا ترفع** `node_modules` - قم بتنصيبها على السيرفر

### **📝 أفضل الممارسات**
1. **استخدم** Git للنشر: `git clone` ثم `npm install`
2. **احتفظ** بملفات المصدر على السيرفر للتحديثات المستقبلية
3. **استخدم** PM2 لإدارة العملية في الإنتاج
4. **اعد** Nginx كـ reverse proxy للـ SSL

### **🔄 للتحديثات المستقبلية**
```bash
# للتحديثات، فقط ارفع:
- client/dist/ (الواجهة الأمامية المحدثة)
- server/ (الملفات المحدثة للواجهة الخلفية)
- prisma/migrations/ (إذا كانت هناك تغييرات في قاعدة البيانات)
```

---

## 🎯 **الخلاصة**

**الملفات الأساسية المطلوبة**:
- `server/` (الواجهة الخلفية)
- `client/dist/` (الواجهة الأمامية المبنية)
- `prisma/` (قاعدة البيانات)
- `package.json` (الاعتماديات)
- `.env.production` (إعدادات الإنتاج)

**الأفضل**: رفع المشروع بالكامل وتنصيب الاعتماديات على السيرفر.
