import React from 'react';
import { Link } from 'react-router-dom';

// items: Array<{ label: string, to?: string }>
const Breadcrumbs = ({ items = [], className = '' }) => {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <nav className={`text-sm text-gray-500 mb-3 ${className}`} aria-label="breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((it, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <li aria-hidden>›</li>}
            <li>
              {it.to ? (
                <Link to={it.to} className="hover:text-primary-red">{it.label}</Link>
              ) : (
                <span className="text-gray-700">{it.label}</span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
