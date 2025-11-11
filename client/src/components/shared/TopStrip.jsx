import React from 'react';

/**
 * TopStrip Component - Displays promotional banners at the top of the page
 */
const TopStrip = ({ banners = [] }) => {
  if (!banners.length) return null;

  return (
    <div className="top-strip bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-sm shadow-lg border-b border-emerald-500/20">
      <div className="container flex justify-center gap-6 py-3 overflow-x-auto scrollbar-hide">
        {banners.map((b, index) => {
          const href = b.linkUrl || '#';
          const isExternal = typeof href === 'string' && /^(https?:)?\/\//i.test(href) && !href.startsWith('/');

          return (
            <a
              key={b.id}
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="group inline-flex items-center gap-3 hover:scale-105 transition-all duration-300 ease-out bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/20 border border-white/20 hover:border-white/30"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {b.image && (
                <img
                  src={b.image}
                  alt={b.resolvedTitle || b.title}
                  loading="lazy"
                  className="h-6 w-6 rounded-full object-cover ring-2 ring-white/30 group-hover:ring-white/50 transition-all duration-300"
                />
              )}
              <span className="font-medium truncate max-w-xs group-hover:text-emerald-100 transition-colors duration-300">
                {b.resolvedTitle || b.title}
              </span>
              {isExternal && (
                <svg className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default TopStrip;