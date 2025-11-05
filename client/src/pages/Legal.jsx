import React from 'react';
import { useParams } from 'react-router-dom';
import Terms from './Terms.jsx';
import Privacy from './Privacy.jsx';
import Returns from './Returns.jsx';
import Shipping from './Shipping.jsx';

export default function Legal() {
  const { slug } = useParams();

  if (slug === 'terms') return <Terms />;
  if (slug === 'privacy') return <Privacy />;
  if (slug === 'returns') return <Returns />;
  if (slug === 'shipping') return <Shipping />;

  return (
    <div style={{ direction: 'rtl' }}>
      <h2 style={{ margin: '0 0 1rem' }}>الصفحة القانونية</h2>
      <p style={{ fontSize: 13, color: '#64748b' }}>
        لم يتم العثور على الصفحة المطلوبة: <strong>{slug}</strong>.
      </p>
    </div>
  );
}
