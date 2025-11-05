import React from 'react';

const SettingsHero = ({ form, onChange, errors }) => {
  return (
    <section id="hero" style={{scrollMarginTop:80}}>
      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>بطل الصفحة الرئيسية (Hero)</legend>
        <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
          <label htmlFor="heroBackgroundImage" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>صورة الخلفية (رابط)</span>
            <input id="heroBackgroundImage" type="url" value={form.heroBackgroundImage} onChange={e=>onChange('heroBackgroundImage', e.target.value)} placeholder="https://.../hero.jpg" />
            {errors.heroBackgroundImage && <small style={{color:'#dc2626'}}>{errors.heroBackgroundImage}</small>}
          </label>
          <label htmlFor="heroCenterImage" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>صورة وسطية (اختياري - رابط)</span>
            <input id="heroCenterImage" type="url" value={form.heroCenterImage} onChange={e=>onChange('heroCenterImage', e.target.value)} placeholder="https://.../center.webp" />
            {errors.heroCenterImage && <small style={{color:'#dc2626'}}>{errors.heroCenterImage}</small>}
          </label>
          <label htmlFor="heroBackgroundGradient" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>تدرّج التعتيم (CSS)</span>
            <input id="heroBackgroundGradient" value={form.heroBackgroundGradient} onChange={e=>onChange('heroBackgroundGradient', e.target.value)} placeholder="linear-gradient(135deg, rgba(16,185,129,0.6), rgba(5,150,105,0.6))" />
          </label>
          <label htmlFor="heroAutoplayInterval" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>الانتقال التلقائي (مللي ثانية)</span>
            <input id="heroAutoplayInterval" type="number" min="1000" step="500" value={form.heroAutoplayInterval} onChange={e=>onChange('heroAutoplayInterval', e.target.value)} placeholder="5000" />
            {errors.heroAutoplayInterval && <small style={{color:'#dc2626'}}>{errors.heroAutoplayInterval}</small>}
          </label>
        </div>
      </fieldset>
    </section>
  );
};

export default SettingsHero;
