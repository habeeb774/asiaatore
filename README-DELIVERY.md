# نظام إدارة التوصيل (Delivery Management System)

## نظرة عامة

نظام متكامل لإدارة عمال التوصيل وتتبع الطلبات في الوقت الفعلي، مع دعم كامل للتحديثات الفورية عبر SSE/WebSocket.

## المميزات الرئيسية

### ١. لوحة تحكم عامل التوصيل (Delivery Worker Dashboard)

**الوصول**: `/delivery`

المميزات:
- عرض الطلبات المُكلف بها فقط
- قبول أو رفض الطلبات الجديدة
- بدء وتتبع التوصيل
- تحديث الموقع تلقائياً كل 30 ثانية
- تأكيد التسليم عبر OTP
- عرض الإحصائيات (التقييم، المسافة، عدد التوصيلات)
- سجل التوصيلات السابقة

### ٢. لوحة إدارة التوصيل للمشرف (Admin Delivery Management)

**الوصول**: `/admin/delivery`

المميزات:
- مراقبة جميع عمال التوصيل
- تتبع المواقع الحالية لجميع العمال
- إنشاء وإدارة حسابات العمال
- تعيين الطلبات للعمال
- عرض إحصائيات النظام
- إدارة حالات العمال (نشط، موقوف، غير نشط)

### ٣. نظام GPS وتتبع الموقع

- تحديث الموقع تلقائياً كل 30 ثانية
- تخزين سجل المواقع لكل عامل
- دعم الدقة، السرعة، والاتجاه
- إمكانية عرض الموقع على خرائط جوجل

### ٤. التحديثات الفورية (Real-time Updates)

عبر SSE/WebSocket:
- `delivery:status` - تحديث حالة التوصيل
- `delivery:accepted` - قبول التوصيل
- `delivery:rejected` - رفض التوصيل
- `delivery:location` - تحديث موقع العامل
- `delivery:completed` - اكتمال التوصيل

## نموذج البيانات (Database Schema)

### DeliveryWorker (عامل التوصيل)
```prisma
model DeliveryWorker {
  id              String
  userId          String                 @unique
  vehicleType     String?                // نوع المركبة
  vehicleNumber   String?                // رقم اللوحة
  licenseNumber   String?                // رخصة القيادة
  status          DeliveryWorkerStatus   // active, inactive, suspended
  rating          Float
  totalDeliveries Int
  workStartTime   String?                // ساعات العمل
  workEndTime     String?
  allowedZones    Json?                  // المناطق المسموح بها
}
```

### DeliveryAssignment (مهمة التوصيل)
```prisma
model DeliveryAssignment {
  id                String
  orderId           String
  workerId          String
  status            DeliveryAssignmentStatus  // pending, accepted, in_progress, delivered, etc.
  pickupAddress     Json?
  deliveryAddress   Json?
  assignedAt        DateTime
  acceptedAt        DateTime?
  startedAt         DateTime?
  deliveredAt       DateTime?
  estimatedDistance Float?
  actualDistance    Float?
  estimatedDuration Int?
  actualDuration    Int?
  proofType         DeliveryProofType?        // signature, photo, otp
  proofData         Json?
  customerRating    Int?
  customerFeedback  String?
}
```

### DeliveryLocation (تتبع الموقع)
```prisma
model DeliveryLocation {
  id         String
  workerId   String
  latitude   Float
  longitude  Float
  accuracy   Float?
  speed      Float?
  heading    Float?
  timestamp  DateTime
}
```

## API Endpoints

### للعمال (Delivery Worker APIs)

#### `GET /api/delivery/orders/assigned`
جلب الطلبات المُكلف بها العامل

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "assignment": { "id": "...", "status": "pending", ... },
      "order": { "id": "...", "items": [...], ... }
    }
  ]
}
```

#### `POST /api/delivery/orders/:id/accept`
قبول طلب توصيل

#### `POST /api/delivery/orders/:id/reject`
رفض طلب توصيل

**Body**: `{ "reason": "سبب الرفض" }`

#### `PATCH /api/delivery/orders/:id/status`
تحديث حالة الطلب

**Body**: `{ "status": "in_progress" | "delivered" }`

#### `POST /api/delivery/location/update`
تحديث الموقع الحالي

**Body**:
```json
{
  "latitude": 24.7136,
  "longitude": 46.6753,
  "accuracy": 10.5,
  "speed": 30.2,
  "heading": 180
}
```

#### `POST /api/delivery/orders/:id/proof`
تأكيد التسليم مع الإثبات

**Body**:
```json
{
  "proofType": "otp",
  "proofData": {
    "otp": "123456",
    "timestamp": "2025-10-12T23:00:00Z"
  }
}
```

#### `GET /api/delivery/history`
سجل التوصيلات السابقة

**Query params**: `?page=1&limit=20`

#### `GET /api/delivery/stats`
إحصائيات العامل

#### `GET /api/delivery/profile`
معلومات الملف الشخصي

### للمشرفين (Admin APIs)

#### `GET /api/admin/delivery/workers`
قائمة جميع عمال التوصيل

**Query params**: `?status=active&page=1&limit=50`

#### `GET /api/admin/delivery/workers/:id`
تفاصيل عامل محدد

#### `POST /api/admin/delivery/workers`
إنشاء عامل توصيل جديد

**Body**:
```json
{
  "userId": "user_id",
  "vehicleType": "motorcycle",
  "vehicleNumber": "ABC123",
  "licenseNumber": "DL123456"
}
```

#### `PATCH /api/admin/delivery/workers/:id`
تحديث معلومات العامل

**Body**: `{ "status": "active" | "inactive" | "suspended" }`

#### `DELETE /api/admin/delivery/workers/:id`
حذف عامل (لا يمكن حذف عامل لديه طلبات نشطة)

#### `GET /api/admin/delivery/locations`
المواقع الحالية لجميع العمال

#### `GET /api/admin/delivery/locations/:workerId`
سجل المواقع لعامل محدد

**Query params**: `?from=2025-10-12&to=2025-10-13&limit=100`

#### `POST /api/admin/delivery/assignments`
إنشاء مهمة توصيل جديدة

**Body**:
```json
{
  "orderId": "order_id",
  "workerId": "worker_id",
  "pickupAddress": { "line1": "...", "city": "...", "phone": "..." },
  "deliveryAddress": { "line1": "...", "city": "...", "phone": "..." },
  "estimatedDistance": 5.2,
  "estimatedDuration": 20
}
```

#### `GET /api/admin/delivery/assignments`
قائمة جميع المهام

**Query params**: `?status=pending&workerId=...&orderId=...`

#### `PATCH /api/admin/delivery/assignments/:id`
تحديث مهمة توصيل

#### `GET /api/admin/delivery/stats`
إحصائيات النظام

## الإعداد والتثبيت

### 1. تحديث قاعدة البيانات

```bash
# توليد Prisma Client
npm run db:generate

# دفع التغييرات لقاعدة البيانات
npm run db:push
```

### 2. إنشاء عامل توصيل

```bash
# إنشاء عامل جديد لمستخدم موجود
node server/scripts/createDeliveryWorker.js <userId> [vehicleType]

# مثال
node server/scripts/createDeliveryWorker.js cm31abc123 motorcycle
```

### 3. تعيين الصلاحيات

يمكن للمشرف تعيين صلاحية `delivery` لأي مستخدم عبر:
- لوحة إدارة المستخدمين (`/admin`)
- API: `PATCH /api/admin/users/:id` مع `{ "role": "delivery" }`

## سير العمل (Workflow)

### للعامل:

1. تسجيل الدخول والانتقال إلى `/delivery`
2. عرض الطلبات المعينة
3. **قبول** الطلب أو **رفضه**
4. بعد القبول: **بدء التوصيل**
5. النظام يحدث الموقع تلقائياً
6. عند الوصول: **تأكيد التسليم** عبر OTP من العميل
7. استلام التقييم والملاحظات

### للمشرف:

1. مراقبة جميع العمال من `/admin/delivery`
2. **تعيين طلب** لعامل متاح
3. تتبع حالة الطلب في الوقت الفعلي
4. مراجعة الإحصائيات والتقارير
5. إدارة حالات العمال

## الأمان

### 1. المصادقة (Authentication)
- جميع endpoints تتطلب JWT token صالح
- التحقق من الصلاحيات (delivery role للعمال، admin للمشرفين)

### 2. الترخيص (Authorization)
- العامل يرى طلباته فقط
- المشرف يرى جميع الطلبات والعمال

### 3. OTP للتسليم
- كود سري يطلب من العميل عند التسليم
- يُسجل في `proofData` مع timestamp

### 4. تشفير البيانات
- جميع الاتصالات عبر HTTPS
- Location data مشفرة في النقل
- معلومات العملاء محمية

## التطوير المستقبلي

### مميزات إضافية مخطط لها:

- [ ] خريطة تفاعلية في لوحة المشرف لتتبع جميع العمال
- [ ] إشعارات Push عند وصول طلبات جديدة
- [ ] دردشة مباشرة بين العامل والعميل
- [ ] حساب تلقائي لتكلفة التوصيل حسب المسافة
- [ ] تطبيق جوال (React Native / PWA)
- [ ] تكامل مع Google Maps Directions API
- [ ] إشعارات تلقائية للعميل عند اقتراب العامل
- [ ] توقيع رقمي أو صورة كإثبات تسليم
- [ ] نظام تقييم شامل للعمال
- [ ] تقارير وإحصائيات متقدمة
- [ ] تحديد مناطق التوصيل المسموح بها
- [ ] إدارة أوقات العمل لكل عامل

## الدعم الفني

للمساعدة أو الإبلاغ عن مشاكل:
- افتح Issue على GitHub
- راجع الوثائق في `/docs`
- اتصل بفريق الدعم الفني

## الترخيص

متاح حسب ترخيص المشروع الأساسي.
