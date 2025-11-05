import React from 'react';
import { Button } from '../../components/ui';

export default function SettingsShippingPayment(props) {
  const { form, onChange, errors } = props;

  return (
    <section id="shipping-payment" style={{scrollMarginTop:80}}>
      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}}>الشحن والدفع</legend>
        <div style={{display:'grid', gridTemplateColumns:'var(--cols-3)', gap:8}}>
          <label htmlFor="shippingBase" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>رسوم أساسية (SAR)</span>
            <input id="shippingBase" type="number" step="0.01" value={form.shippingBase} onChange={e=>onChange('shippingBase', e.target.value)} placeholder="مثال: 10" />
            {errors.shippingBase && <small style={{color:'#dc2626'}}>{errors.shippingBase}</small>}
          </label>
          <label htmlFor="shippingPerKm" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>لكل كم (SAR/km)</span>
            <input id="shippingPerKm" type="number" step="0.01" value={form.shippingPerKm} onChange={e=>onChange('shippingPerKm', e.target.value)} placeholder="0.7" />
            {errors.shippingPerKm && <small style={{color:'#dc2626'}}>{errors.shippingPerKm}</small>}
          </label>
          <label htmlFor="shippingMin" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>الحد الأدنى</span>
            <input id="shippingMin" type="number" step="0.01" value={form.shippingMin} onChange={e=>onChange('shippingMin', e.target.value)} placeholder="15" />
            {errors.shippingMin && <small style={{color:'#dc2626'}}>{errors.shippingMin}</small>}
          </label>
          <label htmlFor="shippingMax" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>الحد الأقصى</span>
            <input id="shippingMax" type="number" step="0.01" value={form.shippingMax} onChange={e=>onChange('shippingMax', e.target.value)} placeholder="60" />
            {errors.shippingMax && <small style={{color:'#dc2626'}}>{errors.shippingMax}</small>}
          </label>
          <label htmlFor="shippingFallback" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>تعرفة احتياطية</span>
            <input id="shippingFallback" type="number" step="0.01" value={form.shippingFallback} onChange={e=>onChange('shippingFallback', e.target.value)} placeholder="25" />
            {errors.shippingFallback && <small style={{color:'#dc2626'}}>{errors.shippingFallback}</small>}
          </label>
          <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
            <label htmlFor="originLat" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>إحداثي المتجر (Lat)</span>
              <input id="originLat" type="number" step="0.0001" value={form.originLat} onChange={e=>onChange('originLat', e.target.value)} placeholder="24.7136" />
              {errors.originLat && <small style={{color:'#dc2626'}}>{errors.originLat}</small>}
            </label>
            <label htmlFor="originLng" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>إحداثي المتجر (Lng)</span>
              <input id="originLng" type="number" step="0.0001" value={form.originLng} onChange={e=>onChange('originLng', e.target.value)} placeholder="46.6753" />
              {errors.originLng && <small style={{color:'#dc2626'}}>{errors.originLng}</small>}
            </label>
          </div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'var(--cols-4-min)', gap:8, marginTop:8}}>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!form.payPaypalEnabled} onChange={e=>onChange('payPaypalEnabled', e.target.checked)} /> PayPal
          </label>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!form.payStcEnabled} onChange={e=>onChange('payStcEnabled', e.target.checked)} /> STC Pay
          </label>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!form.payCodEnabled} onChange={e=>onChange('payCodEnabled', e.target.checked)} /> الدفع عند الاستلام
          </label>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!form.payBankEnabled} onChange={e=>onChange('payBankEnabled', e.target.checked)} /> التحويل البنكي
          </label>
        </div>
      </fieldset>
    </section>
  );
}
