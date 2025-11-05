import React from 'react';

const SettingsTopStrip = ({ form, onChange, errors }) => {
  return (
    <section id="top-strip" style={{scrollMarginTop:80}}>
      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>الشريط العلوي (Top Strip)</legend>
        <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8, alignItems:'center'}}>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!form.topStripEnabled} onChange={e=>onChange('topStripEnabled', e.target.checked)} />
            <span style={{fontSize:'.8rem', fontWeight:700}}>تفعيل الشريط العلوي</span>
          </label>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!form.topStripAutoscroll} onChange={e=>onChange('topStripAutoscroll', e.target.checked)} />
            <span style={{fontSize:'.8rem', fontWeight:700}}>تحريك تلقائي</span>
          </label>
          <label htmlFor="topStripBackground" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>لون الخلفية</span>
            <input id="topStripBackground" type="color" value={form.topStripBackground} onChange={e=>onChange('topStripBackground', e.target.value)} />
            <input aria-label="Hex" value={form.topStripBackground} onChange={e=>onChange('topStripBackground', e.target.value)} />
            {errors.topStripBackground && <small style={{color:'#dc2626'}}>{errors.topStripBackground}</small>}
          </label>
          <div style={{fontSize:'.65rem', opacity:.7}}>محتوى الشريط العلوي يُدار من قسم التسويق (بانرات الموقع - موقع topStrip).</div>
        </div>
      </fieldset>
    </section>
  );
};

export default SettingsTopStrip;
