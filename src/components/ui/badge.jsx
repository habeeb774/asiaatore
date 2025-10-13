import React from 'react';

const styles = {
	neutral: 'bg-gray-100 text-gray-800',
	info: 'bg-blue-100 text-blue-800',
	success: 'bg-emerald-100 text-emerald-800',
	warning: 'bg-orange-100 text-orange-800',
	danger: 'bg-red-100 text-red-800',
};

export function Badge({ color, variant, children, className = '' }) {
	const tone = color || variant || 'neutral';
	return (
		<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${styles[tone] || styles.neutral} ${className}`}>
			{children}
		</span>
	);
}

export default Badge;