import React from 'react';
import { Input, Textarea } from '../../../components/ui';
import { useFormContext, Controller } from 'react-hook-form';
import FormField from '../../../components/features/admin/forms/FormField';

const SettingsCompanyFooter = ({ form, onChange }) => {
  const { control } = useFormContext();
  return (
    <section id="company-footer" style={{display:'grid', gap:12, scrollMarginTop:80}}>
      <div style={{display:'grid', gap:8}}>
        <span style={{fontSize:'.8rem', fontWeight:800}}>وصف الفوتر</span>
        <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
          <FormField htmlFor="footerAboutAr" label="نبذة (AR)" hint={"يمكنك كتابة عدة أسطر؛ ستظهر كفقرات منفصلة."}>
            <Controller
              name="footerAboutAr"
              control={control}
              render={({ field }) => (
                <Textarea id="footerAboutAr" rows={4} value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('footerAboutAr', v); }} placeholder={"متخصصون في بيع المواد الغذائية بالجملة وبالحبة\nوجميع احتياجات المنزل من منظفات و كماليات\nأيضًا يوجد لدينا قسم السوبر ماركت وجميع\nاحتياجات الأسرة السعودية وأسعارنا جملة وجودتنا\nأصلية"} />
              )}
            />
          </FormField>
          <FormField htmlFor="footerAboutEn" label="About (EN)">
            <Controller
              name="footerAboutEn"
              control={control}
              render={({ field }) => (
                <Textarea id="footerAboutEn" rows={4} value={field.value ?? ''} onChange={e=>{ const v=e.target.value; field.onChange(v); onChange('footerAboutEn', v); }} placeholder="We specialize in wholesale and retail food products and home essentials." />
              )}
            />
          </FormField>
        </div>
      </div>

      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>بيانات الشركة والفواتير</legend>
        <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
          <label htmlFor="companyNameAr" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>اسم الشركة (AR)</span>
            <Input id="companyNameAr" value={form.companyNameAr} onChange={e=>onChange('companyNameAr', e.target.value)} placeholder="مثال: شركة منفذ آسيا التجارية" />
          </label>
          <label htmlFor="companyNameEn" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>Company Name (EN)</span>
            <Input id="companyNameEn" value={form.companyNameEn} onChange={e=>onChange('companyNameEn', e.target.value)} placeholder="e.g., Asia Outlet Co." />
          </label>
          <label htmlFor="commercialRegNo" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>السجل التجاري</span>
            <Input id="commercialRegNo" value={form.commercialRegNo} onChange={e=>onChange('commercialRegNo', e.target.value)} placeholder="مثال: 1010xxxxxx" />
          </label>
          <label htmlFor="taxNumber2" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>الرقم الضريبي</span>
            <Input id="taxNumber2" value={form.taxNumber} onChange={e=>onChange('taxNumber', e.target.value)} placeholder="مثال: 311307460300003" />
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
