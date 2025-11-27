import React from 'react';
import clsx from 'clsx';

export default function ButtonGroup({ segmented = false, block = false, className, style, children, ...rest }) {
  const cls = clsx('ui-btn-group', segmented && 'ui-btn-group--segmented', block && 'ui-btn-group--block', className);
  return (
    <div className={cls} style={style} {...rest}>
      {children}
    </div>
  );
}
