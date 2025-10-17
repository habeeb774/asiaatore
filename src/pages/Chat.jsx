import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { api } from '../api/client.js';
import { useLocation } from 'react-router-dom';

function initials(name = '') {
  return name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
}

export default function ChatPage() {
  const { threads, setThreads, currentThread, setCurrentThread, messages, setMessages } = useChat();
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const location = useLocation();
  const initAs = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const a = params.get('as');
    return (a === 'seller' || a === 'delivery') ? a : 'buyer';
  }, [location.search]);
  const [as, setAs] = useState(initAs);

  // Load threads
  useEffect(() => {
    api.chatListThreads(as)
      .then(d => { if (d?.ok) setThreads(d.items || d.threads || []); })
      .catch(() => {});
  }, [as, setThreads]);

  // Load messages for selected thread
  useEffect(() => {
    if (!currentThread) return;
    api.chatGetMessages(currentThread.id)
      .then(d => {
        if (d?.ok) setMessages(d.messages || []);
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      })
      .catch(() => {});
  }, [currentThread, setMessages]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!draft.trim() || !currentThread) return;
    try {
      const data = await api.chatSendMessage(currentThread.id, draft.trim());
      if (data?.ok && data.message) {
        setMessages(prev => [...prev, data.message]);
      }
      setDraft('');
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    } catch {}
  };

  return (
    <div className="chat-page" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, padding: 16 }}>
      <aside style={{ borderInlineStart: '1px solid #e5e7eb', paddingInlineStart: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={() => setAs('buyer')} className={as==='buyer' ? 'active' : ''}>كمشتري</button>
          <button onClick={() => setAs('seller')} className={as==='seller' ? 'active' : ''}>كَبائع</button>
          <button onClick={() => setAs('delivery')} className={as==='delivery' ? 'active' : ''}>كسائق</button>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {threads.map(t => (
            <li key={t.id} onClick={() => setCurrentThread(t)} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: currentThread?.id===t.id ? '#f8fafc' : '#fff' }}>
              <div style={{ fontWeight: 700 }}>{t.title || 'محادثة'}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{t.lastMessage || '—'}</div>
            </li>
          ))}
        </ul>
      </aside>
      <main style={{ display: 'grid', gridTemplateRows: '1fr auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <div ref={listRef} style={{ padding: 12, overflow: 'auto' }}>
          {!currentThread && <div style={{ color: '#64748b' }}>اختر محادثة…</div>}
          {currentThread && (
            <div style={{ display: 'grid', gap: 8 }}>
              {messages.map(m => (
                <div key={m.id} style={{ justifySelf: m.role==='buyer' ? 'end' : 'start', background: '#f1f5f9', padding: '8px 10px', borderRadius: 10, maxWidth: 420 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(m.createdAt || m.ts).toLocaleTimeString('ar')}</div>
                  <div>{m.content || m.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e5e7eb' }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="اكتب رسالة…" style={{ flex: 1, padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
          <button onClick={send} style={{ padding: '10px 14px', border: '1px solid #0ea5e9', background: '#0ea5e9', color: '#fff', borderRadius: 8 }}>إرسال</button>
        </div>
      </main>
    </div>
  );
}
