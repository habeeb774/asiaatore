import React from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({ className, type, icon, label, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">{icon}</div>}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pr-10' : '',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    </div>
  );
});
Input.displayName = 'Input';

export { Input };
