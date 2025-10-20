type ThemeColorMap = Record<string, any>;

const freeze = <T>(value: T): Readonly<T> => Object.freeze(value);

type StatusTone = Readonly<{
	background: string;
	foreground: string;
}>;

type StatusToneSet = Readonly<{
	light: StatusTone;
	dark: StatusTone;
}>;

export type StatusMeta = Readonly<{
	key: string;
	label: string;
	paletteKey: string;
	spokenColor?: string;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	colors: StatusToneSet;
}>;

export const STATUS_META: Readonly<Record<string, StatusMeta>> = Object.freeze({
	pending: freeze({
		key: 'pending',
		label: 'قيد الانتظار',
		paletteKey: 'info',
		spokenColor: 'أزرق',
		accessibilityLabel: 'الحالة: قيد الانتظار (بانتظار الموافقة)',
		colors: freeze({
			light: freeze({ background: '#E0F2FE', foreground: '#1E3A8A' }),
			dark: freeze({ background: '#0F172A', foreground: '#BAE6FD' })
		})
	}),
	accepted: freeze({
		key: 'accepted',
		label: 'تم القبول',
		paletteKey: 'success',
		spokenColor: 'أخضر',
		accessibilityLabel: 'الحالة: تم القبول (الطلب قيد التجهيز)',
		colors: freeze({
			light: freeze({ background: '#DCFCE7', foreground: '#166534' }),
			dark: freeze({ background: '#064E3B', foreground: '#BBF7D0' })
		})
	}),
	assigned: freeze({
		key: 'assigned',
		label: 'قيد التوصيل',
		paletteKey: 'primary',
		spokenColor: 'أزرق داكن',
		accessibilityLabel: 'الحالة: قيد التوصيل',
		colors: freeze({
			light: freeze({ background: '#E0E7FF', foreground: '#312E81' }),
			dark: freeze({ background: '#1E1B4B', foreground: '#C7D2FE' })
		})
	}),
	delivered: freeze({
		key: 'delivered',
		label: 'تم التسليم',
		paletteKey: 'success',
		spokenColor: 'أخضر داكن',
		accessibilityLabel: 'الحالة: تم التسليم بنجاح',
		colors: freeze({
			light: freeze({ background: '#DCFCE7', foreground: '#14532D' }),
			dark: freeze({ background: '#022C22', foreground: '#A7F3D0' })
		})
	}),
	failed: freeze({
		key: 'failed',
		label: 'فشل',
		paletteKey: 'danger',
		spokenColor: 'أحمر',
		accessibilityLabel: 'الحالة: فشل (يتطلب إجراء إضافي)',
		colors: freeze({
			light: freeze({ background: '#FEE2E2', foreground: '#B91C1C' }),
			dark: freeze({ background: '#450A0A', foreground: '#FECACA' })
		})
	}),
	cancelled: freeze({
		key: 'cancelled',
		label: 'أُلغيت',
		paletteKey: 'neutral',
		spokenColor: 'رمادي',
		accessibilityLabel: 'الحالة: أُلغيت',
		colors: freeze({
			light: freeze({ background: '#E5E7EB', foreground: '#374151' }),
			dark: freeze({ background: '#1F2937', foreground: '#E5E7EB' })
		})
	})
});

const DEFAULT_STATUS_KEY: keyof typeof STATUS_META = 'pending';

export const STATUS_KEYS = Object.freeze(Object.keys(STATUS_META));

export const getStatusMeta = (status: string | null | undefined): StatusMeta =>
	STATUS_META[status ?? ''] ?? STATUS_META[DEFAULT_STATUS_KEY];

export const resolveStatusColors = (
	meta: StatusMeta,
	themeColors?: ThemeColorMap,
	scheme: 'light' | 'dark' | string = 'light'
): StatusTone => {
	const toneKey: 'light' | 'dark' = scheme === 'dark' ? 'dark' : 'light';
	const badgeTheme =
		themeColors?.statusBadges?.[meta.key] ??
		themeColors?.statusBadges?.[meta.paletteKey] ??
		themeColors?.[meta.key] ??
		themeColors?.[meta.paletteKey];

	const background =
		badgeTheme?.[toneKey]?.background ??
		badgeTheme?.background ??
		badgeTheme?.badgeBackground ??
		badgeTheme?.surface ??
		meta.colors[toneKey].background;

	const foreground =
		badgeTheme?.[toneKey]?.foreground ??
		badgeTheme?.foreground ??
		badgeTheme?.badgeForeground ??
		badgeTheme?.onSurface ??
		meta.colors[toneKey].foreground;

	return freeze({ background, foreground });
};
