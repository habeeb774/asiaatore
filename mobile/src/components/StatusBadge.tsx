import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { getStatusMeta, resolveStatusColors } from '../../../shared/statusMeta';

type StatusBadgeProps = {
	status: string | null | undefined;
	style?: StyleProp<ViewStyle>;
	themeColors?: Record<string, unknown>;
};

const StatusBadgeBase: React.FC<StatusBadgeProps> = ({ status, style, themeColors }) => {
	const scheme = useColorScheme();
	const resolvedScheme: 'light' | 'dark' = scheme === 'dark' ? 'dark' : 'light';

	const meta = useMemo(() => getStatusMeta(status ?? ''), [status]);
	const palette = useMemo(
		() => resolveStatusColors(meta, themeColors, resolvedScheme),
		[meta, themeColors, resolvedScheme]
	);
	const accessibilityLabel = useMemo(() => {
		if (meta.accessibilityLabel) {
			return meta.accessibilityLabel;
		}
		return meta.spokenColor
			? `الحالة: ${meta.label} (${meta.spokenColor})`
			: `الحالة: ${meta.label}`;
	}, [meta]);

	return (
		<View
			style={[styles.container, style, { backgroundColor: palette.background }]}
			accessible
			accessibilityRole="text"
			accessibilityLabel={accessibilityLabel}
			importantForAccessibility="yes"
			testID={`status-badge-${meta.key}`}
		>
			<Text
				style={[styles.text, { color: palette.foreground }]}
				allowFontScaling
				maxFontSizeMultiplier={1.4}
				numberOfLines={1}
			>
				{meta.label}
			</Text>
		</View>
	);
};

StatusBadgeBase.displayName = 'StatusBadge';

export default memo(StatusBadgeBase);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 9999,
		marginBottom: 4,
		marginEnd: 4,
		minHeight: 28,
		writingDirection: 'rtl'
	},
	text: {
		fontSize: 13,
		fontWeight: '600',
		lineHeight: 18,
		minHeight: 18,
		letterSpacing: 0.3,
		textAlignVertical: 'center',
		includeFontPadding: false
	}
});