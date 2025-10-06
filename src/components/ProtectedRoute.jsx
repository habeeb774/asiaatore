import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Usage examples:
 * <ProtectedRoute isAuthed={isAuthed}><Dashboard /></ProtectedRoute>
 * <Route path="/dash" element={
 *    <ProtectedRoute isAuthed={isAuthed} element={<Dashboard />} />
 * } />
 *
 * Props:
 *  - isAuthed: boolean (ضع القيمة من سياق auth أو store)
 *  - redirectTo: مسار التحويل (افتراضي /login)
 *  - element: بديل عن children (للتوافق مع نمط react-router)
 */
/**
 * Advanced ProtectedRoute
 * Props:
 *  - isAuthed: boolean
 *  - redirectTo: string (login page)
 *  - element|children: ReactNode
 *  - userRole: string (e.g. 'admin','seller','user')
 *  - requiredRoles: string[] (if provided user must satisfy at least one)
 *  - onDenied?: (ctx) => void
 *  - mode: 'redirect' | 'block' (default 'redirect' for unauthenticated; authorized-fail always block)
 *  - forbiddenMessage: custom text
 */
export default function ProtectedRoute({
  isAuthed,
  redirectTo = '/login',
  element,
  children,
  userRole,
  requiredRoles,
  onDenied,
  mode = 'redirect',
  forbiddenMessage
}) {
  const content = element || children || null;
  const needsRole = Array.isArray(requiredRoles) && requiredRoles.length > 0;
  const roleAllowed = !needsRole || (userRole && requiredRoles.includes(userRole));

  // 1) ليس مسجلاً الدخول
  if (!isAuthed) {
    if (mode === 'redirect') {
      return <Navigate to={redirectTo} replace />;
    }
    return (
      <div className="auth-block" role="alert" style={blockStyle}>
        <p style={pStyle}>{forbiddenMessage || 'يجب تسجيل الدخول للوصول إلى هذه الصفحة'}</p>
        <a href={redirectTo} className="btn btn-primary" style={btnStyle}>تسجيل الدخول</a>
      </div>
    );
  }

  // 2) مسجل لكن لا يملك الدور المطلوب
  if (!roleAllowed) {
    onDenied && onDenied({ userRole, requiredRoles });
    return (
      <div className="forbidden-block" role="alert" style={blockStyle}>
        <h2 style={h2Style}>🚫 {forbiddenMessage || 'صلاحيات غير كافية'}</h2>
        <p style={pStyle}>
          {userRole
            ? `دورك الحالي: ${userRole}. الأدوار المسموح بها: ${requiredRoles.join(', ')}`
            : 'لا يمكن تحديد دور حسابك.'}
        </p>
        <a href="/" style={linkStyle}>العودة للصفحة الرئيسية</a>
      </div>
    );
  }

  return content;
}

// Inline styles (kept small & override-able via classes)
const blockStyle = {
  maxWidth: 560,
  margin: '3rem auto',
  background: 'var(--color-surface, #fff)',
  border: '1px solid var(--color-border, #e4e7eb)',
  padding: '2rem 1.75rem',
  borderRadius: '18px',
  textAlign: 'center',
  boxShadow: '0 8px 34px -12px rgba(0,0,0,.12)'
};
const h2Style = { fontSize: '1.05rem', margin: '0 0 1rem', lineHeight: 1.35 };
const pStyle = { fontSize: '.8rem', margin: '0 0 1.25rem', lineHeight: 1.6, color: '#475569' };
const btnStyle = { display:'inline-flex', alignItems:'center', gap:'.4rem', background:'linear-gradient(90deg,#69be3c,#f6ad55)', color:'#fff', padding:'.65rem 1rem', borderRadius:10, textDecoration:'none', fontSize:'.75rem', fontWeight:600 };
const linkStyle = { display:'inline-block', fontSize:'.7rem', marginTop:'.5rem', color:'#69be3c', textDecoration:'none', fontWeight:600 };
