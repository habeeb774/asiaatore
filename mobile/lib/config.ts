// Centralized API base for the mobile app
// Use globalThis to avoid depending on Node types for `process` in RN/Expo TS
const env = (globalThis as any)?.process?.env || {};
export const API_BASE: string = env.EXPO_PUBLIC_API_BASE || 'http://localhost:4000/api';

