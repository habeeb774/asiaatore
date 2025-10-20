declare module 'expo-image-picker' {
  export const MediaTypeOptions: { Images: string; Videos: string; All: string };
  export function requestMediaLibraryPermissionsAsync(): Promise<{ status: 'granted' | string }>;
  export function requestCameraPermissionsAsync(): Promise<{ status: 'granted' | string }>;
  export function launchImageLibraryAsync(opts?: any): Promise<{ canceled: boolean; assets?: { uri: string }[] }>;
  export function launchCameraAsync(opts?: any): Promise<{ canceled: boolean; assets?: { uri: string }[] }>;
}
