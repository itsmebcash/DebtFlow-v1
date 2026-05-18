# Android Asset Generation Setup

This directory contains the source images for automated Android asset generation using Capacitor's official asset workflow.

## Quick Start

### 1. Place Your Source Images

- **icon.png** - App icon (1024×1024 px minimum, recommended 1024×1024 px)

  - Should have no transparent areas or be a fully opaque square
  - Will be used to generate all launcher icons and notification icons
  - Format: PNG or JPG

- **splash.png** - Splash screen (1280×1920 px, or 2560×3840 px for better quality)
  - Portrait orientation (taller than wide)
  - Format: PNG (supports transparency)
  - Should include padding for safe area

### 2. Generate Assets

Run the asset generation command:

```bash
npm run assets:generate
```

This command:

- Reads icon.png and splash.png from this folder
- Generates all required Android densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- Creates ic_launcher and ic_launcher_round icons
- Creates splash screens for both portrait and landscape modes
- Places all assets in `android/app/src/main/res/`

### 3. Sync with Android

After generation, sync with Capacitor:

```bash
npm run cap:sync
```

Or sync Android specifically:

```bash
npx cap sync android
```

### 4. Rebuild APK

```bash
npm run android:build
```

Or open in Android Studio:

```bash
npx cap open android
```

## Recommended Image Specifications

### Icon (icon.png)

| Property   | Specification                         |
| ---------- | ------------------------------------- |
| Size       | 1024 × 1024 px (minimum)              |
| Format     | PNG or JPG                            |
| Background | Opaque (no transparency needed)       |
| Safe Area  | Keep important elements in center 40% |
| Corners    | Can be rounded or square              |
| File Size  | < 5 MB                                |

**Best Practices:**

- Use solid background color (matches app theme)
- Ensure good contrast with background
- Test at multiple sizes (visible as 48×48 to 192×192 depending on density)
- Consider adding padding around the main logo (10-20% of image size)

### Splash Screen (splash.png)

| Property    | Specification                                             |
| ----------- | --------------------------------------------------------- |
| Size        | 1280 × 1920 px (recommended) or 2560 × 3840 px (high-res) |
| Format      | PNG (supports transparency)                               |
| Orientation | Portrait (1:1.5 aspect ratio)                             |
| File Size   | < 10 MB                                                   |

**Density Guide:**

- ldpi: 320×426 px
- mdpi: 320×426 px
- hdpi: 480×640 px
- xhdpi: 720×960 px
- xxhdpi: 1080×1440 px
- xxxhdpi: 1440×1920 px

**Safe Areas (avoid placing critical content):**

- Top 80 px (status bar)
- Bottom 80 px (navigation bar on some devices)
- Sides: 40 px padding
- Use center 60% for important content

## Generated Files Structure

After running `npm run assets:generate`, your Android resources will be organized as:

```
android/app/src/main/res/
├── mipmap-ldpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-mdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-hdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xhdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xxhdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-anydpi-v26/
│   ├── ic_launcher.xml
│   └── ic_launcher_round.xml
├── drawable/ (splash screen base)
│   └── splash.png
├── drawable-land-ldpi/
│   └── splash.png
├── drawable-land-mdpi/
│   └── splash.png
├── drawable-land-hdpi/
│   └── splash.png
├── drawable-land-xhdpi/
│   └── splash.png
├── drawable-land-xxhdpi/
│   └── splash.png
├── drawable-land-xxxhdpi/
│   └── splash.png
├── drawable-port-ldpi/
│   └── splash.png
├── drawable-port-mdpi/
│   └── splash.png
├── drawable-port-hdpi/
│   └── splash.png
├── drawable-port-xhdpi/
│   └── splash.png
├── drawable-port-xxhdpi/
│   └── splash.png
├── drawable-port-xxxhdpi/
│   └── splash.png
└── ... (night mode variants for dark theme support)
```

## Available npm Scripts

### Asset Generation

```bash
# Generate Android assets from resources/icon.png and resources/splash.png
npm run assets:generate

# Clean old Android assets and regenerate
npm run assets:clean
```

### Android Build & Sync

```bash
# Sync and generate APK
npm run cap:sync

# Build release APK
npm run android:build

# Build debug APK
npm run android:build:debug

# Open in Android Studio
npx cap open android
```

### Utility Commands

```bash
# Clean only (no regeneration)
npm run assets:clean

# Full clean and rebuild cycle
npm run assets:full-rebuild
```

## Troubleshooting

### Common Issues & Solutions

#### 1. "Icon must be at least 512x512"

**Problem:** Asset generation fails with image size error

**Solution:**

- Ensure icon.png is at least 1024×1024 px
- Check file exists at `resources/icon.png`
- Verify file format is PNG or JPG (not WebP)

#### 2. Android Studio shows "Unresolved Resource" errors

**Problem:** Generated assets show as unresolved in IDE

**Solution:**

```bash
# Clean Android build cache
cd android && ./gradlew clean
cd ..
npm run cap:sync
```

#### 3. Splash screen appears stretched or distorted

**Problem:** Splash screen doesn't fit screen properly

**Solution:**

- Ensure source splash.png is exactly 1280×1920 px or 2560×3840 px
- Verify portrait orientation (height > width)
- Check aspect ratio is 2:3

#### 4. APK fails to build after asset generation

**Problem:** Gradle build error after generating assets

**Solution:**

```bash
# Clean all generated Android resources
npm run assets:clean
# Regenerate
npm run assets:generate
# Clear gradle cache
cd android && ./gradlew clean
cd ..
# Sync again
npm run cap:sync
```

#### 5. Files don't appear in Android Studio after sync

**Problem:** Generated assets not visible in Android project

**Solution:**

- Close Android Studio completely
- Delete `android/.gradle` folder
- Delete `android/build` folder
- Run: `npm run cap:sync`
- Reopen Android Studio

### Verifying Assets

After generation, verify assets exist:

```bash
# Check launcher icons
ls -la android/app/src/main/res/mipmap-*/ic_launcher*.png

# Check splash screens
ls -la android/app/src/main/res/drawable*/splash.png

# Should show files for all densities:
# ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
```

## Android Density Chart

| Density | DPI | Icon Size | Splash Size |
| ------- | --- | --------- | ----------- |
| ldpi    | 120 | 36×36     | 320×426     |
| mdpi    | 160 | 48×48     | 320×426     |
| hdpi    | 240 | 72×72     | 480×640     |
| xhdpi   | 320 | 96×96     | 720×960     |
| xxhdpi  | 480 | 144×144   | 1080×1440   |
| xxxhdpi | 640 | 192×192   | 1440×1920   |

### When to Use Each Density

- **ldpi**: Rarely used, legacy support (pre-2010 devices)
- **mdpi**: Baseline density (3"-4" screens)
- **hdpi**: Medium devices (4"-5" screens)
- **xhdpi**: High density devices (5"-7" phones, 7" tablets)
- **xxhdpi**: Very high density (5.5"-6" phones)
- **xxxhdpi**: Ultra high density (6"+ phones, high-res tablets)

## Night Mode / Dark Theme

Generated splash screens include night mode variants:

- `drawable-night/splash.png`
- `drawable-night-port-*/splash.png`
- `drawable-night-land-*/splash.png`

To customize night mode splash screens:

- Create `splash-night.png` variant if needed
- Or manually edit `drawable-night/` files after generation

## Capacitor Assets CLI Options

Additional options you can use:

```bash
# Generate only Android assets
npx @capacitor/assets generate --android

# Generate only iOS assets (if using iOS platform)
npx @capacitor/assets generate --ios

# Generate all platforms
npx @capacitor/assets generate

# Force overwrite existing assets
npx @capacitor/assets generate --android --force

# Specify source directory
npx @capacitor/assets generate --android --resourcesDir=resources

# Use custom image paths
npx @capacitor/assets generate --android --icon=custom-icon.png --splash=custom-splash.png
```

## Workflow Summary

### Initial Setup (one-time)

1. Create 1024×1024 icon.png → `resources/icon.png`
2. Create 1280×1920 splash.png → `resources/splash.png`
3. Run `npm run assets:generate`
4. Run `npm run cap:sync`
5. Run `npm run android:build`
6. Test APK

### Update Assets (iterate)

1. Edit `resources/icon.png` and/or `resources/splash.png`
2. Run `npm run assets:generate`
3. Run `npm run cap:sync`
4. Run `npm run android:build`

### Clean Workflow (if stuck)

```bash
npm run assets:full-rebuild
```

## Best Practices for Solo Developer

1. **Version Control**

   - ✅ Commit `resources/icon.png` and `resources/splash.png`
   - ❌ Don't commit generated files in `android/app/src/main/res/`
   - Add to `.gitignore`:
     ```
     android/app/src/main/res/drawable*/
     android/app/src/main/res/mipmap*/
     android/app/src/main/res/mipmap-anydpi-v26/
     ```

2. **Image Editing**

   - Use: Figma, Adobe XD, or local tools (GIMP, Krita, Photoshop)
   - Keep source files (.psd, .figma) in version control
   - Export as PNG with appropriate dimensions
   - Always verify dimensions before running generation

3. **Regular Maintenance**

   - Re-generate after major app updates
   - Test on multiple device sizes before release
   - Review density-specific rendering at each size
   - Keep backup of original icon/splash files

4. **Testing Assets**
   - Test on real devices: ldpi (old phone), mdpi, xhdpi, xxhdpi
   - Or use Android emulator with different device profiles
   - Verify splash screen appears during app startup
   - Check icon appearance in app drawer and home screen

## References

- [Capacitor Assets Documentation](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
- [Android Icon Design Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_status_bar)
- [Android Density Guide](https://developer.android.com/training/multiscreen/screendensities)
- [Adaptive Icons (Android 8.0+)](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)

## Next Steps

1. Create or export your icon.png (1024×1024) → `resources/icon.png`
2. Create or export your splash.png (1280×1920) → `resources/splash.png`
3. Run: `npm run assets:generate`
4. Run: `npm run cap:sync`
5. Build and test!
