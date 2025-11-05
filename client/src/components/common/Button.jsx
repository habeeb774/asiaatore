// Unified wrapper around canonical UI Button with variant/size mapping to keep old API compatible.
import React from 'react';
import { Button as UIButton, ButtonLink as UIButtonLink, buttonVariants as uiButtonVariants } from '../ui/Button.jsx';

function mapVariant(variant) {
  switch (variant) {
    case 'default':
      return { ui: 'primary', extra: '' };
    case 'secondary':
      return { ui: 'secondary', extra: '' };
    case 'ghost':
      return { ui: 'ghost', extra: '' };
    case 'outline':
      // now supported natively in UI
      return { ui: 'outline', extra: '' };
    case 'link':
      // render like a link (transparent background, underline on hover)
      return { ui: 'ghost', extra: 'bg-transparent text-primary underline-offset-4 hover:underline hover:bg-transparent px-0' };
    case 'destructive':
    case 'danger':
      // map to native danger variant in UI
      return { ui: 'danger', extra: '' };
    default:
      return { ui: 'primary', extra: '' };
  }
}

function mapSize(size) {
  switch (size) {
    case 'sm': return { ui: 'sm', extra: '' };
    case 'lg': return { ui: 'lg', extra: '' };
    case 'icon': return { ui: 'md', extra: 'h-10 w-10 p-0 aspect-square' };
    case 'default':
    default: return { ui: 'md', extra: '' };
  }
}

const Button = React.forwardRef(function CommonButton({ className = '', variant = 'default', size = 'default', ...props }, ref) {
  const v = mapVariant(variant);
  const s = mapSize(size);
  const cls = [v.extra, s.extra, className].filter(Boolean).join(' ');
  return <UIButton ref={ref} variant={v.ui} size={s.ui} className={cls} {...props} />;
});

// Compatibility function mirroring the old signature
function buttonVariants({ variant = 'default', size = 'default', className = '' } = {}) {
  const v = mapVariant(variant);
  const s = mapSize(size);
  const base = uiButtonVariants({ variant: v.ui, size: s.ui, className });
  return [base, v.extra, s.extra].filter(Boolean).join(' ');
}

// Link-styled wrapper for compatibility
const ButtonLink = React.forwardRef(function CommonButtonLink({ href, variant = 'default', size = 'default', className = '', children, ...rest }, ref) {
  const v = mapVariant(variant);
  const s = mapSize(size);
  const cls = [v.extra, s.extra, className].filter(Boolean).join(' ');
  return (
    <UIButtonLink ref={ref} href={href} variant={v.ui} size={s.ui} className={cls} {...rest}>
      {children}
    </UIButtonLink>
  );
});

Button.displayName = 'Button';
ButtonLink.displayName = 'ButtonLink';

export { Button, buttonVariants, ButtonLink };
