import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ChatContext = createContext(null);

function createChannel(name = 'my-store-chat') {
  try {
    return new BroadcastChannel(name);
  } catch (e) {
    return null;
  }
}

export function ChatProvider({ children }) {
  const [threads, setThreads] = useState([]);
  const [currentThread, setCurrentThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typing, setTyping] = useState({}); // { threadId: Set<name> }
  const evtRef = useRef(null);
  const bcRef = useRef(null);

  // Helper to bump a thread preview and ensure it exists
  const bumpThread = (threadId, opts = {}) => {
    setThreads(prev => {
      const exists = prev.find(t => t.id === threadId);
      if (!exists) return [{ id: threadId, title: opts.title || 'الدعم', lastMessage: opts.lastMessage || '', lastMessageAt: new Date().toISOString() }, ...prev];
      return prev.map(t => t.id === threadId ? { ...t, lastMessage: opts.lastMessage || t.lastMessage, lastMessageAt: new Date().toISOString() } : t);
    });
  };

  useEffect(() => {
    // SSE for server-driven chat messages
    try {
      const url = '/api/events';
      const es = new EventSource(url, { withCredentials: true });
      const onMsg = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (ev.type === 'message' || ev.type === 'chat.message') {
            const threadId = payload.threadId || 'default';
            bumpThread(threadId, { lastMessage: payload.message?.content || payload.text });
            if (threadId === currentThread?.id) {
              setMessages(prev => [...prev, payload.message || { id: payload.id, from: payload.from, text: payload.text, ts: payload.ts }]);
            } else {
              setUnreadCounts(prev => ({ ...prev, [threadId]: (prev[threadId] || 0) + 1 }));
            }
          }
        } catch {}
      };
      es.addEventListener('chat.message', onMsg);
      // also listen to generic message events if server emits them
      es.addEventListener('message', onMsg);
      evtRef.current = es;
      // cleanup
      return () => { try { es.close(); } catch {} };
    } catch (e) {
      // ignore if EventSource not available or endpoint not present
    }
   
  }, [currentThread?.id]);

  useEffect(() => {
    // BroadcastChannel/localStorage to sync client-only messages and typing across tabs
    const bc = createChannel();
    bcRef.current = bc;

    const handlePayload = (payload) => {
      if (!payload) return;
      const threadId = payload.threadId || 'default';
      if (payload.type === 'message') {
        bumpThread(threadId, { lastMessage: payload.text });
        if (threadId === currentThread?.id) {
          setMessages(prev => [...prev, { id: payload.id, from: payload.from, text: payload.text, ts: payload.ts }]);
        } else {
          setUnreadCounts(prev => ({ ...prev, [threadId]: (prev[threadId] || 0) + 1 }));
        }
      } else if (payload.type === 'typing') {
        setTyping(prev => {
          const s = new Set(prev[threadId] || []);
          s.add(payload.from);
          const next = { ...prev, [threadId]: Array.from(s) };
          return next;
        });
        // clear typing after short timeout
        setTimeout(() => {
          setTyping(prev => {
            const s = new Set(prev[threadId] || []);
            s.delete(payload.from);
            return { ...prev, [threadId]: Array.from(s) };
          });
        }, 2500);
      }
    };

    if (bc) {
      const h = (ev) => handlePayload(ev.data);
      bc.addEventListener('message', h);
      return () => bc.removeEventListener('message', h);
    }

    const storageHandler = (ev) => {
      try {
        if (!ev.key || !ev.key.startsWith('chat-msg:')) return;
        const payload = JSON.parse(ev.newValue);
        handlePayload(payload);
      } catch {}
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
   
  }, [currentThread?.id]);

  const sendMessage = ({ text, from, threadId = 'default' }) => {
    const payload = { type: 'message', id: Date.now() + '-' + Math.random().toString(36).slice(2,8), ts: new Date().toISOString(), from, text, threadId };
    // post via BroadcastChannel if available
    try {
      if (bcRef.current) bcRef.current.postMessage(payload);
      else {
        const key = `chat-msg:${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(payload));
        setTimeout(() => { try { localStorage.removeItem(key); } catch {} }, 15000);
      }
    } catch {}
    // Local echo
    bumpThread(threadId, { lastMessage: payload.text });
    if (threadId === currentThread?.id) setMessages(prev => [...prev, { id: payload.id, from: payload.from, text: payload.text, ts: payload.ts }]);
    else setUnreadCounts(prev => ({ ...prev, [threadId]: (prev[threadId] || 0) + 1 }));
    return payload;
  };

  const sendTyping = ({ from, threadId = 'default' }) => {
    const payload = { type: 'typing', from, threadId, ts: new Date().toISOString() };
    try {
      if (bcRef.current) bcRef.current.postMessage(payload);
      else {
        const key = `chat-typing:${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(payload));
        setTimeout(() => { try { localStorage.removeItem(key); } catch {} }, 2000);
      }
    } catch {}
    // optimistic local typing display
    setTyping(prev => {
      const s = new Set(prev[threadId] || []);
      s.add(from);
      return { ...prev, [threadId]: Array.from(s) };
    });
    setTimeout(() => {
      setTyping(prev => {
        const s = new Set(prev[threadId] || []);
        s.delete(from);
        return { ...prev, [threadId]: Array.from(s) };
      });
    }, 2500);
  };

  const markThreadRead = (threadId) => {
    setUnreadCounts(prev => ({ ...prev, [threadId]: 0 }));
  };

  const unreadTotal = Object.values(unreadCounts).reduce((s, v) => s + (v || 0), 0);

  const value = useMemo(() => ({
    threads, setThreads,
    currentThread, setCurrentThread,
    messages, setMessages,
    unreadCounts,
    unreadTotal,
    typing,
    sendMessage,
    sendTyping,
    markThreadRead
  }), [threads, currentThread, messages, unreadCounts, typing]);

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
