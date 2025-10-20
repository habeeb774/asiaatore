import React from 'react';

export default function ScrollTopButton() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setVisible(y > 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-5 inset-inline-end-5 z-50 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition p-3"
      aria-label="العودة للأعلى"
    >
      ↑
    </button>
  );
}
