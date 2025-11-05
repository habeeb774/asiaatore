import React from 'react';
import { Button } from '../../components/ui';

export default function SettingsLogo(props) {
  const { form, previewStyle, logoPreview, setting, logoFile, logoInputRef, onPickLogo, uploadLogoNow, uploadingLogo } = props;

  return (
    <section id="logo-preview" style={{scrollMarginTop:80}}>
      <div style={{display:'grid', gap:6}}>
        <span style={{fontSize:'.7rem', fontWeight:700}}>الشعار</span>
        <div style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
          {(logoPreview || setting?.logoUrl || setting?.logo) && <img src={logoPreview || setting.logoUrl || setting.logo} alt="logo" style={{height:48, objectFit:'contain'}} />}
          <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=> onPickLogo(e.target.files?.[0]||null)} style={{display:'none'}} />
          <Button type="button" variant="secondary" onClick={()=> logoInputRef.current?.click()}>
            اختر صورة من جهازك
          </Button>
          {logoFile && <span style={{fontSize:'.6rem'}}>{logoFile.name}</span>}
          <Button type="button" variant="primary" onClick={uploadLogoNow} disabled={!logoFile || uploadingLogo}>
            {uploadingLogo ? 'يرفع...' : 'رفع الشعار'}
          </Button>
        </div>
      </div>

      <div style={{display:'grid', gap:6}}>
        <span style={{fontSize:'.7rem', fontWeight:700}}>معاينة مباشرة</span>
        <div style={{...previewStyle, display:'flex', alignItems:'center', gap:12, padding:12, border:'1px dashed #e2e8f0', borderRadius:8}}>
          <div style={{width:56, height:56, background:'var(--color-primary)', borderRadius:8}} />
          <div style={{width:56, height:56, background:'var(--color-primary-alt)', borderRadius:8}} />
          <div style={{width:56, height:56, background:'var(--color-accent)', borderRadius:8}} />
          <span style={{fontWeight:700}}>{form.siteNameAr || form.siteNameEn || 'اسم المتجر'}</span>
          <Button type="button" variant="primary" style={{marginInlineStart:'auto'}}>زر تجريبي</Button>
        </div>
      </div>
    </section>
  );
}
