declare module 'expo-location' {
	// minimal runtime-friendly typings used by this app
	export const Accuracy: {
		Lowest: number;
		Low: number;
		Balanced: number;
		High: number;
		Highest: number;
	} | any;

	export function requestForegroundPermissionsAsync(): Promise<{ status: string }>;
	export function getCurrentPositionAsync(options?: { accuracy?: number } | any): Promise<{
		coords: {
			latitude: number;
			longitude: number;
			accuracy?: number | null;
			heading?: number | null;
			speed?: number | null;
		};
		timestamp?: number;
	}>;
	export default {
		Accuracy,
		requestForegroundPermissionsAsync,
		getCurrentPositionAsync,
	};
}
