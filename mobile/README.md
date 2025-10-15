# My Store Mobile (Expo)

Minimal mobile client for the My Store backend with Expo + React Native + TanStack Query.

## Features
- Home list of products
- Product details
- Login (stores JWT in localStorage for simplicity in dev)
- Orders list for the current user

## Prerequisites
- Node 18+
- Expo CLI (npx expo) and device/emulator
- Backend API running locally (defaults to https://asiaatore-production.up.railway.app)

## Quick Start
```powershell
cd mobile
npm install
# Set API base if needed (Metro dev client needs LAN IP):
# $env:EXPO_PUBLIC_API_BASE="http://YOUR_LAN_IP:4000/api"
npm start
```
Then press:
- a for Android
- i for iOS (on macOS)
- w for web

If using a physical device, set EXPO_PUBLIC_API_BASE to your machine LAN IP.

## Notes
- This is a minimal starter to get you productive; expand screens and types as needed.
- React Query cache settings mirror the web app defaults.

## Build Android APK (for testing)

Option A: Cloud build with EAS (recommended)

```powershell
cd mobile
npx expo login   # if not logged in
npx expo install expo-dev-client # optional for dev builds
npm run build:apk
```

This uses `eas.json` profile `preview` (APK). When done, EAS prints a download URL for the .apk.

To point the app at your backend, set EXPO_PUBLIC_API_BASE in the build profile or use runtime config. The default `preview` profile sets `http://10.0.2.2:4000/api` for emulator; for a real device build, override it:

```powershell
eas build -p android --profile preview --local --non-interactive --env EXPO_PUBLIC_API_BASE="http://YOUR_LAN_IP:4000/api"
```

Option B: Local build (requires Android SDK & JDK)

```powershell
cd mobile
$env:EXPO_PUBLIC_API_BASE="http://10.0.2.2:4000/api"
npx expo run:android --variant release
```

This generates and installs a release APK on the connected emulator/device. For a standalone APK artifact, use EAS or Gradle outputs under `android/app/build/outputs/apk/release/`.
