import React from 'react';
import clsx from 'clsx';

// Simple Chip/Pill component used in filters and tags
// Props: variant: 'default'|'success'|'warning'|'danger'|'outline'
export function Chip({ className = '', variant = 'default', children, ...props }) {
	const variants = {
		default: 'bg-gray-100 text-gray-800',
		success: 'bg-green-100 text-green-800',
		warning: 'bg-amber-100 text-amber-800',
		danger: 'bg-red-100 text-red-800',
		outline: 'border border-gray-300 text-gray-700'
	};
	return (
		<span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', variants[variant] || variants.default, className)} {...props}>
			{children}
		</span>
	);
}

export default Chip;
