# Android Build and Deployment Guide

## Building APK

### Quick Build (Debug)

Development build for testing:

```bash
npm run android:build:debug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build

For distribution on Google Play:

```bash
npm run android:build
```

Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

**Note:** Release builds require signing before distribution.

### Full Workflow

```bash
# 1. Regenerate assets (if images changed)
npm run assets:full-rebuild

# 2. Sync with Capacitor
npm run cap:sync

# 3. Build APK
npm run android:build:debug

# 4. Install on connected device
npm run android:install:debug
```

## Locating Generated APK

After building, APK files are in:

```
android/app/build/outputs/apk/
├── debug/
│   └── app-debug.apk              (use for testing)
└── release/
    └── app-release-unsigned.apk   (requires signing)
```

Check file size:

```bash
ls -lh android/app/build/outputs/apk/*/app*.apk
```

## Installing APK on Device

### Via Gradle

```bash
npm run android:install:debug
```

Requires:

- Device connected via USB
- USB debugging enabled
- One device connected

### Via adb (manual)

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Or reinstall (overwrite):

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Via Android Studio

1. Open: `npx cap open android`
2. Click "Run" (Play button)
3. Select connected device or emulator
4. Android Studio builds and installs automatically

## Build Troubleshooting

### Build fails after asset regeneration

```bash
# Clean build cache and regenerate
npm run android:clean
npm run assets:full-rebuild
npm run cap:sync
npm run android:build:debug
```

### "Unresolved resource" errors in Android Studio

1. Close Android Studio
2. Delete `android/.gradle` and `android/app/build` folders
3. Run: `npm run cap:sync`
4. Reopen Android Studio
5. Let Gradle resync (should take 1-2 minutes)

### APK installation fails

```bash
# Uninstall existing app
adb uninstall com.debtflow.app

# Clean and rebuild
npm run android:clean
npm run android:build:debug

# Reinstall
npm run android:install:debug
```

### Build hangs or times out

```bash
# Cancel current build (Ctrl+C)

# Clean everything
npm run android:clean

# Full rebuild
npm run assets:full-rebuild
npm run cap:sync
npm run android:build:debug
```

## Verifying APK Contents

Check what's inside your APK:

```bash
# List contents
unzip -l android/app/build/outputs/apk/debug/app-debug.apk | grep drawable

# Extract specific files
unzip android/app/build/outputs/apk/debug/app-debug.apk "res/drawable*/splash*" -d extracted/
```

Verify icons and splash screens are included:

```bash
unzip -t android/app/build/outputs/apk/debug/app-debug.apk | grep -E "(ic_launcher|splash)" | head -20
```

## Pre-Release Checklist

Before publishing on Google Play:

- [ ] Test app on minimum supported API level (check `android/app/build.gradle`)
- [ ] Test app on latest Android version
- [ ] Verify icon appears correctly in app drawer
- [ ] Verify splash screen during startup
- [ ] Test on devices: phone 5-6", 7" tablet, 6.5"+ large phone
- [ ] Check landscape orientation splash screen
- [ ] Review app size (check with: `ls -lh app-debug.apk`)
- [ ] Test all Android permissions (if applicable)
- [ ] Verify app version matches `capacitor.config.ts`

## Release APK Signing

To release on Google Play, you must sign your APK. See Google Play documentation for:

1. Creating keystore
2. Signing with jarsigner
3. Configuring signing in gradle

Basic process:

```bash
# Create keystore (one-time)
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Configure in android/app/build.gradle, then build:
npm run android:build
```

## Emulator Testing

Test on Android emulator before real device:

```bash
# In Android Studio, create or select emulator, then:
npm run android:build:debug
npm run android:install:debug
```

Popular emulator configs to test:

- Pixel 5 (xhdpi, Android 12)
- Pixel 6 Pro (xxhdpi, Android 13)
- Pixel 7 (xxhdpi, Android 14)
- Tablet (Pixel Fold or similar)

## Gradle Commands

Useful gradle commands (run from `android/` folder):

```bash
cd android

# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Build and install debug
./gradlew installDebug

# Run connected device tests
./gradlew connectedAndroidTest

# Show gradle version
./gradlew --version

# See all available tasks
./gradlew tasks
```

Or use npm shortcuts:

```bash
npm run android:clean
npm run android:build:debug
npm run android:build
npm run android:install:debug
```
