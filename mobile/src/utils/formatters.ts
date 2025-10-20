export const formatCurrency = (
	amount: number | string | null | undefined,
	options: Intl.NumberFormatOptions & { locale?: string; currency?: string } = {}
) => {
	const { locale = 'ar-SA', currency = 'SAR', ...intl } = options;
	const value = Number(amount ?? 0);
	if (!Number.isFinite(value)) {
		return '—';
	}
	return value.toLocaleString(locale, {
		style: 'currency',
		currency,
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		...intl
	});
};

export const formatDateTime = (
	value: Date | string | number,
	locale = 'ar-SA',
	options: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short', hour12: false }
) => new Date(value).toLocaleString(locale, options);