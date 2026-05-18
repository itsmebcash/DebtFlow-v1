# Capacitor Asset Generation - Advanced Troubleshooting

## Setup Verification

### Test Asset Generation

Verify your setup works before troubleshooting:

```bash
# Check that source images exist
ls -la resources/icon.png resources/splash.png

# Check Capacitor assets is installed
npm list @capacitor/assets

# Run generation
npm run assets:generate

# Verify generated files
npm run assets:verify
```

Expected output:

- 12 icon files (6 densities × 2 types: regular + round)
- 13 splash screens (base + 6 portrait + 6 landscape)

## Error Messages & Solutions

### Error: "Icon must be at least 512x512"

**Cause:** Source icon.png is too small or invalid format

**Solutions:**

1. Check image dimensions:

```bash
# macOS/Linux
sips -g pixelWidth -g pixelHeight resources/icon.png

# Windows (PowerShell)
[System.Drawing.Image]::FromFile("resources\icon.png") | select Width, Height
```

2. Recreate icon with exact dimensions:

   - Use 1024 × 1024 px (recommended, no upscaling)
   - Export as PNG or JPG
   - Ensure no transparency needed

3. Verify file integrity:

```bash
file resources/icon.png
# Should show: PNG image data, 1024 x 1024, ...
```

### Error: "Splash must be at least 320x320"

**Cause:** Source splash.png dimensions incorrect

**Solutions:**

1. Verify splash dimensions (should be portrait, 2:3 ratio):

```bash
# Must be at least 1280×1920 (better: 2560×3840)
# Aspect ratio: 2:3 (width:height)
# Wrong: 1920×1280 (landscape) - swap width and height!
```

2. Regenerate splash with correct orientation:

   - Ensure height > width
   - Use 1280×1920 px minimum
   - Recommended: 2560×3840 px (high-res)

3. Verify aspect ratio:

```python
# In Python/Node to check
width, height = 1280, 1920  # Check your image
ratio = width / height
print(f"Aspect ratio: {ratio:.2f}")
# Should be ~0.67 (2:3)
# If ~1.5, you have it backwards (landscape instead of portrait)
```

### Error: "Cannot find icon.png or splash.png"

**Cause:** Files not in resources/ folder or wrong name

**Solutions:**

1. Verify files exist:

```bash
ls -la resources/
# Should show:
#   icon.png
#   splash.png
#   README.md
```

2. Check file names (case-sensitive on macOS/Linux):

   - ✅ Correct: `icon.png`, `splash.png` (lowercase)
   - ❌ Wrong: `Icon.png`, `ICON.png`, `Splash.png`

3. Ensure files are in project root `resources/` folder:
   - ✅ `e:\dfv3\resources\icon.png`
   - ✅ `e:\dfv3\resources\splash.png`
   - ❌ Not in `android/app/res/`
   - ❌ Not in `src/assets/`

### Error: "EACCES: permission denied" (macOS/Linux)

**Cause:** Script files don't have execute permission

**Solution:**

```bash
chmod +x scripts/clean-assets.js
chmod +x scripts/verify-assets.js
chmod +x scripts/full-rebuild.js

npm run assets:verify
```

### Generated assets missing or incomplete

**Cause:** Generation started but didn't complete successfully

**Solutions:**

1. Clean and regenerate:

```bash
npm run assets:full-rebuild
```

2. Manual clean and verify:

```bash
npm run assets:clean
npm run assets:generate
npm run assets:verify
```

3. Check Gradle cache isn't interfering:

```bash
npm run android:clean
npm run cap:sync
npm run assets:generate
npm run assets:verify
```

### "Unresolved resource" in Android Studio

**Cause:** Generated assets not synced or Android Studio cache stale

**Solutions:**

1. **Quick fix:** Invalidate cache and restart

   - Android Studio → File → Invalidate Caches → Invalidate and Restart

2. **Full fix:**

```bash
# Close Android Studio
npm run android:clean
npm run assets:generate
npm run cap:sync

# Delete Android Studio cache
rm -rf android/.gradle
rm -rf android/app/build

# Reopen Android Studio
npx cap open android
```

3. \*\*Rebuild gradle:Gradle → Sync Now (in Android Studio)

### Gradle build fails with "duplicate resource"

**Cause:** Old assets and new assets both present, or merge conflict

**Solution:**

```bash
npm run android:clean
npm run assets:full-rebuild
npm run cap:sync
npm run android:build:debug
```

### Splash screen appears stretched or wrong size

**Cause:** Source image wrong dimensions or aspect ratio

**Solutions:**

1. Verify exact dimensions (must be 2:3 ratio):

   - ✅ 1280 × 1920 px (safe)
   - ✅ 2560 × 3840 px (high-res)
   - ❌ 1920 × 1280 px (landscape - rotate 90°)
   - ❌ 1024 × 1024 px (square - wrong for splash)

2. Regenerate with correct dimensions:

```bash
npm run assets:clean
npm run assets:generate
npm run cap:sync
```

3. Test specific density splash:

```bash
# Check all generated splash sizes
ls -la android/app/src/main/res/drawable-port-*/splash.png | awk '{print $5, $9}'

# Should show sizes like:
# 15234 android/app/src/main/res/drawable-port-ldpi/splash.png
# (sizes vary by density)
```

### Icon appears pixelated or low-quality

**Cause:** Source icon too small (being scaled up)

**Solution:**

- Source icon must be at least 1024 × 1024 px
- Recommended: exactly 1024 × 1024 px (no upscaling)
- If source is smaller, recreate at proper size

### Some densities missing assets

**Cause:** Generation partially failed or overwritten

**Solution:**

```bash
# Check which densities are missing
npm run assets:verify

# Example output shows which are missing, then:
npm run assets:full-rebuild
```

## Verification Commands

### Check All Asset Files

```bash
# List all generated icons
echo "=== Icons ===" && \
find android/app/src/main/res/mipmap-* -name "ic_launcher*.png" | sort

# List all splash screens
echo "=== Splash Screens ===" && \
find android/app/src/main/res/drawable* -name "splash.png" | sort

# Count assets
echo "=== Summary ===" && \
echo "Icons: $(find android/app/src/main/res/mipmap-* -name "ic_launcher*.png" | wc -l)" && \
echo "Splashes: $(find android/app/src/main/res/drawable* -name "splash.png" | wc -l)"
```

### Check File Sizes

```bash
# Compare source to generated
echo "=== Source Files ===" && \
ls -lh resources/icon.png resources/splash.png && \
echo && \
echo "=== Sample Generated Files ===" && \
ls -lh android/app/src/main/res/mipmap-hdpi/ic_launcher.png && \
ls -lh android/app/src/main/res/drawable-port-hdpi/splash.png
```

### Verify APK Contents

```bash
# Check APK has icons and splash
unzip -t android/app/build/outputs/apk/debug/app-debug.apk | grep -E "(ic_launcher|splash)" | head -30

# Expected output: 20-40 files with ic_launcher or splash
```

## Advanced Debugging

### Enable Verbose Output

```bash
# Verbose asset generation
npx @capacitor/assets generate --android --verbose

# Or manually with debug info
DEBUG=capacitor:* npm run assets:generate
```

### Check Capacitor Configuration

Verify `capacitor.config.ts`:

```typescript
// Should have correct appId and webDir
const config: CapacitorConfig = {
  appId: "com.debtflow.app", // Match Android package name
  appName: "DebtFlow", // Match app name
  webDir: "dist", // Where web files go
  // ... other config
};
```

### Manual Asset Generation

If npm scripts fail, try direct command:

```bash
# With all options
npx @capacitor/assets generate \
  --android \
  --resourcesDir resources \
  --icon resources/icon.png \
  --splash resources/splash.png \
  --force

# If on Windows, might need:
npx @capacitor/assets generate --android --force
```

## Clean Slate Recovery

If everything is broken:

```bash
# 1. Clean all caches
npm run android:clean
npm run clean

# 2. Remove node_modules
rm -rf node_modules
npm install

# 3. Remove Capacitor build
rm -rf android/app/build android/build

# 4. Regenerate everything
npm run assets:full-rebuild
npm run cap:sync

# 5. Rebuild
npm run android:build:debug
```

## Testing With Multiple Devices

Verify assets render correctly across densities:

```bash
# Test on different emulator profiles:

# Low density (phone)
adb -e shell getprop ro.sf.lcd_density

# Install on each
npm run android:install:debug

# Verify icon in app drawer - should be sharp at each size
```

## Getting Help

When something fails:

1. Run: `npm run assets:verify` - shows which assets are missing
2. Run: `npm run assets:full-rebuild` - tries full rebuild with diagnostics
3. Check output for specific error messages (copy full error text)
4. Compare your setup to: `resources/README.md`
5. Test source images with: `file resources/icon.png`

## Common Success Indicators

✅ You're ready when:

- `npm run assets:verify` shows all assets present
- Android Studio shows no "Unresolved resource" errors
- APK builds without errors
- App installs and runs
- Icon appears in app drawer
- Splash screen appears during startup
