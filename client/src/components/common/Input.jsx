import React from 'react';
import { Input as BaseInput } from '../ui/input.jsx';

// Unified Input: compose the canonical UI Input with optional label and right-side icon.
// This preserves existing API while standardizing base styles via components/ui/input.
const Input = React.forwardRef(function CommonInput({ className, type, icon, label, ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">{icon}</div>}
        <BaseInput ref={ref} type={type} className={icon ? `pr-10 ${className||''}` : className} {...props} />
      </div>
    </div>
  );
});
Input.displayName = 'Input';

export { Input };
