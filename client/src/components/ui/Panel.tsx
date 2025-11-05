import React from 'react';
import { cn } from '../../lib/utils';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  padded?: boolean;
}

// A glass-like panel used across pages to unify section styling
const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, as = 'div', padded = true, children, ...props }, ref) => {
    const Comp: React.ElementType = as || 'div';
    return (
      <Comp
        ref={ref}
        className={cn(
          'bg-white/90 dark:bg-gray-800/80 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200/60 dark:ring-gray-700',
          padded ? 'p-6' : '',
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Panel.displayName = 'Panel';

export default Panel;
