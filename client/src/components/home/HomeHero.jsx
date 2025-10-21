import React from 'react';
import { motion } from 'framer-motion';
import HeroBannerSlider from '../HeroBannerSlider';

export default function HomeHero({ t, ctaAlign = "right" }) {
  return (
    <section className="home-hero relative flex flex-col items-center bg-gradient-to-r from-red-600 to-red-400 rounded-xl p-6 md:p-12 text-white shadow-lg overflow-hidden">
      {/* HeroBannerSlider inside HomeHero */}
      <HeroBannerSlider />

      {/* السطر الأول: فقط الإعلانات (السلايدر) */}
      {/* تم حذف الصورة الثابتة ليظهر فقط السلايدر */}

      {/* السطر الثاني: أزرار CTA بحجم 60x60 بكسل بدقة */}
      <div className={`flex w-full ${ctaAlign === 'center' ? 'justify-center' : ctaAlign === 'left' ? 'justify-start' : 'justify-end'}`}>
        <div className="flex gap-1 justify-center items-center">
          {/* زر تسوق الآن */}
          <button
            className="mini-button bg-white/20 border border-white/30 text-white rounded-md hover:bg-white/30 transition-colors"
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              lineHeight: '10px',
              fontWeight: '600',
              textAlign: 'center'
            }}
          >
            تسوق<br />الآن
          </button>

            <button className="mini-button bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md transition-colors" onClick={() => window.location.href = '/offers'} style={{ width: '60px', height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '9px', lineHeight: '10px', fontWeight: '600', textAlign: 'center' }}>
              تصفح<br />العروض
            </button>

          {/* زر شاهد المنتجات */}
          <button
            className="mini-button bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md transition-colors"
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              lineHeight: '10px',
              fontWeight: '600',
              textAlign: 'center'
            }}
          >
            شاهد<br />المنتجات
          </button>
        </div>
      </div>

      {/* إضافة CSS مخصص لضمان الحجم */}
      <style>{`
        .mini-button {
          box-sizing: border-box;
          padding: 0;
          margin: 0;
          border: none;
          outline: none;
          cursor: pointer;
        }
        .mini-button:focus {
          outline: 2px solid rgba(255, 255, 255, 0.5);
        }
      `}</style>

      {/* خلفية زخرفية خفيفة */}
      <div className="absolute inset-0 bg-[url('/patterns/waves.svg')] opacity-10 bg-cover bg-center pointer-events-none" />
    </section>
  );
}