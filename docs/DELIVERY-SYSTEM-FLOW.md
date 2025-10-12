# تدفق نظام التوصيل (Delivery System Flow)

## سير العمل الكامل (Complete Workflow)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         إنشاء الطلب (Order Created)                  │
│                         في النظام الأساسي                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 المشرف: تعيين طلب لعامل التوصيل                      │
│         POST /api/admin/delivery/assignments                        │
│                                                                       │
│  • اختيار عامل متاح                                                  │
│  • تحديد عنوان الاستلام والتسليم                                     │
│  • تقدير المسافة والوقت                                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              إشعار فوري للعامل (Real-time Notification)             │
│                    عبر SSE/WebSocket                                 │
│                 broadcast('delivery:assigned')                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  العامل: مراجعة الطلب الجديد                         │
│              GET /api/delivery/orders/assigned                      │
│                                                                       │
│  ┌───────────────┐              ┌───────────────┐                  │
│  │  قبول الطلب   │              │  رفض الطلب    │                  │
│  │   (Accept)    │              │   (Reject)    │                  │
│  └───────┬───────┘              └───────┬───────┘                  │
└──────────┼──────────────────────────────┼──────────────────────────┘
           │                              │
           │                              ▼
           │                    ┌─────────────────────┐
           │                    │  تسجيل سبب الرفض    │
           │                    │  وإعادة التعيين     │
           │                    └─────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              العامل: بدء التوصيل (Start Delivery)                    │
│         PATCH /api/delivery/orders/:id/status                       │
│                   status: 'in_progress'                             │
│                                                                       │
│  • تحديث الحالة إلى "قيد التوصيل"                                    │
│  • تسجيل وقت البدء                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              تتبع الموقع التلقائي (Auto GPS Tracking)               │
│         POST /api/delivery/location/update (كل 30 ثانية)           │
│                                                                       │
│  • Latitude, Longitude, Accuracy                                    │
│  • Speed, Heading                                                   │
│  • تخزين في DeliveryLocation                                        │
│  • إشعار المشرف broadcast('delivery:location')                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│               المشرف: مراقبة الموقع الحي                             │
│          GET /api/admin/delivery/locations                          │
│                                                                       │
│  • عرض جميع العمال على الخريطة                                       │
│  • تتبع المسار في الوقت الفعلي                                       │
│  • حساب الوقت المتوقع للوصول                                         │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              العامل: الوصول وتأكيد التسليم                           │
│         POST /api/delivery/orders/:id/proof                         │
│                                                                       │
│  • طلب OTP من العميل                                                │
│  • أو التقاط صورة/توقيع رقمي                                         │
│  • تحديث الحالة إلى 'delivered'                                     │
│  • تسجيل وقت التسليم                                                 │
│  • حساب المسافة والمدة الفعلية                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   تحديث الإحصائيات والتقييم                         │
│                                                                       │
│  • زيادة totalDeliveries للعامل                                     │
│  • تحديث متوسط التقييم                                               │
│  • إشعار جميع الأطراف broadcast('delivery:completed')              │
│  • تسجيل في AuditLog                                                │
└─────────────────────────────────────────────────────────────────────┘
```

## الأطراف المعنية (Stakeholders)

### 1. العميل (Customer)
- يتلقى إشعارات عن حالة التوصيل
- يتتبع موقع العامل (مخطط مستقبلاً)
- يؤكد التسليم بـ OTP
- يقيم العامل بعد التسليم

### 2. عامل التوصيل (Delivery Worker)
- يستقبل طلبات التوصيل
- يقبل أو يرفض الطلبات
- يحدث موقعه تلقائياً
- يؤكد التسليم
- يتتبع إحصائياته وتقييمه

### 3. المشرف (Admin)
- يراقب جميع العمال
- يعين الطلبات للعمال
- يتتبع المواقع في الوقت الفعلي
- يدير حالات العمال
- يستعرض الإحصائيات والتقارير

## حالات الطلب (Order States)

```
pending → accepted → in_progress → delivered
    ↓         ↓           ↓
rejected   cancelled   failed
```

### pending (قيد الانتظار)
- تم تعيين الطلب للعامل
- في انتظار قبول أو رفض العامل

### accepted (مقبول)
- قَبِل العامل الطلب
- جاهز لبدء التوصيل

### in_progress (قيد التوصيل)
- بدأ العامل التوصيل
- يتم تتبع الموقع

### delivered (تم التسليم)
- تم تسليم الطلب بنجاح
- تم تأكيد التسليم بإثبات

### rejected (مرفوض)
- رفض العامل الطلب
- يحتاج إلى إعادة تعيين

### cancelled (ملغى)
- ألغى المشرف أو النظام المهمة

### failed (فشل)
- فشل التوصيل لسبب ما
- يحتاج إلى مراجعة

## أنواع إثبات التسليم (Delivery Proof Types)

### 1. OTP (One-Time Password)
```json
{
  "proofType": "otp",
  "proofData": {
    "otp": "123456",
    "timestamp": "2025-10-12T23:00:00Z"
  }
}
```

### 2. Photo (صورة)
```json
{
  "proofType": "photo",
  "proofData": {
    "url": "/uploads/delivery-proof/abc123.jpg",
    "timestamp": "2025-10-12T23:00:00Z"
  }
}
```

### 3. Signature (توقيع رقمي)
```json
{
  "proofType": "signature",
  "proofData": {
    "signature": "base64-encoded-signature",
    "timestamp": "2025-10-12T23:00:00Z"
  }
}
```

### 4. Customer Confirmation (تأكيد العميل)
```json
{
  "proofType": "customer_confirmation",
  "proofData": {
    "confirmed": true,
    "method": "app" | "sms" | "call",
    "timestamp": "2025-10-12T23:00:00Z"
  }
}
```

## التحديثات الفورية (Real-time Events)

All events are broadcast via SSE/WebSocket and respect role-based visibility:
- Admin sees all events
- Workers see events related to their assignments
- Customers see events for their orders (future)

### Events Overview

| Event | Trigger | Visibility |
|-------|---------|------------|
| `delivery:assigned` | Admin assigns order to worker | Admin, Worker |
| `delivery:accepted` | Worker accepts assignment | Admin, Worker, Customer |
| `delivery:rejected` | Worker rejects assignment | Admin |
| `delivery:status` | Status change (in_progress, etc.) | Admin, Worker, Customer |
| `delivery:location` | Worker location update | Admin only |
| `delivery:completed` | Delivery confirmed | Admin, Worker, Customer |

## الأمان والصلاحيات (Security & Permissions)

All API endpoints are protected with JWT authentication and role-based access control.

### العامل (Delivery Worker)
✅ Can:
- View own assigned orders
- Accept/reject assignments
- Update own location
- Update status of own assignments
- Upload delivery proof

❌ Cannot:
- View other workers' assignments
- View all locations
- Create new assignments
- Modify worker profiles

### المشرف (Admin)
✅ Can:
- View all workers and assignments
- Create/update/delete workers
- Assign orders to workers
- View all locations in real-time
- Override assignment status
- View system-wide statistics

### العميل (Customer) - Future
✅ Will be able to:
- Track delivery of own orders
- View worker location for own orders
- Contact assigned worker
- Rate and provide feedback

## Best Practices

1. **Location Privacy**: Worker locations are only visible to admins in real-time
2. **OTP Security**: Generate unique OTPs per delivery, with expiration
3. **Audit Trail**: All actions are logged via the audit system
4. **Real-time Updates**: Use SSE for efficient real-time communication
5. **Error Handling**: Graceful degradation if GPS or connectivity fails
6. **Data Retention**: Consider purging old location data per privacy policy
