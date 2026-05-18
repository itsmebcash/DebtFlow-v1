#!/usr/bin/env node

/**
 * Full Asset Rebuild Script
 *
 * Complete workflow for regenerating all Android assets.
 * This script:
 * 1. Cleans old generated assets
 * 2. Generates new assets
 * 3. Verifies generation was successful
 * 4. Reports summary
 *
 * Usage: npm run assets:full-rebuild
 * Or: node scripts/full-rebuild.js
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function runCommand(cmd, description) {
  log(`\n▶ ${description}...`, "blue");
  try {
    execSync(cmd, { stdio: "inherit" });
    log(`✓ ${description} completed`, "green");
    return true;
  } catch (error) {
    log(`✗ ${description} failed`, "red");
    return false;
  }
}

log("\n╔════════════════════════════════════════╗", "blue");
log("║    Android Asset Full Rebuild Setup    ║", "blue");
log("╚════════════════════════════════════════╝", "blue");

// Step 1: Verify source images exist
log("\n📋 Step 1: Verifying source images...", "blue");
const iconPath = path.join(__dirname, "../resources/icon.png");
const splashPath = path.join(__dirname, "../resources/splash.png");

let sourcesOk = true;
if (!fs.existsSync(iconPath)) {
  log("✗ Missing: resources/icon.png", "red");
  log("  → Create 1024×1024px icon and save as resources/icon.png", "yellow");
  sourcesOk = false;
} else {
  const stat = fs.statSync(iconPath);
  log(`✓ icon.png found (${(stat.size / 1024).toFixed(2)} KB)`, "green");
}

if (!fs.existsSync(splashPath)) {
  log("✗ Missing: resources/splash.png", "red");
  log(
    "  → Create 1280×1920px splash and save as resources/splash.png",
    "yellow",
  );
  sourcesOk = false;
} else {
  const stat = fs.statSync(splashPath);
  log(`✓ splash.png found (${(stat.size / 1024).toFixed(2)} KB)`, "green");
}

if (!sourcesOk) {
  log("\n❌ Source images missing. Aborting rebuild.", "red");
  log("\nTo fix:");
  log("  1. Create resources/icon.png (1024×1024px)");
  log("  2. Create resources/splash.png (1280×1920px)");
  log("  3. Run: npm run assets:full-rebuild\n", "yellow");
  process.exit(1);
}

// Step 2: Clean
if (!runCommand("node scripts/clean-assets.js", "Cleaning old assets")) {
  process.exit(1);
}

// Step 3: Generate
if (!runCommand("npm run assets:generate", "Generating new assets")) {
  log("\n⚠️  Asset generation reported issues. Check source images.", "yellow");
}

// Step 4: Verify
if (
  !runCommand("node scripts/verify-assets.js", "Verifying generated assets")
) {
  log("\n⚠️  Some assets may not have been generated correctly.", "yellow");
  process.exit(1);
}

// Success
log("\n╔════════════════════════════════════════╗", "green");
log("║    ✓ Rebuild Complete!                 ║", "green");
log("╚════════════════════════════════════════╝", "green");
log("\nNext steps:", "blue");
log("  1. Run: npm run cap:sync");
log("  2. Run: npm run android:build");
log("  3. Test APK on device\n");
