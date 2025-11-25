import React from 'react';
import { cn } from '../../../lib/utils.js';

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
      className={cn('min-h-screen bg-background text-text relative overflow-hidden', patternClass, className)}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-8">
        <div className="grid flex-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <aside className="hidden flex-col justify-between rounded-2xl border border-border bg-surface/50 p-10 backdrop-blur-md lg:flex">
            <div>
              <p className="text-sm font-semibold text-primary">بوابة الإدارة</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-text">{title}</h1>
              {subtitle ? (
                <p className="mt-3 text-sm leading-6 text-text-soft">{subtitle}</p>
              ) : null}
            </div>
            {highlights.length ? (
              <ul className="mt-10 space-y-4 text-sm text-text-soft">
                {highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-end gap-3 rounded-xl border border-border bg-surface/50 px-4 py-3 backdrop-blur-sm"
                  >
                    <span className="text-right leading-relaxed">{item}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 bg-primary/20 text-primary">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <footer className="mt-10 text-xs text-text-faint">
              © {new Date().getFullYear()} شركة منفذ اسيا التجارية. جميع الحقوق محفوظة.
            </footer>
          </aside>
          <main className="flex items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-surface/70 p-8 shadow-2xl backdrop-blur-lg">
              {children}
              {footer ? <div className="mt-8 text-center text-xs text-text-faint">{footer}</div> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
