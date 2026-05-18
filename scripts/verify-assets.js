#!/usr/bin/env node

/**
 * Verify Android Assets Script
 *
 * Checks that all required Android assets are properly generated
 * and reports any missing files.
 *
 * Usage: node scripts/verify-assets.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resDir = path.join(__dirname, "../android/app/src/main/res");

// Required assets for each density
const densities = ["ldpi", "mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
const iconFiles = ["ic_launcher.png", "ic_launcher_round.png"];

// Splash screen densities
const splashDensities = [
  "drawable",
  ...densities.map((d) => `drawable-land-${d}`),
  ...densities.map((d) => `drawable-port-${d}`),
];

let allGood = true;
let iconCount = 0;
let splashCount = 0;

console.log("🔍 Verifying Android assets...\n");

// Check icons
console.log("📱 Checking launcher icons:");
densities.forEach((density) => {
  const mipmapDir = path.join(resDir, `mipmap-${density}`);
  let densityOk = true;

  iconFiles.forEach((file) => {
    const filePath = path.join(mipmapDir, file);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      console.log(`  ✓ mipmap-${density}/${file} (${stat.size} bytes)`);
      iconCount++;
    } else {
      console.log(`  ✗ MISSING: mipmap-${density}/${file}`);
      allGood = false;
      densityOk = false;
    }
  });
});

// Check adaptive icons (Android 8.0+)
console.log("\n🎨 Checking adaptive icons (v26+):");
const adapDir = path.join(resDir, "mipmap-anydpi-v26");
if (fs.existsSync(adapDir)) {
  const xmlFiles = fs.readdirSync(adapDir).filter((f) => f.endsWith(".xml"));
  if (xmlFiles.length > 0) {
    console.log(`  ✓ Found ${xmlFiles.length} adaptive icon(s)`);
  } else {
    console.log("  ✗ No adaptive icon XML files found");
    allGood = false;
  }
}

// Check splash screens
console.log("\n🎆 Checking splash screens:");
splashDensities.forEach((folder) => {
  const splashDir = path.join(resDir, folder);
  const splashPath = path.join(splashDir, "splash.png");

  if (fs.existsSync(splashPath)) {
    const stat = fs.statSync(splashPath);
    console.log(`  ✓ ${folder}/splash.png (${stat.size} bytes)`);
    splashCount++;
  } else {
    console.log(`  ✗ MISSING: ${folder}/splash.png`);
    allGood = false;
  }
});

// Summary
console.log("\n" + "=".repeat(50));
console.log(`📊 Summary:`);
console.log(`  Icons generated: ${iconCount}/12 (6 densities × 2 types)`);
console.log(
  `  Splash screens generated: ${splashCount}/13 (base + 6 portrait + 6 landscape)`,
);

if (allGood) {
  console.log("\n✅ All assets present and ready!\n");
  process.exit(0);
} else {
  console.log('\n❌ Some assets are missing. Run "npm run assets:generate"\n');
  process.exit(1);
}
