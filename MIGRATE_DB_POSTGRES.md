# ترحيل قاعدة البيانات من SQLite إلى Postgres

حاليًا يعتمد المشروع على SQLite عبر Prisma (ملف واحد). للبيئة الفعلية (Production) يفضل Postgres.

## 1. إنشاء قاعدة Postgres
احصل على اتصال جاهز (مثال Railway, Render, Supabase, RDS):
```
postgres://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public
```

## 2. تعديل متغير البيئة
في ملف `.env`:
```
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public"
```

## 3. تحديث مزود Prisma
في `prisma/schema.prisma` غيّر:
```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 4. إنشاء Migration
يفضل الانتقال إلى نظام المايجريشن بدل `db push`:
```
npx prisma migrate dev --name init
```
أو في CI/Production:
```
npx prisma migrate deploy
```

## 5. فهرسة إضافية (مقترحة)
أضف داخل models:
```
model Order {
  // ...
  @@index([userId, createdAt])
}

model AuditLog {
  // ...
  @@index([createdAt])
  @@index([entity, action])
}

model Product {
  // ...
  @@index([category])
  @@index([createdAt])
}
```

## 6. استيراد بيانات موجودة (اختياري)
- صدّر البيانات من SQLite (query بسيطة) ثم استوردها إلى Postgres بواسطة script.
- يمكن كتابة سكربت Node يستخدم Prisma للقراءة من SQLite والكتابة إلى Postgres (تشغيل مرحلي بمجلد منفصل).

## 7. التحقق
```
npx prisma generate
npx prisma studio
```
تأكد من الجداول والعلاقات ثم اختبر API.

## 8. مراقبة الأداء
- فعل pg_stat_statements لمراقبة الاستعلامات الثقيلة.
- استخدم فهارس مركبة عند الحاجة (مثال: createdAt,status).

## 9. أمان وإدارة الاتصالات
- استخدم مسبح اتصالات (Prisma يديره ضمنياً) ولكن راقب القيم على مزود Serverless.
- ضع قيود (قواعد جدار ناري / SSL).

## 10. نسخ احتياطي
- فعّل نسخ تلقائي يومي.
- اختبر عملية الاستعادة مرة واحدة على الأقل قبل الإطلاق.

## 11. توسيع مستقبلي
- أضف جدول Coupon.
- أضف User حقيقي وربط Order.userId بعلاقة مباشرة.
- أتمتة أرشفة AuditLog القديم (Partitioning أو جدول أرشيف).

تم.