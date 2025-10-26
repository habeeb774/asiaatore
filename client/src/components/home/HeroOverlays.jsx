import React from 'react';

export default function HeroOverlays() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true" style={{ backgroundImage: `radial-gradient(circle at 10% 20%, rgba(255,255,255,0.3) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.2) 0%, transparent 30%)` }} />
    </>
  );
}
