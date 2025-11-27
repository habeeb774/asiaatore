import React from 'react';
import { cn } from '../../../lib/utils.js';
import '../../../styles/legacy/auth-luxury.css';

// Updated pattern to use a more subtle, theme-aligned effect
const patternClass = 'after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top,_var(--color-primary-alt_/_0.08)_0,_transparent_60%)] after:opacity-70 after:pointer-events-none';

const AuthShell = ({
  title,
  subtitle,
  highlights = [],
  children,
  footer,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn('luxury-auth luxury-fade-in', className)}
      {...props}
    >
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-8">
        <div className="grid flex-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <aside className="luxury-sidebar hidden flex-col justify-between lg:flex">
            <div>
              <p className="text-sm font-semibold text-primary">بوابة الإدارة</p>
              <h1 className="luxury-heading mt-4 text-3xl">{title}</h1>
              {subtitle ? (
                <p className="luxury-subheading">{subtitle}</p>
              ) : null}
            </div>
            {highlights.length ? (
              <ul className="mt-10 space-y-4">
                {highlights.map((item, idx) => (
                  <li key={idx} className="luxury-highlight-item">
                    <span className="text-right leading-relaxed">{item}</span>
                    <span className="luxury-highlight-number">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <footer className="luxury-footer">
              © {new Date().getFullYear()} شركة منفذ اسيا التجارية. جميع الحقوق محفوظة.
            </footer>
          </aside>
          <main className="flex items-center justify-center">
            <div className="luxury-card w-full max-w-lg">
              {children}
              {footer ? <div className="luxury-footer">{footer}</div> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
