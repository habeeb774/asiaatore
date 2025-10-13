import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [threads, setThreads] = useState([]);
  const [currentThread, setCurrentThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const evtRef = useRef(null);

  // Subscribe to SSE chat events
  useEffect(() => {
    try {
      const url = '/api/events';
      const es = new EventSource(url, { withCredentials: true });
      es.addEventListener('chat.message', (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.threadId === currentThread?.id) {
            setMessages((prev) => [...prev, payload.message]);
          }
          // bump thread preview
          setThreads((prev) => prev.map(t => t.id === payload.threadId ? { ...t, lastMessage: payload.message.content, lastMessageAt: new Date().toISOString() } : t));
        } catch {}
      });
      evtRef.current = es;
      return () => { es.close(); };
    } catch {}
  }, [currentThread?.id]);

  const value = useMemo(() => ({
    threads, setThreads,
    currentThread, setCurrentThread,
    messages, setMessages,
  }), [threads, currentThread, messages]);

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
