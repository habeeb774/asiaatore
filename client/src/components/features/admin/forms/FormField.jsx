import React from 'react';

export default function FormField({ label, htmlFor, error, children, hint }) {
  return (
    <label htmlFor={htmlFor} style={{display:'grid', gap:4}}>
      {label ? <span style={{fontSize:'.7rem', fontWeight:700}}>{label}</span> : null}
      {children}
      {hint ? <small style={{opacity:.7}}>{hint}</small> : null}
      {error ? <small style={{color:'var(--color-danger)'}}>{error}</small> : null}
    </label>
  );
}
