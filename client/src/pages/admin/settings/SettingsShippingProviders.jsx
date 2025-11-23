import React from 'react';

export default function SettingsShippingProviders(props) {
  const { form, onChange, errors } = props;

  return (
    <section id="shipping-providers" style={{scrollMarginTop:80}}>
      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>مزودو الشحن (Aramex / SMSA)</legend>
        <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:12}}>
          <div style={{display:'grid', gap:8, alignContent:'start'}}>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <input id="aramexEnabled" type="checkbox" checked={!!form.aramexEnabled} onChange={e=>onChange('aramexEnabled', e.target.checked)} />
              <label htmlFor="aramexEnabled" style={{fontWeight:700}}>تفعيل Aramex</label>
            </div>
            <label htmlFor="aramexApiUrl" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>Aramex API URL</span>
              <input id="aramexApiUrl" type="url" value={form.aramexApiUrl} onChange={e=>onChange('aramexApiUrl', e.target.value)} placeholder="https://api.aramex.com/..." />
              {errors.aramexApiUrl && <small style={{color:'#dc2626'}}>{errors.aramexApiUrl}</small>}
            </label>
            <label htmlFor="aramexApiKey" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>API Key</span>
              <input id="aramexApiKey" value={form.aramexApiKey} onChange={e=>onChange('aramexApiKey', e.target.value)} placeholder="••••••" />
            </label>
            <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
              <label htmlFor="aramexApiUser" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>Username</span>
                <input id="aramexApiUser" value={form.aramexApiUser} onChange={e=>onChange('aramexApiUser', e.target.value)} placeholder="user" />
              </label>
              <label htmlFor="aramexApiPass" style={{display:'grid', gap:4}}>
                <span style={{fontSize:'.7rem', fontWeight:700}}>Password</span>
                <input id="aramexApiPass" type="password" value={form.aramexApiPass} onChange={e=>onChange('aramexApiPass', e.target.value)} placeholder="••••••" />
              </label>
            </div>
            <label htmlFor="aramexWebhookSecret" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>Webhook Secret (توقيع)</span>
              <input id="aramexWebhookSecret" value={form.aramexWebhookSecret} onChange={e=>onChange('aramexWebhookSecret', e.target.value)} placeholder="secret" />
            </label>
          </div>
          <div style={{display:'grid', gap:8, alignContent:'start'}}>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <input id="smsaEnabled" type="checkbox" checked={!!form.smsaEnabled} onChange={e=>onChange('smsaEnabled', e.target.checked)} />
              <label htmlFor="smsaEnabled" style={{fontWeight:700}}>تفعيل SMSA</label>
            </div>
            <label htmlFor="smsaApiUrl" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>SMSA API URL</span>
              <input id="smsaApiUrl" type="url" value={form.smsaApiUrl} onChange={e=>onChange('smsaApiUrl', e.target.value)} placeholder="https://api.smsaexpress.com/..." />
              {errors.smsaApiUrl && <small style={{color:'#dc2626'}}>{errors.smsaApiUrl}</small>}
            </label>
            <label htmlFor="smsaApiKey" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>API Key</span>
              <input id="smsaApiKey" value={form.smsaApiKey} onChange={e=>onChange('smsaApiKey', e.target.value)} placeholder="••••••" />
            </label>
            <label htmlFor="smsaWebhookSecret" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>Webhook Secret (توقيع)</span>
              <input id="smsaWebhookSecret" value={form.smsaWebhookSecret} onChange={e=>onChange('smsaWebhookSecret', e.target.value)} placeholder="secret" />
            </label>
          </div>
        </div>
        <small style={{opacity:.7}}>عند التفعيل، سيقرأ السيرفر هذه القيم من قاعدة البيانات بدلاً من متغيرات البيئة. تأكد من إعداد مسارات الويب هوك المناسبة لكل مزود.</small>
      </fieldset>
    </section>
  );
}
