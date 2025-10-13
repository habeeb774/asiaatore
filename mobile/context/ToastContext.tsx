import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { View, Text as RNText } from 'react-native';

type Toast = { id: string; type?: 'success'|'error'|'warn'|'info'; title?: string; description?: string };
type ToastCtx = { show: (t: Omit<Toast, 'id'>) => void };

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, ...t };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 2600);
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Overlay container */}
      <View pointerEvents="none" style={{ position:'absolute', top: 40, left: 12, right: 12, gap: 8 }}>
        {toasts.map(t => (
          <View key={t.id} style={{ backgroundColor: t.type==='error' ? '#fee2e2' : t.type==='warn' ? '#fef3c7' : t.type==='success' ? '#dcfce7' : '#e5e7eb', padding: 12, borderRadius: 10, borderWidth:1, borderColor:'rgba(0,0,0,0.08)' }}>
            {t.title ? <RNText style={{ fontWeight:'700', marginBottom: t.description?4:0 }}>{t.title}</RNText> : null}
            {t.description ? <RNText style={{ opacity:.8 }}>{t.description}</RNText> : null}
          </View>
        ))}
      </View>
    </Ctx.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
