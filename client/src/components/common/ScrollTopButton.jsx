import React from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '../ui';

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
    <Button
      aria-label="العودة للأعلى"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-5 inset-inline-end-5 z-50"
      size="icon"
      variant="primary"
    >
      <ArrowUp size={18} />
    </Button>
  );
}
