import React, { useEffect, useState } from 'react';

// Simple page loader component that shows two styles from the theme:
// - loader-init: small spinner
// - content-loading: larger segmented spinner
// It hides itself after window "load" or after a timeout to avoid blocking.

export default function PageLoader({ timeout = 1200 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let t = null;

    function hide() {
      setVisible(false);
      window.removeEventListener('load', hide);
    }

    if (document.readyState === 'complete') {
      t = setTimeout(hide, timeout);
    } else {
      window.addEventListener('load', hide);
      // safety fallback
      t = setTimeout(hide, timeout + 800);
    }

    return () => {
      window.removeEventListener('load', hide);
      if (t) clearTimeout(t);
    };
  }, [timeout]);

  if (!visible) return null;

  return (
    <>
      <div className={`loader-init`} aria-hidden={!visible} />

      <div className={`content-loading`} role="status" aria-hidden={!visible}>
        <div className="container">
          <div className="lds-spinner" aria-hidden>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
