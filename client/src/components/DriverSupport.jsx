import React, { useEffect, useState, useRef } from 'react';

// Minimal driver support chat component.
// Uses simple REST + SSE endpoints implemented in /api/support

// Vite env variables are available via import.meta.env; avoid using `process` in the browser.
const SUPPORT_PHONE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPPORT_PHONE) || '+966500000000';

export default function DriverSupport({ orderId, user }) {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const esRef = useRef(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // create or reuse a chat for this order
    if (!orderId) return;
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/api/support/chats', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ orderId, userId: user?.id || null, driverId: user?.id || null })
        });
        const json = await resp.json();
        if (!mounted) return;
        setChatId(json.chatId);
      } catch (e) {
        console.error('create chat error', e);
      }
    })();
    return () => { mounted = false; };
  }, [orderId, user]);

  useEffect(() => {
    if (!chatId) return;
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/support/chats/${chatId}/messages`);
        const j = await r.json();
        if (mounted) setMessages(j.messages || []);
      } catch (e) { console.error(e); }
    })();

    // open SSE
    try {
      const es = new EventSource(`/api/support/chats/${chatId}/stream`);
      es.addEventListener('message', (ev) => {
        try {
          const msg = JSON.parse(ev.data || '{}');
          setMessages((prev) => prev.concat([msg]));
        } catch {}
      });
      esRef.current = es;
  } catch { /* ignore */ }

    return () => {
      mounted = false;
      try { esRef.current?.close(); } catch {}
    };
  }, [chatId]);

  const send = async () => {
    if (!chatId || !text.trim()) return;
    setBusy(true);
    try {
      const resp = await fetch(`/api/support/chats/${chatId}/messages`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: 'driver', text })
      });
      const j = await resp.json();
      if (j?.message) setMessages((p) => p.concat([j.message]));
      setText('');
    } catch (e) {
      console.error('send message', e);
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-3 border rounded p-2 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-sm">التواصل مع الدعم</div>
        <div className="text-xs text-gray-500">#{orderId ? orderId.slice(0,8) : '—'}</div>
      </div>
      <div className="space-y-2 max-h-40 overflow-auto text-sm mb-2">
        {messages.length === 0 && <div className="text-xs text-gray-500">لا توجد رسائل بعد</div>}
        {messages.map(m => (
          <div key={m.id} className={`p-2 rounded ${m.from === 'driver' ? 'bg-blue-50 text-right' : 'bg-white text-left'}`}>
            <div className="text-xs text-gray-600">{new Date(m.at).toLocaleTimeString('ar-SA')}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-2 py-1 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="أرسل رسالة للدعم..." />
        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm" onClick={send} disabled={busy || !text.trim()}>إرسال</button>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        أو
        <a className="ml-2 text-blue-600 underline" href={`tel:${SUPPORT_PHONE}`}>اتصل بالدعم</a>
      </div>
    </div>
  );
}
