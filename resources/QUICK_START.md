# Android Asset Setup - Quick Reference

## One-Time Setup

```bash
# 1. Create source images
# - resources/icon.png (1024×1024 px)
# - resources/splash.png (1280×1920 px)

# 2. Generate assets
npm run assets:full-rebuild

# 3. Sync with Android
npm run cap:sync

# 4. Open in Android Studio (optional)
npx cap open android

# 5. Build
npm run android:build:debug

# Done! Install on device
npm run android:install:debug
```

## All npm Commands

### Asset Management

| Command                       | Purpose                                    |
| ----------------------------- | ------------------------------------------ |
| `npm run assets:generate`     | Generate icons & splash from source images |
| `npm run assets:clean`        | Remove old generated assets                |
| `npm run assets:verify`       | Check all assets are present               |
| `npm run assets:full-rebuild` | Clean + generate + verify (recommended)    |

### Capacitor Sync

| Command                    | Purpose                                |
| -------------------------- | -------------------------------------- |
| `npm run cap:sync`         | Build web + sync to Android            |
| `npm run cap:open:android` | Open Android project in Android Studio |

### Android Build

| Command                         | Purpose                       |
| ------------------------------- | ----------------------------- |
| `npm run android:build`         | Build release APK             |
| `npm run android:build:debug`   | Build debug APK (for testing) |
| `npm run android:install:debug` | Install debug APK on device   |
| `npm run android:clean`         | Clean Android build cache     |
| `npm run android:open`          | Open in Android Studio        |

### Other

| Command         | Purpose              |
| --------------- | -------------------- |
| `npm run dev`   | Start dev server     |
| `npm run build` | Build web (for sync) |
| `npm run clean` | Clean dist/          |
| `npm run lint`  | Type check           |

## Workflow: First Time Setup

```bash
# 1. Create images (outside terminal, use design tool)
# → resources/icon.png (1024×1024)
# → resources/splash.png (1280×1920)

# 2. Full setup
npm run assets:full-rebuild

# 3. Sync
npm run cap:sync

# 4. Build
npm run android:build:debug

# 5. Test
npm run android:install:debug

# ✓ Done!
```

## Workflow: Update Images

```bash
# 1. Edit resources/icon.png or resources/splash.png

# 2. Regenerate
npm run assets:full-rebuild

# 3. Sync
npm run cap:sync

# 4. Rebuild
npm run android:build:debug

# 5. Reinstall
npm run android:install:debug
```

## Workflow: When Things Break

```bash
# Try full rebuild first
npm run assets:full-rebuild

# If still broken:
npm run android:clean
npm run cap:sync
npm run android:build:debug

# If still stuck:
rm -rf android/build android/.gradle
npm run cap:sync
npm run android:build:debug
```

## Workflow: Release Build

```bash
# 1. Verify everything works
npm run android:build:debug

# 2. Create release build
npm run android:build

# 3. Find APK at:
# android/app/build/outputs/apk/release/app-release-unsigned.apk

# 4. Sign APK (Google Play requirements)
# See: resources/ANDROID_BUILD.md for signing

# 5. Upload to Google Play
```

## File Structure

```
e:\dfv3\
├── resources/                    # ← Source images go here
│   ├── icon.png                  # 1024×1024 px
│   ├── splash.png                # 1280×1920 px
│   ├── README.md                 # Full setup guide
│   ├── ANDROID_BUILD.md          # Build & deploy guide
│   ├── GIT_IGNORE.md             # Git setup
│   └── TROUBLESHOOTING.md        # Fix errors
│
├── scripts/                      # ← Helper scripts
│   ├── clean-assets.js
│   ├── verify-assets.js
│   └── full-rebuild.js
│
├── android/
│   └── app/src/main/res/         # ← Generated assets here
│       ├── mipmap-mdpi/
│       ├── mipmap-hdpi/
│       ├── mipmap-xhdpi/
│       ├── mipmap-xxhdpi/
│       ├── mipmap-xxxhdpi/
│       ├── drawable-port-*/      (splash portrait)
│       └── drawable-land-*/      (splash landscape)
│
└── package.json                  # Scripts defined here
```

## Source Image Specs

### Icon (icon.png)

- **Size:** 1024×1024 px minimum (recommended: exactly 1024×1024)
- **Format:** PNG or JPG
- **Background:** Opaque (no transparency)
- **Safe area:** Keep logo in center 40%
- **Padding:** 10-20% margin from edge

Generated sizes:

- ldpi: 36×36
- mdpi: 48×48
- hdpi: 72×72
- xhdpi: 96×96
- xxhdpi: 144×144
- xxxhdpi: 192×192

### Splash (splash.png)

- **Size:** 1280×1920 px minimum (recommended: 2560×3840 for high-res)
- **Format:** PNG (supports transparency)
- **Aspect ratio:** 2:3 (portrait, not landscape!)
- **Safe area:** Avoid top/bottom 80px, sides 40px
- **Dimensions:** Height must be > width

Generated densities:

- ldpi: 320×426
- mdpi: 320×426
- hdpi: 480×640
- xhdpi: 720×960
- xxhdpi: 1080×1440
- xxxhdpi: 1440×1920

## Common Mistakes

❌ **Wrong:** Splash is landscape (1920×1280)
✅ **Fix:** Rotate 90° to portrait (1280×1920)

❌ **Wrong:** Icon is 512×512 (too small)
✅ **Fix:** Create 1024×1024 icon

❌ **Wrong:** Assets still say "unresolved" after generation
✅ **Fix:** Run `npm run cap:sync` to sync with Android

❌ **Wrong:** Building without sync
✅ **Fix:** Always run `npm run cap:sync` before `npm run android:build`

❌ **Wrong:** Can't find `node scripts/clean-assets.js`
✅ **Fix:** Run from project root: `npm run assets:clean`

## Testing Checklist

Before release:

- [ ] `npm run assets:verify` shows all assets present
- [ ] `npm run android:build:debug` builds successfully
- [ ] APK installs without errors
- [ ] App icon visible in app drawer
- [ ] Splash screen appears at startup
- [ ] App opens and works normally
- [ ] Test on 2+ device sizes (5", 6.5", 7"+)

## Tips for Solo Dev

1. **Auto-generate:** Run `npm run assets:full-rebuild` whenever you update images
2. **Commit sources:** Commit `resources/icon.png` and `resources/splash.png`, not generated files
3. **Don't commit build output:** Add patterns from `resources/GIT_IGNORE.md` to `.gitignore`
4. **Keep it simple:** Just run `npm run cap:sync` before every Android build
5. **Test early:** Build and install debug APK often to catch issues
6. **Use helpers:** Run `npm run assets:verify` to check everything is set up

## Emergency Commands

```bash
# Everything failing? Start fresh:
npm run android:clean
rm -rf android/build android/.gradle
npm run assets:clean
npm run assets:generate
npm run cap:sync
npm run android:build:debug

# Stuck in Android Studio? Close it and:
rm -rf android/.gradle
npx cap open android
```

## Next Steps

1. Read [resources/README.md](README.md) for detailed setup
2. Place `icon.png` and `splash.png` in `resources/`
3. Run: `npm run assets:full-rebuild`
4. Run: `npm run cap:sync`
5. Build: `npm run android:build:debug`
6. Test: `npm run android:install:debug`

That's it! Questions? Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
