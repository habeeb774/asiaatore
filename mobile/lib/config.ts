// Centralized API base for the mobile app
// Use globalThis to avoid depending on Node types for `process` in RN/Expo TS
import { Platform } from 'react-native';

const env = (globalThis as any)?.process?.env || {};
// Default to 4005 (backend currently increments ports when busy: 4003→4004→4005)
const DEFAULT_BASE = 'http://localhost:4005/api';

function normalizeForEmulator(base: string) {
	// On Android emulator, localhost inside the app points to the emulator itself, not the host.
	if (Platform?.OS === 'android') {
		// Replace localhost or 127.0.0.1 with 10.0.2.2 (host loopback for Android emulator)
		return base
			.replace('http://127.0.0.1', 'http://10.0.2.2')
			.replace('http://localhost', 'http://10.0.2.2');
	}
	return base;
}

export const API_BASE: string = normalizeForEmulator(env.EXPO_PUBLIC_API_BASE || DEFAULT_BASE);

