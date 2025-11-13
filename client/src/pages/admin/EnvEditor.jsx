import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui';

// API helper functions
const apiCall = async (method, path, body) => {
  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  const url = `${baseUrl}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw { ...error, status: res.status };
  }
  return res.json();
};

const envGet = () => apiCall('GET', '/env');
const envUpdate = (scope, entries) => apiCall('PATCH', '/env', { scope, entries });
const envDbTest = (payload) => apiCall('POST', '/env/db/test', payload);

export default function EnvEditor() {
  const [loading, setLoading] = useState(true);
  const [savingClient, setSavingClient] = useState(false);
  const [savingServer, setSavingServer] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState('');
  const [files, setFiles] = useState({ serverEnv: '', clientEnv: '' });
  const [prod, setProd] = useState(false);
  // Client env
  const [viteProxyTarget, setViteProxyTarget] = useState('');
  const [viteApiUrl, setViteApiUrl] = useState('');
  const [viteTimeout, setViteTimeout] = useState('');
  // Server env
  const [dbUrl, setDbUrl] = useState('');
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState('3306');
  const [dbUser, setDbUser] = useState('');
  const [dbPass, setDbPass] = useState('');
  const [dbName, setDbName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await envGet();
        setFiles(res?.files || {});
        setProd(!!res?.prod);
        const client = res?.env?.client || {};
        const server = res?.env?.server || {};
        setViteProxyTarget(client.VITE_PROXY_TARGET || '');
        setViteApiUrl(client.VITE_API_URL || '');
        setViteTimeout(client.VITE_API_TIMEOUT_MS || '');
        setDbUrl(server.DATABASE_URL || '');
        setDbHost(server.DB_HOST || '');
        setDbPort(server.DB_PORT || '3306');
        setDbUser(server.DB_USER || '');
        setDbPass('');
        setDbName(server.DB_NAME || '');
      } catch (e) {
        const is404 = e?.status === 404 || /\(GET \/env\)/.test(String(e?.message || ''));
        const hint = is404 ? ' — مسار /api/env غير متاح. أعد تشغيل خادم API أو تأكد من تحديثه.' : '';
        setMsg('فشل تحميل متغيرات البيئة: ' + (e?.data?.message || e?.message || '') + hint);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dbUrlFromParts = useMemo(() => {
    if (!dbHost || !dbUser || !dbName) return '';
    const p = dbPort || '3306';
    const pass = dbPass ? `:${encodeURIComponent(dbPass)}` : '';
    return `mysql://${encodeURIComponent(dbUser)}${pass}@${dbHost}:${p}/${dbName}`;
  }, [dbHost, dbPort, dbUser, dbPass, dbName]);

  const onSaveClient = async () => {
    setSavingClient(true); setMsg('');
    try {
      const entries = {};
      if (viteProxyTarget !== undefined) entries.VITE_PROXY_TARGET = viteProxyTarget;
      if (viteApiUrl !== undefined) entries.VITE_API_URL = viteApiUrl;
      if (viteTimeout !== undefined) entries.VITE_API_TIMEOUT_MS = String(viteTimeout || '');
      const res = await envUpdate('client', entries);
      setMsg(`تم حفظ إعدادات الواجهة (${res.updatedKeys.length} مفتاح) في ${res.file}`);
    } catch (e) {
      const is404 = e?.status === 404 || /\(PATCH \/env\)/.test(String(e?.message || ''));
      const hint = is404 ? ' — مسار /api/env غير متاح. أعد تشغيل خادم API أو تأكد من تحديثه.' : '';
      setMsg('فشل حفظ إعدادات الواجهة: ' + (e?.data?.message || e?.message || '') + hint);
    } finally { setSavingClient(false); }
  };

  const onTestDb = async () => {
    setTesting(true); setMsg('');
    try {
      const payload = dbUrl ? { databaseUrl: dbUrl } : { host: dbHost, port: dbPort, user: dbUser, pass: dbPass, name: dbName };
      const res = await envDbTest(payload);
      setMsg(`نجح الاتصال بقاعدة البيانات. الإصدار: ${res.version || 'غير معروف'}`);
    } catch (e) {
      const is404 = e?.status === 404 || /\(POST \/env\/db\/test\)/.test(String(e?.message || ''));
      const hint = is404 ? ' — مسار /api/env/db/test غير متاح. أعد تشغيل خادم API أو تأكد من تحديثه.' : '';
      setMsg('فشل اختبار الاتصال بقاعدة البيانات: ' + (e?.data?.message || e?.message || '') + hint);
    } finally { setTesting(false); }
  };

  const onSaveServer = async () => {
    setSavingServer(true); setMsg('');
    try {
      const entries = {};
      if (dbUrl) {
        entries.DATABASE_URL = dbUrl;
      } else {
        if (dbHost !== undefined) entries.DB_HOST = dbHost;
        if (dbPort !== undefined) entries.DB_PORT = String(dbPort || '3306');
        if (dbUser !== undefined) entries.DB_USER = dbUser;
        if (dbPass) entries.DB_PASS = dbPass;
        if (dbName !== undefined) entries.DB_NAME = dbName;
      }
      const res = await envUpdate('server', entries);
      setMsg(`تم حفظ إعدادات الخادم (${res.updatedKeys.length} مفتاح) في ${res.file}. قد يتطلب الأمر إعادة تشغيل الخادم ليتم تطبيق التغييرات.`);
    } catch (e) {
      const is404 = e?.status === 404 || /\(PATCH \/env\)/.test(String(e?.message || ''));
      const hint = is404 ? ' — مسار /api/env غير متاح. أعد تشغيل خادم API أو تأكد من تحديثه.' : '';
      setMsg('فشل حفظ إعدادات الخادم: ' + (e?.data?.message || e?.message || '') + hint);
    } finally { setSavingServer(false); }
  };

  if (loading) return <div>يتم تحميل متغيرات البيئة...</div>;

  return (
    <div style={{display:'grid', gap:16}}>
      <div className="text-xs" style={{opacity:.75}}>
        <div>ملفات البيئة:</div>
        <div>الخادم: <code>{files.serverEnv || 'غير محدد'}</code></div>
        <div>الواجهة: <code>{files.clientEnv || 'غير محدد'}</code></div>
        {prod && <div style={{color:'#991b1b'}}>تنبيه: وضع الإنتاج — قد يتم تعطيل تعديل البيئة.</div>}
      </div>

      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:700, fontSize:'.8rem'}}>بيئة الواجهة (Vite)</legend>
        <div style={{display:'grid', gap:8}}>
          <label htmlFor="viteProxyTarget" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>VITE_PROXY_TARGET</span>
            <input id="viteProxyTarget" value={viteProxyTarget} onChange={e=>setViteProxyTarget(e.target.value)} placeholder="http://localhost:8842" />
          </label>
          <label htmlFor="viteApiUrl" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>VITE_API_URL (اختياري)</span>
            <input id="viteApiUrl" value={viteApiUrl} onChange={e=>setViteApiUrl(e.target.value)} placeholder="http://localhost:8842/api" />
          </label>
          <label htmlFor="viteTimeout" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>VITE_API_TIMEOUT_MS (اختياري)</span>
            <input id="viteTimeout" value={viteTimeout} onChange={e=>setViteTimeout(e.target.value)} placeholder="12000" />
          </label>
          <div style={{display:'flex', gap:8}}>
            <Button type="button" variant="primary" onClick={onSaveClient} disabled={savingClient}>
              {savingClient ? 'يحفظ...' : 'حفظ بيئة الواجهة'}
            </Button>
          </div>
        </div>
      </fieldset>

      <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12}}>
        <legend style={{padding:'0 6px', fontWeight:700, fontSize:'.8rem'}}>بيئة الخادم (قاعدة البيانات)</legend>
        <div style={{display:'grid', gap:8}}>
          <label htmlFor="dbUrl" style={{display:'grid', gap:4}}>
            <span style={{fontSize:'.7rem', fontWeight:700}}>DATABASE_URL (بديل عن القيم التفصيلية)</span>
            <input id="dbUrl" value={dbUrl} onChange={e=>setDbUrl(e.target.value)} placeholder="mysql://user:pass@host:3306/dbname" />
          </label>
          <div className="text-xs" style={{opacity:.7}}>أو أدخل القيم التفصيلية أدناه (إذا تم تحديد DATABASE_URL سيتم تجاهل هذه القيم عند الحفظ).</div>
          <div style={{display:'grid', gridTemplateColumns:'var(--cols-2)', gap:8}}>
            <label htmlFor="dbHost" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>DB_HOST</span>
              <input id="dbHost" value={dbHost} onChange={e=>setDbHost(e.target.value)} placeholder="localhost أو عنوان السيرفر" />
            </label>
            <label htmlFor="dbPort" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>DB_PORT</span>
              <input id="dbPort" value={dbPort} onChange={e=>setDbPort(e.target.value)} placeholder="3306" />
            </label>
            <label htmlFor="dbUser" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>DB_USER</span>
              <input id="dbUser" value={dbUser} onChange={e=>setDbUser(e.target.value)} placeholder="root أو اسم المستخدم" />
            </label>
            <label htmlFor="dbPass" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>DB_PASS</span>
              <input id="dbPass" type="password" value={dbPass} onChange={e=>setDbPass(e.target.value)} placeholder="•••••• (اتركه فارغاً لعدم التغيير)" />
            </label>
            <label htmlFor="dbName" style={{display:'grid', gap:4}}>
              <span style={{fontSize:'.7rem', fontWeight:700}}>DB_NAME</span>
              <input id="dbName" value={dbName} onChange={e=>setDbName(e.target.value)} placeholder="اسم قاعدة البيانات" />
            </label>
          </div>
          <div className="text-xs" style={{opacity:.75}}>معاينة سلسلة الاتصال المبنية من القيم التفصيلية:</div>
          <div style={{fontFamily:'monospace', fontSize:12, background:'#f8fafc', padding:'6px 8px', borderRadius:6, direction:'ltr'}}>
            {dbUrlFromParts || '(أدخل القيم لعرض المعاينة)'}
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <Button type="button" variant="success" onClick={onTestDb} disabled={testing}>
              {testing ? 'يفحص...' : 'اختبار الاتصال'}
            </Button>
            <Button type="button" variant="primary" onClick={onSaveServer} disabled={savingServer}>
              {savingServer ? 'يحفظ...' : 'حفظ إعدادات الخادم'}
            </Button>
          </div>
        </div>
      </fieldset>

      <div aria-live="polite" className="text-xs" style={{color: msg?.startsWith('فشل') ? '#991b1b' : '#065f46'}}>{msg}</div>
      <small style={{opacity:.7}}>ملاحظة: قد تحتاج لإعادة تشغيل خادم API وتحديث واجهة Vite حتى تُطبق التغييرات.</small>
    </div>
  );
}
