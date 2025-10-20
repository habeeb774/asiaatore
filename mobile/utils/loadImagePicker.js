export async function loadImagePicker() {
  // dynamic import in a plain JS file — avoids TS compiler module restrictions
  try {
    const mod = await import('expo-image-picker');
    return mod;
  } catch (err) {
    return null;
  }
}
