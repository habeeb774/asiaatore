import React from 'react';
import { Input } from '../../../components/ui';

export default function SettingsLinksApps(props) {
  const { form, onChange, errors } = props;

  return (
    <section id="links-apps" style={{scrollMarginTop:80}}>
      <div style={{display:'grid', gap:8}}>
        <span style={{fontSize:'.8rem', fontWeight:800}}>روابط مهمة وتطبيقات</span>
        <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
          <label htmlFor="linkBlog" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>رابط المدونة (Blog)</span>
            <Input id="linkBlog" type="url" value={form.linkBlog} onChange={e=>onChange('linkBlog', e.target.value)} placeholder="https://example.com/blog" />
            {errors.linkBlog && <small style={{color:'var(--color-danger)'}}>{errors.linkBlog}</small>}
          </label>
          <label htmlFor="linkSocial" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>رابط التواصل الاجتماعي</span>
            <Input id="linkSocial" type="url" value={form.linkSocial} onChange={e=>onChange('linkSocial', e.target.value)} placeholder="https://instagram.com/yourbrand" />
            {errors.linkSocial && <small style={{color:'var(--color-danger)'}}>{errors.linkSocial}</small>}
          </label>
          <label htmlFor="linkReturns" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>سياسة الاستبدال والإرجاع</span>
            <Input id="linkReturns" type="url" value={form.linkReturns} onChange={e=>onChange('linkReturns', e.target.value)} placeholder="https://example.com/returns" />
            {errors.linkReturns && <small style={{color:'var(--color-danger)'}}>{errors.linkReturns}</small>}
          </label>
          <label htmlFor="linkPrivacy" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>سياسة الاستخدام والخصوصية</span>
            <Input id="linkPrivacy" type="url" value={form.linkPrivacy} onChange={e=>onChange('linkPrivacy', e.target.value)} placeholder="https://example.com/privacy" />
            {errors.linkPrivacy && <small style={{color:'var(--color-danger)'}}>{errors.linkPrivacy}</small>}
          </label>
          <label htmlFor="appStoreUrl" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>رابط تطبيق iOS (App Store)</span>
            <Input id="appStoreUrl" type="url" value={form.appStoreUrl} onChange={e=>onChange('appStoreUrl', e.target.value)} placeholder="https://apps.apple.com/app/idXXXXXXXXX" />
            <small style={{opacity:.7}}>استخدم رابط App Store الرسمي للتطبيق.</small>
            {errors.appStoreUrl && <small style={{color:'var(--color-danger)'}}>{errors.appStoreUrl}</small>}
          </label>
          <label htmlFor="playStoreUrl" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>رابط تطبيق Android (Google Play)</span>
            <Input id="playStoreUrl" type="url" value={form.playStoreUrl} onChange={e=>onChange('playStoreUrl', e.target.value)} placeholder="https://play.google.com/store/apps/details?id=your.app" />
            <small style={{opacity:.7}}>استخدم رابط Google Play الرسمي للتطبيق.</small>
            {errors.playStoreUrl && <small style={{color:'var(--color-danger)'}}>{errors.playStoreUrl}</small>}
          </label>
        </div>
      </div>
    </section>
  );
}
