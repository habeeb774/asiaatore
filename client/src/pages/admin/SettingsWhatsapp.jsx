import React from 'react';
import { Button } from '../../components/ui';

export default function SettingsWhatsapp(props){
  const { waDiag, waLoading, loadWaDiag, waOrderId, setWaOrderId, waSending, sendWaForOrder, waSendResult } = props;

  return (
    <section id="whatsapp" style={{scrollMarginTop:80}}>
      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>الرسائل عبر واتساب</legend>
        <div style={{display:'grid', gap:8}}>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!(waDiag?.enabled)} readOnly />
            <span style={{fontWeight:700}}>تفعيل إرسال الفاتورة عبر واتساب (التهيئة عبر إعدادات المزوّد)</span>
          </label>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <Button type="button" variant="outline" onClick={loadWaDiag} disabled={waLoading}>{waLoading ? 'يفحص...' : 'تشخيص الإعداد'}</Button>
            {waDiag && (
              <div className="text-xs" style={{display:'grid', gap:4}}>
                <div>المزوّد: <strong>{waDiag.provider || '—'}</strong></div>
                <div>جاهزية التهيئة: <strong style={{color: ((waDiag.configured && waDiag.enabled) ? '#065f46' : '#991b1b')}}>{(waDiag.configured && waDiag.enabled) ? 'جاهز' : 'غير مكتمل'}</strong></div>
                {(waDiag.meta || waDiag.twilio) && (
                  <div style={{display:'grid', gridTemplateColumns:'repeat(2, minmax(120px,1fr))', gap:6}}>
                    {Object.entries(waDiag.meta || waDiag.twilio).map(([k,v]) => (
                      <div key={k} className="text-[11px]" style={{opacity:.85}}>
                        <span style={{fontWeight:700}}>{k}</span>: <span style={{color: v ? '#065f46' : '#991b1b'}}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {waDiag.error && <div className="text-[11px] text-red-700">خطأ: {waDiag.error}</div>}
              </div>
            )}
          </div>

          <div style={{display:'grid', gap:6, borderTop:'1px dashed #e2e8f0', paddingTop:8}}>
            <label htmlFor="waOrderId" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>اختبار: إرسال فاتورة طلب عبر واتساب (أدخل رقم الطلب)</span>
              <div style={{display:'grid', gridTemplateColumns:'minmax(140px, 220px) auto', gap:8, alignItems:'center'}}>
                <input id="waOrderId" value={waOrderId} onChange={e=>setWaOrderId(e.target.value)} placeholder="مثال: ord_123..." />
                <Button type="button" variant="success" size="sm" onClick={sendWaForOrder} disabled={waSending || !waOrderId}>{waSending ? 'يرسل...' : 'إرسال عبر واتساب'}</Button>
              </div>
            </label>
            {waSendResult && (
              <div className="text-[12px]" style={{color: waSendResult.ok !== false ? '#065f46' : '#991b1b'}}>
                {waSendResult.ok !== false ? 'تم الإرسال (تحقق من سجل الإرسال/الويب هوك).' : `فشل الإرسال: ${waSendResult.message || 'غير معروف'}`}
              </div>
            )}
            <small style={{opacity:.7}}>ملاحظة: يتطلب ذلك صلاحية الأدمن وتهيئة مزود واتساب بنجاح. للاختبار المحلي، فعّل رؤوس التطوير ALLOW_DEV_HEADERS.</small>
          </div>
        </div>
      </fieldset>
    </section>
  );
}
