# Android Resource Folder Structure Reference

This document explains the Android resource folder organization and what assets go where.

## Complete Res Folder Structure

```
android/app/src/main/res/
│
├── mipmap-ldpi/                          # Low density (120 dpi) - legacy
│   ├── ic_launcher.png              (36×36 px)
│   └── ic_launcher_round.png         (36×36 px)
│
├── mipmap-mdpi/                          # Medium density baseline (160 dpi)
│   ├── ic_launcher.png              (48×48 px)
│   └── ic_launcher_round.png         (48×48 px)
│
├── mipmap-hdpi/                          # High density (240 dpi)
│   ├── ic_launcher.png              (72×72 px)
│   └── ic_launcher_round.png         (72×72 px)
│
├── mipmap-xhdpi/                         # Extra high density (320 dpi)
│   ├── ic_launcher.png              (96×96 px)
│   └── ic_launcher_round.png         (96×96 px)
│
├── mipmap-xxhdpi/                        # Extra extra high density (480 dpi)
│   ├── ic_launcher.png              (144×144 px)
│   └── ic_launcher_round.png         (144×144 px)
│
├── mipmap-xxxhdpi/                       # Ultra high density (640 dpi)
│   ├── ic_launcher.png              (192×192 px)
│   └── ic_launcher_round.png         (192×192 px)
│
├── mipmap-anydpi-v26/                    # Adaptive Icons (Android 8.0+)
│   ├── ic_launcher.xml               (references layers)
│   └── ic_launcher_round.xml         (references layers)
│
├── drawable/                             # Base splash screen
│   ├── splash.png                    (scales to screen)
│   └── ic_launcher_background.xml    (background for adaptive icon)
│
├── drawable-port-ldpi/                   # Portrait splash - low density
│   └── splash.png                    (320×426 px)
│
├── drawable-port-mdpi/                   # Portrait splash - medium density
│   └── splash.png                    (320×426 px)
│
├── drawable-port-hdpi/                   # Portrait splash - high density
│   └── splash.png                    (480×640 px)
│
├── drawable-port-xhdpi/                  # Portrait splash - extra high
│   └── splash.png                    (720×960 px)
│
├── drawable-port-xxhdpi/                 # Portrait splash - extra extra high
│   └── splash.png                    (1080×1440 px)
│
├── drawable-port-xxxhdpi/                # Portrait splash - ultra high
│   └── splash.png                    (1440×1920 px)
│
├── drawable-land-ldpi/                   # Landscape splash - low density
│   └── splash.png                    (426×320 px)
│
├── drawable-land-mdpi/                   # Landscape splash - medium density
│   └── splash.png                    (426×320 px)
│
├── drawable-land-hdpi/                   # Landscape splash - high density
│   └── splash.png                    (640×480 px)
│
├── drawable-land-xhdpi/                  # Landscape splash - extra high
│   └── splash.png                    (960×720 px)
│
├── drawable-land-xxhdpi/                 # Landscape splash - extra extra high
│   └── splash.png                    (1440×1080 px)
│
├── drawable-land-xxxhdpi/                # Landscape splash - ultra high
│   └── splash.png                    (1920×1440 px)
│
├── drawable-night/                       # Night/dark theme base splash
│   └── splash.png                    (scales to screen)
│
├── drawable-night-port-ldpi/             # Night portrait splash - low density
│   └── splash.png
│
├── drawable-night-port-mdpi/             # Night portrait splash - medium
│   └── splash.png
│
├── drawable-night-port-hdpi/             # Night portrait splash - high
│   └── splash.png
│
├── drawable-night-port-xhdpi/            # Night portrait splash - extra high
│   └── splash.png
│
├── drawable-night-port-xxhdpi/           # Night portrait splash - extra extra
│   └── splash.png
│
├── drawable-night-port-xxxhdpi/          # Night portrait splash - ultra high
│   └── splash.png
│
├── drawable-night-land-ldpi/             # Night landscape - low density
│   └── splash.png
│
├── drawable-night-land-mdpi/             # Night landscape - medium
│   └── splash.png
│
├── drawable-night-land-hdpi/             # Night landscape - high
│   └── splash.png
│
├── drawable-night-land-xhdpi/            # Night landscape - extra high
│   └── splash.png
│
├── drawable-night-land-xxhdpi/           # Night landscape - extra extra high
│   └── splash.png
│
├── drawable-night-land-xxxhdpi/          # Night landscape - ultra high
│   └── splash.png
│
├── drawable-v24/                         # Vector drawables (Android 7.0+)
│   └── [vector assets if used]
│
├── layout/                               # Activity layouts
│   ├── activity_main.xml
│   └── [other layouts]
│
├── values/                               # Default resource values
│   ├── colors.xml
│   ├── dimens.xml
│   ├── strings.xml
│   └── styles.xml
│
├── values-night/                         # Night/dark theme values
│   ├── colors.xml
│   └── styles.xml
│
└── xml/                                  # XML configurations
    ├── network_security_config.xml
    └── [other configs]
```

## What Gets Generated vs Manual

### Generated by `npm run assets:generate`

✅ All `mipmap-*` folders and their icons
✅ All `drawable-port-*` and `drawable-land-*` splash screens
✅ All `drawable-night-*` splash screen variants
✅ Adaptive icon XMLs in `mipmap-anydpi-v26/`

### Already Exists / Don't Touch

✅ `drawable/` - base splash (generated overwrites this)
✅ `layout/` - activity layouts
✅ `values/` - strings, colors, dimensions
✅ `xml/` - configuration files
✅ `drawable-v24/` - vector drawables (if used)

## Density Qualifier Rules

Android uses qualifiers to select correct resource:

### When Device is...

| Device Type              | DPI Range | Android Uses |
| ------------------------ | --------- | ------------ |
| Old phone (pre-2010)     | 120 dpi   | ldpi         |
| Normal phone (3"-4")     | 160 dpi   | mdpi         |
| Good phone (4"-5")       | 240 dpi   | hdpi         |
| High-end phone (5"-5.5") | 320 dpi   | xhdpi        |
| Premium phone (5.5"-6")  | 480 dpi   | xxhdpi       |
| Large phone/tablet (6"+) | 640 dpi   | xxxhdpi      |

### Device Resolution Examples

| Device       | Actual DPI | Android Uses | Scale  |
| ------------ | ---------- | ------------ | ------ |
| Pixel 2      | 441 dpi    | xxhdpi       | 2.75x  |
| Pixel 5      | 440 dpi    | xxhdpi       | 2.75x  |
| Pixel 6 Pro  | 512 dpi    | xxxhdpi      | 3.2x   |
| Pixel 7      | 512 dpi    | xxxhdpi      | 3.2x   |
| Galaxy S21   | 421 dpi    | xxhdpi       | 2.625x |
| iPad Pro 11" | 264 dpi    | hdpi+        | ~1.65x |

## Orientation Qualifiers

### Portrait vs Landscape

```
drawable-port-hdpi/splash.png     Height > Width
drawable-land-hdpi/splash.png     Width > Height
```

Android automatically chooses:

- `drawable-port-*` when phone is vertical
- `drawable-land-*` when phone is horizontal
- Falls back to `drawable/` if specific orientation not found

### Night Mode Qualifiers

```
drawable-night/splash.png              Night mode base
drawable-night-port-hdpi/splash.png    Night portrait
drawable-night-land-hdpi/splash.png    Night landscape
```

Android automatically chooses based on system theme:

- Light theme: uses regular `drawable-*`
- Dark theme: uses `drawable-night-*`

## Scaling and Generation

### How Capacitor Generates Assets

1. **Source:** `resources/icon.png` (1024×1024)
2. **Scales to:** Each density size

   - ldpi: 1024 × (120/160) = 768 → scaled to 36×36
   - mdpi: 1024 × (160/160) = 1024 → scaled to 48×48
   - hdpi: 1024 × (240/160) = 1536 → scaled to 72×72
   - etc.

3. **Result:** Each density gets correctly sized version

Same for splash screens:

- Source: `resources/splash.png` (1280×1920 or 2560×3840)
- Scales to each density and orientation

## Asset Naming Conventions

### Launcher Icons

- `ic_launcher.png` - Standard icon
- `ic_launcher_round.png` - Rounded icon (Android 6.0+)
- `ic_launcher_foreground.png` - Foreground layer (adaptive icons)
- `ic_launcher_background.xml` - Background layer (adaptive icons)

### Splash Screens

- `splash.png` - Generic splash (used as fallback)

### Files Capacitor Won't Touch

- `ic_launcher_background.xml` - Pre-existing (preserved)
- Other XML files in `drawable/`
- Anything outside of icon/splash generation scope

## Resource Resolution Algorithm

When Android needs a resource, it searches in this order:

```
Example: Finding ic_launcher.png on Pixel 5 (xxhdpi, portrait)

1. Check: mipmap-xxhdpi/ ✓ Found → Use this
2. If missing: Check mipmap-xhdpi/ (next lower density)
3. If missing: Check mipmap-hdpi/
4. ... continue down to mipmap-ldpi/
5. If all missing: Use mipmap-mdpi/ (fallback baseline)
```

For splash on landscape:

```
Example: Splash on Galaxy Tab (xxhdpi, landscape, day)

1. Check: drawable-land-xxhdpi/ ✓ Found → Use this
2. If missing: Check drawable-land-xhdpi/
3. ... continue to lower densities
4. If missing: Check drawable-land-mdpi/
5. If missing: Check drawable/ (orientation-agnostic)
```

For night theme:

```
Example: Splash on Pixel 5 (xxhdpi, portrait, dark theme)

1. Check: drawable-night-port-xxhdpi/ ✓ Found (dark) → Use this
2. If missing night variant: Check drawable-port-xxhdpi/ (light)
3. ... continue fallback hierarchy
```

## Manual Resource Changes

### Adding Custom Resources

Create new drawable files (don't delete generated):

```
android/app/src/main/res/
├── drawable/
│   ├── splash.png                 (generated, don't edit)
│   ├── ic_notification.png        (add custom notification icon)
│   └── ic_custom_logo.xml         (add custom vector drawable)
└── values/
    └── colors.xml                 (add custom colors)
```

### Editing Generated Files

❌ **Don't manually edit:**

- Generated icon PNGs
- Generated splash PNGs
- Generated XML adaptive icons

Instead:

1. Edit `resources/icon.png` or `resources/splash.png`
2. Run `npm run assets:generate` to regenerate
3. Auto-overwrites all generated files

### Preserving Custom Drawables

Keep custom resources separate:

```
drawable/
├── splash.png              (generated - safe to overwrite)
├── ic_launcher_background.xml  (exists, safe to keep)
├── ic_notification.png     (custom, Capacitor won't touch)
└── ic_custom_shape.xml     (custom, safe to keep)
```

Capacitor only overwrites specific icon/splash files, not all resources.

## File Size Guide

Typical sizes after generation:

| Asset                        | Size Range |
| ---------------------------- | ---------- |
| ic_launcher.png (each)       | 2-5 KB     |
| ic_launcher_round.png (each) | 2-5 KB     |
| splash.png (ldpi/mdpi)       | 15-25 KB   |
| splash.png (hdpi/xhdpi)      | 40-80 KB   |
| splash.png (xxhdpi/xxxhdpi)  | 100-200 KB |
| All assets total             | ~2-4 MB    |

APK typically increases by 1-3 MB due to assets.

## Verifying Assets

Check resources folder has correct structure:

```bash
# Count icons
ls android/app/src/main/res/mipmap-*/ic_launcher.png | wc -l
# Should output: 6

# Count rounds
ls android/app/src/main/res/mipmap-*/ic_launcher_round.png | wc -l
# Should output: 6

# Count splash screens
find android/app/src/main/res/drawable*/splash.png | wc -l
# Should output: 40+ (base + portrait + landscape + night variants)

# Verify specific asset
file android/app/src/main/res/mipmap-mdpi/ic_launcher.png
# Should show: PNG image data, 48 x 48, ...
```
