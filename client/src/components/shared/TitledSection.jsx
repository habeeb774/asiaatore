import React from 'react';
import { Link } from 'react-router-dom';

/**
 * TitledSection
 * Renders a section with a heading, optional "view all" link, and content.
 * Props:
 *  - title: string | ReactNode
 *  - viewAllLink?: string
 *  - className?: string
 */
export default function TitledSection({ title, viewAllLink, className = '', children }) {
  return (
    <section className={`w-full ${className}`}>
      <div className="container-custom py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg md:text-xl font-bold tracking-tight">{title}</h2>
          {viewAllLink ? (
            <Link className="text-sm text-emerald-700 hover:text-emerald-800 font-medium" to={viewAllLink}>
              عرض الكل
            </Link>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
