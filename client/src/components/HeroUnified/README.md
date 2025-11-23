# مكون الهيرو الموحد (Hero Unified Component)

## نظرة عامة
مكون React موحد يجمع جميع أنواع مكونات الهيرو في مكون واحد شامل يدعم جميع الميزات والأنماط المختلفة.

## الميزات المدعومة

### 🎨 أنواع العرض
- **Simple**: عرض صور بسيطة
- **Advanced**: شرائح مع محتوى نصي متقدم
- **Banner**: بانرز مع عناوين ونصوص
- **Elegant**: تصميم أنيق مع تأثيرات بصرية

### ⚡ تحسينات الأداء
- **Lazy Loading**: تحميل الصور عند الحاجة فقط
- **IndexedDB Caching**: تخزين مؤقت للبيانات
- **Intersection Observer**: مراقبة ظهور المكون
- **Priority Loading**: تحميل الصور ذات الأولوية أولاً

### 🎯 تفاعل المستخدم
- **Touch Gestures**: دعم اللمسات للأجهزة المحمولة
- **Keyboard Navigation**: دعم لوحة المفاتيح
- **Auto-play Controls**: تشغيل تلقائي مع إمكانية التحكم
- **Navigation Arrows**: أزرار التنقل اليدوي

### 🌐 دعم اللغات المتعددة
- **Arabic Support**: دعم كامل للغة العربية
- **RTL Support**: دعم الاتجاه من اليمين لليسار
- **Localization**: رسائل مترجمة حسب اللغة

### 📱 التصميم المتجاوب
- **Mobile First**: تصميم محسن للأجهزة المحمولة
- **Tablet Support**: دعم الأجهزة اللوحية
- **Desktop Optimized**: تحسين للشاشات الكبيرة

### 🎭 تأثيرات بصرية
- **Framer Motion**: حركات سلسة ومتقدمة
- **Glass Morphism**: تأثيرات شفافية أنيقة
- **Gradient Backgrounds**: خلفيات متدرجة
- **Particle Effects**: تأثيرات جسيمات متحركة

## طريقة الاستخدام

### استيراد المكون
```jsx
import Hero from '../components/HeroUnified';
import '../styles/HeroUnified.css';
```

### استخدام أساسي - صور بسيطة
```jsx
const slides = [
  '/uploads/hero1.jpg',
  '/uploads/hero2.jpg',
  '/uploads/hero3.jpg'
];

<Hero slides={slides} />
```

### استخدام متقدم - شرائح مع محتوى
```jsx
const slides = [
  {
    src: '/uploads/hero1.jpg',
    title: 'عنوان رئيسي جذاب',
    subtitle: 'وصف تفصيلي للمنتج أو الخدمة',
    badge: 'جديد',
    cta: {
      text: 'اكتشف المزيد',
      link: '/products'
    }
  },
  // المزيد من الشرائح...
];

<Hero
  slides={slides}
  variant="advanced"
  autoplay={true}
  autoplayDelay={5000}
  showNavigation={true}
  showPagination={true}
/>
```

### استخدام البانرز
```jsx
const banners = [
  {
    imageUrl: '/uploads/banner1.jpg',
    title_ar: 'عنوان البانر بالعربية',
    title_en: 'Banner Title in English',
    subtitle_ar: 'وصف البانر بالعربية',
    subtitle_en: 'Banner description in English',
    linkUrl: '/products/1'
  }
];

<Hero slides={banners} variant="banner" />
```

### التصميم الأنيق
```jsx
<Hero
  slides={slides}
  variant="elegant"
  elegant={true}
  backgroundGradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  showIndicators={true}
/>
```

## خصائص المكون

### الخصائص الأساسية
| الخاصية | النوع | الافتراضي | الوصف |
|---------|------|----------|-------|
| `slides` | `array` | `[]` | مصفوفة الشرائح (صور أو كائنات) |
| `variant` | `string` | `'simple'` | نوع العرض: `'simple'`, `'advanced'`, `'banner'`, `'elegant'` |
| `autoplay` | `boolean` | `true` | تفعيل التشغيل التلقائي |
| `autoplayDelay` | `number` | `5000` | تأخير التشغيل التلقائي (مللي ثانية) |
| `height` | `string/number` | `'auto'` | ارتفاع المكون |

### خصائص التنقل
| الخاصية | النوع | الافتراضي | الوصف |
|---------|------|----------|-------|
| `showNavigation` | `boolean` | `true` | عرض أزرار التنقل |
| `showPagination` | `boolean` | `true` | عرض نقاط التنقل |
| `showPlayPause` | `boolean` | `false` | عرض زر التشغيل/الإيقاف |

### خصائص التصميم
| الخاصية | النوع | الافتراضي | الوصف |
|---------|------|----------|-------|
| `overlay` | `boolean` | `false` | إضافة طبقة تراكب على الصور |
| `elegant` | `boolean` | `false` | تفعيل التصميم الأنيق |
| `backgroundGradient` | `string` | `null` | خلفية متدرجة مخصصة |
| `showIndicators` | `boolean` | `true` | عرض مؤشرات الأداء |

### خصائص الأداء
| الخاصية | النوع | الافتراضي | الوصف |
|---------|------|----------|-------|
| `lazy` | `boolean` | `true` | تفعيل التحميل البطيء |
| `priority` | `boolean` | `false` | تحميل الصور ذات الأولوية أولاً |

### معالجات الأحداث
| الخاصية | النوع | الوصف |
|---------|------|-------|
| `onSlideChange` | `function` | يتم استدعاؤه عند تغيير الشريحة |
| `onSlideClick` | `function` | يتم استدعاؤه عند النقر على شريحة |

## أمثلة متقدمة

### معالجة الأحداث
```jsx
const handleSlideChange = (index) => {
  console.log('Slide changed to:', index);
  // تتبع التحليلات
  analytics.track('hero_slide_view', { slideIndex: index });
};

const handleSlideClick = (slide, index) => {
  console.log('Slide clicked:', slide, index);
  // التنقل أو فتح نافذة منبثقة
  if (slide.link) {
    navigate(slide.link);
  }
};

<Hero
  slides={slides}
  onSlideChange={handleSlideChange}
  onSlideClick={handleSlideClick}
/>
```

### تخصيص الأنماط
```jsx
<Hero
  slides={slides}
  className="custom-hero"
  style={{
    '--hero-primary-color': '#your-color',
    '--hero-accent-color': '#your-accent',
    '--hero-text-color': '#your-text-color'
  }}
/>
```

### استخدام مع Context
```jsx
import { useLanguage } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { locale } = useLanguage();

  const slides = [
    {
      src: '/hero1.jpg',
      title: locale === 'ar' ? 'العنوان بالعربية' : 'Title in English',
      subtitle: locale === 'ar' ? 'الوصف بالعربية' : 'Description in English'
    }
  ];

  return <Hero slides={slides} />;
};
```

## هيكل الملفات

```
components/
├── HeroUnified.jsx          # المكون الرئيسي الموحد
└── ...

styles/
├── HeroUnified.css          # أنماط CSS الموحدة
└── ...

contexts/
├── LanguageContext.jsx      # Context إدارة اللغات
└── ...
```

## التبعيات المطلوبة

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "framer-motion": "^10.0.0",
    "swiper": "^10.0.0",
    "lucide-react": "^0.263.0"
  }
}
```

## ملاحظات مهمة

### الأداء
- المكون يستخدم `React.memo` لتحسين الأداء
- يتم تحميل الصور بشكل lazy افتراضياً
- يدعم التخزين المؤقت باستخدام IndexedDB

### الوصولية
- دعم كامل لوحة المفاتيح
- عناصر ARIA مناسبة
- تركيز مرئي واضح

### الاستجابة
- يعمل على جميع أحجام الشاشات
- دعم اللمسات للأجهزة المحمولة
- تحسينات للوضع المظلم

### التخصيص
- يمكن تخصيص الألوان عبر CSS Variables
- دعم إضافة classes مخصصة
- إمكانية تمديد المكون

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

**الصور لا تظهر:**
- تأكد من صحة مسارات الصور
- تحقق من وجود الملفات في مجلد `uploads`

**السلايدر لا يعمل:**
- تأكد من استيراد أنماط Swiper
- تحقق من وجود الشرائح في المصفوفة

**الأداء بطيء:**
- فعل التحميل البطيء (`lazy={true}`)
- استخدم `priority={true}` للصور الأولى فقط

**مشاكل اللغة:**
- تأكد من وجود `LanguageContext`
- تحقق من ترجمة النصوص

## التحديثات المستقبلية

- [ ] دعم الفيديو
- [ ] تأثيرات انتقال إضافية
- [ ] دعم الصوت
- [ ] تحسينات الذكاء الاصطناعي
- [ ] دعم الواقع المعزز

## المساهمة

للمساهمة في تطوير المكون:
1. أنشئ fork للمشروع
2. أنشئ branch جديد للميزة
3. اكتب الكود مع التعليقات بالعربية والإنجليزية
4. اختبر التغييرات
5. أرسل pull request

## الترخيص

هذا المكون جزء من مشروع My Store ومرخص تحت رخصة MIT.