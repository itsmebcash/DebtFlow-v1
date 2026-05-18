# Android Asset Setup - Complete Checklist

Use this checklist to verify your complete Android asset setup.

## Pre-Setup Checklist

### Project Requirements

- [ ] Capacitor v4.8+ installed (`npm list @capacitor/android`)
- [ ] @capacitor/assets v3.0+ installed (`npm list @capacitor/assets`)
- [ ] Android project initialized (`android/` folder exists)
- [ ] Capacitor config set up (`capacitor.config.ts` exists)

### Verify Current State

```bash
# Check Capacitor version
npm list @capacitor/cli @capacitor/android @capacitor/assets

# Should show v4.8.2+ and @capacitor/assets v3.0.5+
```

## Setup Process Checklist

### Step 1: Prepare Source Images

- [ ] Create `icon.png` (1024×1024 px, PNG/JPG)
- [ ] Create `splash.png` (1280×1920 px, PNG)
- [ ] Save to `resources/icon.png`
- [ ] Save to `resources/splash.png`
- [ ] Verify file sizes reasonable (< 5MB each)

### Step 2: Generate Assets

- [ ] Run: `npm run assets:full-rebuild`
- [ ] Check output for "✅ Rebuild Complete!" message
- [ ] Run: `npm run assets:verify`
- [ ] Confirm output shows all assets present

### Step 3: Sync with Capacitor

- [ ] Run: `npm run cap:sync`
- [ ] Check output for successful sync
- [ ] Verify no "Unresolved resource" errors

### Step 4: Build Android

- [ ] Run: `npm run android:build:debug`
- [ ] Build should complete without errors
- [ ] Check APK created: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 5: Install and Test

- [ ] Connect Android device (USB debugging enabled)
- [ ] Run: `npm run android:install:debug`
- [ ] App installs successfully
- [ ] App launches without crashes
- [ ] Icon visible in app drawer
- [ ] Splash screen appears at startup
- [ ] App functions normally

## File Structure Verification

### Resources Folder

```bash
# Verify resources folder exists and has guide files
ls -la resources/

# Should show:
# icon.png (your source icon)
# splash.png (your source splash)
# README.md (setup guide)
# QUICK_START.md (quick reference)
# ANDROID_BUILD.md (build guide)
# TROUBLESHOOTING.md (troubleshooting)
# GIT_IGNORE.md (git setup)
# RESOURCE_STRUCTURE.md (detailed structure)
```

### Scripts Folder

```bash
# Verify helper scripts exist
ls -la scripts/

# Should show:
# clean-assets.js
# verify-assets.js
# full-rebuild.js
```

### Generated Assets

```bash
# Verify icons generated for all densities
for density in ldpi mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  echo -n "Checking mipmap-$density: "
  ls android/app/src/main/res/mipmap-$density/ic_launcher*.png 2>/dev/null | wc -l
done

# Should output 2 files per density (ic_launcher + ic_launcher_round)
```

### Splash Screens

```bash
# Count splash screens
find android/app/src/main/res/drawable* -name "splash.png" | wc -l

# Should output: 40+ (includes port, land, night variants)
```

## npm Scripts Verification

### Check All Scripts Added

```bash
npm run --list 2>/dev/null | grep -E "assets:|android:|cap:"

# Should show:
# assets:clean
# assets:generate
# assets:full-rebuild
# assets:verify
# android:build
# android:build:debug
# android:install:debug
# android:clean
# android:open
# cap:sync
# cap:open:android
```

Or check directly in package.json:

```bash
grep -E '"(assets:|android:|cap:)' package.json

# Should show all commands above
```

## Git Setup Verification

### Check .gitignore

```bash
# Verify generated assets are ignored
grep -A 5 "Android Generated Assets" .gitignore

# Should show patterns like:
# android/app/src/main/res/mipmap-*/
# android/app/build/
```

If not present, add:

```bash
cat resources/GIT_IGNORE.md >> .gitignore
```

### Verify What Will Be Committed

```bash
# Check what git will track
git status

# Should show:
# ✓ resources/icon.png
# ✓ resources/splash.png
# ✓ resources/ (all docs)
# ✓ scripts/ (all scripts)
# ✓ package.json (updated)
# ✗ android/app/build/ (ignored)
# ✗ android/app/src/main/res/mipmap-*/ (ignored)
```

## Android Studio Verification

### Open in Android Studio

```bash
npx cap open android
```

### Check for Errors

- [ ] No "Unresolved resource" errors in editor
- [ ] No red underlines on ic_launcher references
- [ ] No red underlines on splash references
- [ ] Project syncs without errors (Gradle → Sync Now)

### Verify Resources Visible

1. Open: Project view (left panel)
2. Navigate: `app` → `src` → `main` → `res`
3. Should see all mipmap-_ and drawable-_ folders populated
4. Expand `mipmap-mdpi/` → should see ic_launcher.png and ic_launcher_round.png
5. Expand `drawable-port-hdpi/` → should see splash.png

## APK Verification

### Build and Check Contents

```bash
npm run android:build:debug

# Verify APK has assets
unzip -t android/app/build/outputs/apk/debug/app-debug.apk | grep -E "(ic_launcher|splash)" | head -20

# Should show 20+ files listed
```

### Installation Test

```bash
# Install on device
npm run android:install:debug

# Verify successful
# Should see: "Success" or "cmd: Can be debugged: true"
```

## Functionality Verification

### On Running Device

1. **Icon in drawer**

   - [ ] Open app drawer
   - [ ] Find your app icon (DebtFlow)
   - [ ] Icon should be sharp and properly colored
   - [ ] Compare to other apps - should look professional

2. **Splash screen**

   - [ ] Kill app (long-press → close)
   - [ ] Tap app icon to open
   - [ ] Splash screen appears for 1-3 seconds
   - [ ] Splash screen should fit screen properly (not stretched)
   - [ ] No white borders or strange scaling

3. **App functionality**

   - [ ] App launches successfully
   - [ ] No crashes or errors
   - [ ] All buttons and navigation work
   - [ ] Test on both portrait and landscape

4. **Multiple devices (if available)**
   - [ ] Test on phone with 5" screen
   - [ ] Test on phone with 6.5" screen
   - [ ] Test on tablet (7"+) if available
   - [ ] Icon and splash should look good at all sizes

## Troubleshooting Checklist

### If Assets Don't Generate

- [ ] Check files: `ls resources/icon.png resources/splash.png`
- [ ] Check dimensions: `file resources/icon.png`
- [ ] Icon should be ≥1024×1024
- [ ] Splash should be 1280×1920 or 2560×3840
- [ ] Try: `npm run assets:generate` directly
- [ ] Check output for error message
- [ ] If error, see: `resources/TROUBLESHOOTING.md`

### If Build Fails

- [ ] Run: `npm run android:clean`
- [ ] Run: `npm run cap:sync`
- [ ] Try: `npm run android:build:debug`
- [ ] If still fails, run full rebuild:
  ```bash
  npm run assets:full-rebuild
  npm run cap:sync
  npm run android:build:debug
  ```

### If App Crashes

- [ ] Check logcat: `adb logcat | grep DebtFlow`
- [ ] Verify no errors in `adb logcat`
- [ ] Check Android Studio for build errors
- [ ] Verify app launches without assets: Temporarily remove resources and retry
- [ ] If works without resources, asset generation issue

### If Android Studio Shows Errors

- [ ] Close Android Studio
- [ ] Delete `android/.gradle` and `android/app/build`
- [ ] Run: `npm run cap:sync`
- [ ] Reopen Android Studio
- [ ] Let Gradle sync (1-2 min)
- [ ] Errors should clear

## Performance Checklist

### APK Size

```bash
ls -lh android/app/build/outputs/apk/debug/app-debug.apk

# Typical sizes:
# Small app: 10-30 MB (including assets ~2-4 MB)
# Medium app: 30-50 MB
# Large app: 50+ MB
```

### Build Time

```bash
time npm run android:build:debug

# First build: 30-60 seconds (normal)
# Incremental builds: 10-20 seconds
# If much slower, likely gradle cache issue
```

## Documentation Verification

### Ensure All Guides Present

```bash
ls -1 resources/

# Should show:
# ANDROID_BUILD.md
# GIT_IGNORE.md
# QUICK_START.md
# README.md
# RESOURCE_STRUCTURE.md
# TROUBLESHOOTING.md
```

### Read Documentation

- [ ] Read: `resources/QUICK_START.md` (quick reference)
- [ ] Read: `resources/README.md` (complete setup)
- [ ] Bookmark: `resources/TROUBLESHOOTING.md` (for later issues)
- [ ] Reference: `resources/RESOURCE_STRUCTURE.md` (understand structure)
- [ ] Save: `resources/GIT_IGNORE.md` (for git setup)

## Team/Sharing Checklist

### Before Pushing to Git

- [ ] Add .gitignore entries from `resources/GIT_IGNORE.md`
- [ ] Verify generated assets are ignored: `git status`
- [ ] Commit: `resources/` folder (with sources and docs)
- [ ] Commit: `scripts/` folder (helper scripts)
- [ ] Commit: `package.json` (with new npm scripts)
- [ ] Don't commit: `android/app/build/` or `android/.gradle/`
- [ ] Don't commit: Generated PNGs in `android/app/src/main/res/mipmap-*/`

### After Cloning on New Machine

- [ ] Run: `npm install`
- [ ] Run: `npm run assets:generate` (or `npm run assets:full-rebuild`)
- [ ] Run: `npm run cap:sync`
- [ ] Run: `npm run android:build:debug` to verify

## Final Sign-Off

- [ ] All source images placed in `resources/`
- [ ] `npm run assets:full-rebuild` completes successfully
- [ ] `npm run assets:verify` shows all assets present
- [ ] `npm run cap:sync` syncs without errors
- [ ] `npm run android:build:debug` builds successfully
- [ ] APK installs on device without errors
- [ ] App launches and functions correctly
- [ ] Icon appears correctly in app drawer
- [ ] Splash screen appears during startup
- [ ] .gitignore configured for generated assets
- [ ] Documentation read and understood
- [ ] All npm scripts working (`npm run` shows new commands)

### Ready for Development!

Once all checkboxes complete:

```bash
# Your setup is complete. Use these commands:

npm run assets:generate      # When updating images
npm run cap:sync            # Before building
npm run android:build:debug # Build for testing
npm run android:open        # Open in Android Studio
```

## Quick Reference

### For Each Image Update

```bash
npm run assets:full-rebuild    # Update images
npm run cap:sync               # Sync changes
npm run android:build:debug    # Build
npm run android:install:debug  # Install
```

### If Anything Breaks

```bash
npm run assets:full-rebuild
npm run android:clean
npm run cap:sync
npm run android:build:debug
```

### For Release

```bash
npm run assets:generate
npm run cap:sync
npm run android:build          # Release build
# Sign APK and upload to Google Play
```

## Support

If setup doesn't complete:

1. Check: `resources/QUICK_START.md` (1-2 minute overview)
2. Review: `resources/README.md` (detailed setup)
3. Troubleshoot: `resources/TROUBLESHOOTING.md` (common issues)
4. Reference: `resources/RESOURCE_STRUCTURE.md` (understand layout)

## Next Steps

✅ Setup complete! Now:

1. **Customize your app** - edit `src/` components
2. **Update images** - whenever you improve icon/splash
3. **Build frequently** - test on device often
4. **Ship to Play Store** - follow `resources/ANDROID_BUILD.md` release section

Happy coding! 🚀
