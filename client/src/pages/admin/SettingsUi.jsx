import React from 'react';
import { Button } from '../../components/ui';

export default function SettingsUi(props) {
  const {
    form, onChange, errors,
    applyPreviewToApp, resetPreviewFromSetting,
    exportSettings, triggerImportClick, importInputRef, importSaveInputRef, importAndSave, importing,
    onImportFileChange
  } = props;

  return (
    <section id="ui-components" style={{scrollMarginTop:80}}>
      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>مظهر وملامح واجهة المستخدم</legend>
        <div style={{display:'grid', gap:8}}>
          <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
            <label style={{display:'flex', gap:8, alignItems:'center'}}>
              <input type="checkbox" checked={!!form.ui_sidebar_hover_preview} onChange={e=>onChange('ui_sidebar_hover_preview', e.target.checked)} />
              <span style={{fontSize:'.9rem', fontWeight:700}}>تفعيل معاينة الشريط عند المرور (Hover preview)</span>
            </label>
            <label style={{display:'flex', gap:8, alignItems:'center'}}>
              <input type="checkbox" checked={!!form.ui_sidebar_collapsed_default} onChange={e=>onChange('ui_sidebar_collapsed_default', e.target.checked)} />
              <span style={{fontSize:'.9rem', fontWeight:700}}>تصغير الشريط افتراضياً (Collapsed by default)</span>
            </label>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
            <label style={{display:'grid', gap:6}}>
              <span style={{fontSize:'.8rem', fontWeight:700}}>نصف قطر الزوايا للأزرار (px)</span>
              <input type="number" min="0" value={form.ui_button_radius} onChange={e=>onChange('ui_button_radius', e.target.value)} />
            </label>
            <label style={{display:'grid', gap:6}}>
              <span style={{fontSize:'.8rem', fontWeight:700}}>نصف قطر الحقول (px)</span>
              <input type="number" min="0" value={form.ui_input_radius} onChange={e=>onChange('ui_input_radius', e.target.value)} />
            </label>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
            <label style={{display:'grid', gap:6}}>
              <span style={{fontSize:'.8rem', fontWeight:700}}>خط الواجهة</span>
              <select value={form.ui_font_family} onChange={e=>onChange('ui_font_family', e.target.value)}>
                <option value="Cairo">Cairo (Arabic primary)</option>
                <option value="Inter">Inter (Latin)</option>
                <option value="System">System UI</option>
              </select>
            </label>
            <label style={{display:'grid', gap:6}}>
              <span style={{fontSize:'.8rem', fontWeight:700}}>حجم الخط الأساسي (px)</span>
              <input type="number" min="12" max="22" value={form.ui_base_font_size} onChange={e=>onChange('ui_base_font_size', e.target.value)} />
            </label>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8, alignItems:'center'}}>
            <label style={{display:'flex', gap:8, alignItems:'center'}}>
              <input type="checkbox" checked={!!form.ui_button_shadow} onChange={e=>onChange('ui_button_shadow', e.target.checked)} />
              <span style={{fontSize:'.9rem', fontWeight:700}}>تفعيل ظل الأزرار</span>
            </label>
            <label style={{display:'grid', gap:6}}>
              <span style={{fontSize:'.8rem', fontWeight:700}}>مقياس المسافات (spacing scale)</span>
              <input type="number" step="0.1" min="0.5" max="2" value={form.ui_spacing_scale} onChange={e=>onChange('ui_spacing_scale', e.target.value)} />
            </label>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8, alignItems:'center'}}>
            <label style={{display:'grid', gap:6}}>
              <span style={{fontSize:'.8rem', fontWeight:700}}>السمة الافتراضية</span>
              <select value={form.ui_theme_default} onChange={e=>onChange('ui_theme_default', e.target.value)}>
                <option value="system">نظام الجهاز (System)</option>
                <option value="light">فاتح (Light)</option>
                <option value="dark">داكن (Dark)</option>
              </select>
            </label>
            <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
              <Button type="button" variant="success" onClick={applyPreviewToApp}>تطبيق معاينة الواجهة</Button>
              <Button type="button" variant="secondary" onClick={resetPreviewFromSetting}>إعادة القيم المحفوظة</Button>
              <Button type="button" variant="outline" onClick={exportSettings}>تصدير JSON</Button>
              <input ref={importInputRef} type="file" accept="application/json" onChange={e=> onImportFileChange?.(e.target.files?.[0]||null)} style={{display:'none'}} />
              <Button type="button" variant="outline" onClick={triggerImportClick}>استيراد من ملف</Button>
              <input ref={importSaveInputRef} type="file" accept="application/json" onChange={e=> importAndSave?.(e.target.files?.[0]||null)} style={{display:'none'}} />
              <Button type="button" variant="danger" onClick={()=> importSaveInputRef.current?.click()} disabled={importing}>{importing ? 'جارٍ الاستيراد...' : 'استيراد وحفظ'}</Button>
            </div>
          </div>
        </div>
      </fieldset>
    </section>
  );
}
