import React from 'react';

const SettingsCompanyFooter = ({ form, onChange }) => {
  return (
    <section id="company-footer" style={{display:'grid', gap:12, scrollMarginTop:80}}>
      <div style={{display:'grid', gap:8}}>
        <span style={{fontSize:'.8rem', fontWeight:800}}>وصف الفوتر</span>
        <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
          <label htmlFor="footerAboutAr" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>نبذة (AR)</span>
            <textarea id="footerAboutAr" rows={4} value={form.footerAboutAr} onChange={e=>onChange('footerAboutAr', e.target.value)} placeholder={"متخصصون في بيع المواد الغذائية بالجملة وبالحبة\nوجميع احتياجات المنزل من منظفات و كماليات\nأيضًا يوجد لدينا قسم السوبر ماركت وجميع\nاحتياجات الأسرة السعودية وأسعارنا جملة وجودتنا\nأصلية"} />
            <small style={{opacity:.7}}>يمكنك كتابة عدة أسطر؛ ستظهر كفقرات منفصلة.</small>
          </label>
          <label htmlFor="footerAboutEn" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>About (EN)</span>
            <textarea id="footerAboutEn" rows={4} value={form.footerAboutEn} onChange={e=>onChange('footerAboutEn', e.target.value)} placeholder="We specialize in wholesale and retail food products and home essentials." />
          </label>
        </div>
      </div>

      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>بيانات الشركة والفواتير</legend>
        <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
          <label htmlFor="companyNameAr" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>اسم الشركة (AR)</span>
            <input id="companyNameAr" value={form.companyNameAr} onChange={e=>onChange('companyNameAr', e.target.value)} placeholder="مثال: شركة منفذ آسيا التجارية" />
          </label>
          <label htmlFor="companyNameEn" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>Company Name (EN)</span>
            <input id="companyNameEn" value={form.companyNameEn} onChange={e=>onChange('companyNameEn', e.target.value)} placeholder="e.g., Asia Outlet Co." />
          </label>
          <label htmlFor="commercialRegNo" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>السجل التجاري</span>
            <input id="commercialRegNo" value={form.commercialRegNo} onChange={e=>onChange('commercialRegNo', e.target.value)} placeholder="مثال: 1010xxxxxx" />
          </label>
          <label htmlFor="taxNumber2" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>الرقم الضريبي</span>
            <input id="taxNumber2" value={form.taxNumber} onChange={e=>onChange('taxNumber', e.target.value)} placeholder="مثال: 311307460300003" />
          </label>
          <label htmlFor="addressAr" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>العنوان (AR)</span>
            <textarea id="addressAr" rows={2} value={form.addressAr} onChange={e=>onChange('addressAr', e.target.value)} placeholder="الرياض - حي ... شارع ..." />
          </label>
          <label htmlFor="addressEn" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>Address (EN)</span>
            <textarea id="addressEn" rows={2} value={form.addressEn} onChange={e=>onChange('addressEn', e.target.value)} placeholder="Riyadh, District..., Street..." />
          </label>
        </div>
      </fieldset>
    </section>
  );
};

export default SettingsCompanyFooter;
