import React, { useEffect, useRef, useState } from 'react';
import Button from './ui/Button';

// SafetyTimer warns driver after a configurable continuous drive duration
export default function SafetyTimer({ thresholdMinutes = 120 }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 60 * 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (elapsed >= thresholdMinutes) {
      // Show an in-app banner; use Notification API if granted
      try {
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('تنبيه سلامة', { body: 'حان الوقت لأخذ استراحة قصيرة.' });
        }
      } catch {}
    }
  }, [elapsed, thresholdMinutes]);

  return (
    <div className="p-3 bg-white rounded shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">مهلة القيادة الحالية</div>
          <div className="text-lg font-semibold">{Math.floor(elapsed)} دقيقة</div>
        </div>
          <div className="flex gap-2">
          {!running ? (
            <Button variant="primary" onClick={() => setRunning(true)}>ابدأ</Button>
          ) : (
            <Button variant="secondary" onClick={() => setRunning(false)}>أوقف</Button>
          )}
          <Button variant="secondary" onClick={() => setElapsed(0)}>إعادة ضبط</Button>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-500">سيتلقى السائق تنبيهًا بعد {thresholdMinutes} دقيقة.</div>
    </div>
  );
}
