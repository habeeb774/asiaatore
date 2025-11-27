import React from 'react';

export default function Fieldset({ title, children, legendProps = {}, style = {} }) {
  return (
    <fieldset style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:8, padding:12, ...style}}>
      {title ? <legend style={{padding:'0 6px', fontWeight:800, fontSize:'.85rem'}} {...legendProps}>{title}</legend> : null}
      {children}
    </fieldset>
  );
}
