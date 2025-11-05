import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link, useLocation } from 'react-router-dom';
import { Button, ButtonLink, buttonVariants } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';

const InvoiceViewer = () => {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const { locale } = useLanguage() || { locale: 'ar' };
  const iframeRef = useRef(null);
  const [ready, setReady] = useState(false);
  const location = useLocation();

  const token = (() => { try { return localStorage.getItem('my_store_token') || ''; } catch { return ''; } })();
  const url = `/api/orders/${id}/invoice${token ? `?token=${encodeURIComponent(token)}` : ''}`;

  // Paper options for PDF
  const [size, setSize] = useState('A4');
  const [orientation, setOrientation] = useState('portrait');
  const [mt, setMt] = useState('16');
  const [mr, setMr] = useState('12');
  const [mb, setMb] = useState('16');
  const [ml, setMl] = useState('12');

  // Persist options across visits
  const STORAGE_KEY = 'invoice_paper_opts';
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (v.size) setSize(v.size);
        if (v.orientation) setOrientation(v.orientation);
        if (v.mt != null) setMt(String(v.mt));
        if (v.mr != null) setMr(String(v.mr));
        if (v.mb != null) setMb(String(v.mb));
        if (v.ml != null) setMl(String(v.ml));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const toSave = { size, orientation, mt, mr, mb, ml };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  }, [size, orientation, mt, mr, mb, ml]);

  const pdfUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (size) params.set('size', size);
    if (orientation) params.set('orientation', orientation);
    if (mt) params.set('mt', mt);
    if (mr) params.set('mr', mr);
    if (mb) params.set('mb', mb);
    if (ml) params.set('ml', ml);
    const qs = params.toString();
    return `/api/orders/${id}/invoice.pdf${qs ? `?${qs}` : ''}`;
  }, [id, token, size, orientation, mt, mr, mb, ml]);
  const autoPrint = sp.get('print') === '1' || sp.get('print') === 'true';

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      setReady(true);
      if (autoPrint) {
        try {
          // Delay slightly to ensure layout/fonts settle
          setTimeout(() => {
            iframe.contentWindow && iframe.contentWindow.focus();
            iframe.contentWindow && iframe.contentWindow.print();
          }, 150);
        } catch {}
      }
    };
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [autoPrint, id, location.key]);

  return (
    <div className="min-h-screen flex flex-col" style={{direction: locale === 'ar' ? 'rtl' : 'ltr'}}>
  <div className="px-4 py-3 border-b bg-white flex items-center gap-2 flex-wrap">
    <Link to={locale === 'en' ? '/en/orders' : '/orders'} className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'text-sm' })}>{locale==='ar'?'رجوع للطلبات':'Back to orders'}</Link>
  <ButtonLink href={url} target="_blank" rel="noopener" variant="secondary" size="sm">{locale==='ar'?'فتح في تبويب جديد':'Open in new tab'}</ButtonLink>
        {/* Paper controls */}
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-1">
            <span className="text-gray-600">{locale==='ar'?'الحجم':'Size'}</span>
            <select value={size} onChange={e=>setSize(e.target.value)} className="border rounded px-2 py-1">
              {['A3','A4','A5','LETTER','LEGAL','TABLOID'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span className="text-gray-600">{locale==='ar'?'الاتجاه':'Orientation'}</span>
            <select value={orientation} onChange={e=>setOrientation(e.target.value)} className="border rounded px-2 py-1">
              <option value="portrait">{locale==='ar'?'عمودي':'Portrait'}</option>
              <option value="landscape">{locale==='ar'?'أفقي':'Landscape'}</option>
            </select>
          </label>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-gray-600">{locale==='ar'?'هوامش(mm)':'Margins(mm)'}:</span>
            <input value={mt} onChange={e=>setMt(e.target.value)} className="w-14 border rounded px-2 py-1" title={locale==='ar'?'علوي':'Top'} />
            <input value={mr} onChange={e=>setMr(e.target.value)} className="w-14 border rounded px-2 py-1" title={locale==='ar'?'أيمن':'Right'} />
            <input value={mb} onChange={e=>setMb(e.target.value)} className="w-14 border rounded px-2 py-1" title={locale==='ar'?'سفلي':'Bottom'} />
            <input value={ml} onChange={e=>setMl(e.target.value)} className="w-14 border rounded px-2 py-1" title={locale==='ar'?'أيسر':'Left'} />
          </div>
        </div>
        <ButtonLink href={pdfUrl} target="_blank" rel="noopener" variant="secondary" size="sm">{locale==='ar'?'تحميل PDF':'Download PDF'}</ButtonLink>
        <Button
          type="button"
          onClick={() => { try { const w = iframeRef.current?.contentWindow; w?.focus(); w?.print(); } catch {} }}
          variant="primary"
          size="sm"
          disabled={!ready}
        >{locale==='ar'?'طباعة':'Print'}</Button>
        <div className="ml-auto text-sm text-gray-600">
          {locale==='ar' ? `فاتورة #${id}` : `Invoice #${id}`}
        </div>
      </div>

      <div className="flex-1 bg-gray-50">
        <iframe
          ref={iframeRef}
          title={`invoice-${id}`}
          src={url}
          style={{ width: '100%', height: '100%', border: '0', display: 'block' }}
        />
      </div>
    </div>
  );
};

export default InvoiceViewer;
