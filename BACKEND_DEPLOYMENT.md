# 🚀 تعليمات نشر الباكند (Backend)

## 📦 ملفات الباكند المجهزة للنشر

تم إنشاء ملف مضغوط يحتوي على جميع ملفات الباكند اللازمة للنشر:

**📁 اسم الملف**: `backend-files.zip` (372 KB)
**📍 الموقع**: `c:\Users\Habeeb\Desktop\my-store\backend-files.zip`

## 📋 محتويات ملف الباكند

### 🗂️ **الملفات الرئيسية**
- `index.js` (30 KB) - نقطة الدخول الرئيسية للخادم
- `server.js` (3.4 KB) - إعدادات الخادم الأساسية
- `app.js` - إعدادات Express.js
- `package.json` (1.2 KB) - الاعتماديات والسكربتات
- `package-lock.json` (193 KB) - نسخة محددة من الاعتماديات

### 🔧 **ملفات الإعدادات**
- `.env.example` (589 B) - مثال على متغيرات البيئة
- `.env.development` (2.9 KB) - إعدادات التطوير
- `.env.production` (3.4 KB) - إعدادات الإنتاج
- `.env.staging` (2.8 KB) - إعدادات الاختبار
- `vercel.json` (181 B) - إعدادات Vercel

### 🗄️ **قاعدة البيانات**
- `prisma/` - مجلد مخططات Prisma
  - `schema.prisprisma` - مخطط قاعدة البيانات
- `db/` - ملفات الاتصال بقاعدة البيانات
- `baseline.sql` (29 KB) - نسخة احتياطية لقاعدة البيانات

### 💳 **ملفات الدفع والتحصيل**
- `stripe.js` (9.3 KB) - تكامل Stripe للدفع
- `paypal.js` (22 KB) - تكامل PayPal للدفع
- `stc.js` (16 KB) - تكامل STC Pay للدفع
- `bank.js` (10 KB) - معالجة الدفع البنكي

### 🛍️ **وحدات التطبيق**
- `controllers/` (49 ملف) - متحكمات API
  - `authController.js` - المصادقة والتسجيل
  - `productController.js` - إدارة المنتجات
  - `orderController.js` - إدارة الطلبات
  - `userController.js` - إدارة المستخدمين
  - `paymentController.js` - معالجة الدفع
  - وغيرها...

- `services/` (6 ملفات) - خدمات الأعمال
  - `emailService.js` - خدمة الإيميل
  - `smsService.js` - خدمة الرسائل
  - `paymentService.js` - خدمة الدفع
  - وغيرها...

- `middleware/` (5 ملفات) - البرمجيات الوسيطة
  - `auth.js` - التحقق من المصادقة
  - `validation.js` - التحقق من البيانات
  - `rateLimit.js` - تحديد معدل الطلبات
  - وغيرها...

- `routes/` - مسارات API
- `utils/` (19 ملف) - أدوات مساعدة
- `validation/` (4 ملفات) - قواعد التحقق

### 📦 **الاعتماديات الرئيسية**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "stripe": "^14.0.0",
    "paypal-rest-sdk": "^1.8.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.0.0"
  }
}
```

## 🔧 **خطوات النشر**

### 1. فك الضغط والتحضير
```bash
# على السيرفر
unzip backend-files.zip
cd server

# تثبيت الاعتماديات
npm install --production
```

### 2. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة البيانات PostgreSQL
createdb my_store_db

# تشغيل ترحيلات Prisma
npx prisma migrate deploy
npx prisma generate
```

### 3. إعداد متغيرات البيئة
```bash
# نسخ ملف الإعدادات
cp .env.example .env

# تعديل المتغيرات الهامة:
DATABASE_URL="postgresql://username:password@localhost:5432/my_store_db"
JWT_SECRET="your-super-secret-jwt-key-here"
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# إعدادات الدفع
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
```

### 4. تشغيل الخادم
```bash
# للتطوير
npm run dev

# للإنتاج
npm start

# باستخدام PMProcess (مستحسن)
pm2 start ecosystem.config.js
```

## 🗄️ **إعدادات قاعدة البيانات**

### PostgreSQL
```sql
-- إنشاء مستخدم وقاعدة بيانات
CREATE USER my_store_user WITH PASSWORD 'secure_password';
CREATE DATABASE my_store_db OWNER my_store_user;
GRANT ALL PRIVILEGES ON DATABASE my_store_db TO my_store_user;
```

### Prisma Schema
```prisma
// أهم النماذج في قاعدة البيانات
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  image       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Order {
  id        String   @id @default(cuid())
  userId    String
  total     Float
  status    OrderStatus @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔒 **إعدادات الأمان**

### 1. متغيرات البيئة الحساسة
```bash
# يجب تغيير هذه القيم في الإنتاج
JWT_SECRET="generate-strong-secret-here"
ENCRYPTION_KEY="generate-32-character-key-here"
DATABASE_URL="secure-database-connection-string"
```

### 2. HTTPS و SSL
```bash
# استخدام Let's Encrypt للشهادات
certbot --nginx -d yourdomain.com
```

### 3. جدار الحماية
```bash
# فتح المنافذ الضرورية فقط
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

## 🚀 **إعدادات الإنتاج**

### 1. Nginx Proxy
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-store-api',
    script: './index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## 📊 **المراقبة والتسجيل**

### 1. Logs
```bash
# مشاهدة السجلات
pm2 logs my-store-api

# سجلات الأخطاء
tail -f logs/err.log
```

### 2. Monitoring
```bash
# حالة PM2
pm2 status

# مراقبة الأداء
pm2 monit
```

## 🔍 **الاختبار بعد النشر**

### 1. اختبار API
```bash
# اختبار الصحة
curl https://api.yourdomain.com/health

# اختبار المصادقة
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### 2. اختبار قاعدة البيانات
```bash
# التحقق من اتصال قاعدة البيانات
npx prisma db pull
```

## 🆘 **استكشاف الأخطاء**

### مشاكل شائعة:
1. **خطأ في الاتصال بقاعدة البيانات**: تحقق من DATABASE_URL
2. **خطأ في المصادقة**: تأكد من JWT_SECRET صحيح
3. **خطأ في الدفع**: تحقق من مفاتيح API للدفع
4. **خطأ في الاعتماديات**: شغل `npm install --production`

---
**✨ الباكند الآن جاهز للنشر مع جميع الميزات الأمنية والمحسّنة!**
