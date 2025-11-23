import React from 'react';
import { cn } from '../../../lib/utils.js';

const patternClass = 'after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08)_0,_rgba(255,255,255,0)_60%)] after:opacity-70 after:pointer-events-none';

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
      className={cn('min-h-screen bg-slate-950 text-white relative overflow-hidden', patternClass, className)}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-8">
        <div className="grid flex-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <aside className="hidden flex-col justify-between rounded-3xl border border-white/5 bg-white/5 p-10 backdrop-blur-md lg:flex">
            <div>
              <p className="text-sm font-semibold text-emerald-300">بوابة الإدارة</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-white">{title}</h1>
              {subtitle ? (
                <p className="mt-3 text-sm leading-6 text-slate-200/90">{subtitle}</p>
              ) : null}
            </div>
            {highlights.length ? (
              <ul className="mt-10 space-y-4 text-sm text-slate-200">
                {highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-end gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
                  >
                    <span className="text-right leading-relaxed">{item}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/20 text-emerald-200">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <footer className="mt-10 text-xs text-slate-400">
              © {new Date().getFullYear()} شركة منفذ اسيا التجارية. جميع الحقوق محفوظة.
            </footer>
          </aside>
          <main className="flex items-center justify-center">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-lg">
              {children}
              {footer ? <div className="mt-8 text-center text-xs text-slate-400">{footer}</div> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
