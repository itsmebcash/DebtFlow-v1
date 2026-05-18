#!/usr/bin/env node

/**
 * Clean Android Assets Script
 *
 * Safely removes generated Android assets to prepare for regeneration.
 * This script:
 * - Removes all generated mipmap-* files (launcher icons)
 * - Removes all generated drawable-* files (splash screens)
 * - Preserves other resources like layouts, values, xml
 * - Provides summary of removed files
 *
 * Usage: node scripts/clean-assets.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resDir = path.join(__dirname, "../android/app/src/main/res");

// Folders to clean (icon and splash screen assets)
const foldersToClean = [
  "mipmap-ldpi",
  "mipmap-mdpi",
  "mipmap-hdpi",
  "mipmap-xhdpi",
  "mipmap-xxhdpi",
  "mipmap-xxxhdpi",
  "mipmap-anydpi-v26",
  "drawable",
  "drawable-land-ldpi",
  "drawable-land-mdpi",
  "drawable-land-hdpi",
  "drawable-land-xhdpi",
  "drawable-land-xxhdpi",
  "drawable-land-xxxhdpi",
  "drawable-port-ldpi",
  "drawable-port-mdpi",
  "drawable-port-hdpi",
  "drawable-port-xhdpi",
  "drawable-port-xxhdpi",
  "drawable-port-xxxhdpi",
  "drawable-night",
  "drawable-night-land-ldpi",
  "drawable-night-land-mdpi",
  "drawable-night-land-hdpi",
  "drawable-night-land-xhdpi",
  "drawable-night-land-xxhdpi",
  "drawable-night-land-xxxhdpi",
  "drawable-night-port-ldpi",
  "drawable-night-port-mdpi",
  "drawable-night-port-hdpi",
  "drawable-night-port-xhdpi",
  "drawable-night-port-xxhdpi",
  "drawable-night-port-xxxhdpi",
];

let removedCount = 0;
let totalSize = 0;

console.log("🧹 Cleaning Android assets...\n");

foldersToClean.forEach((folder) => {
  const folderPath = path.join(resDir, folder);

  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath);

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);

      // Only remove generated asset files, preserve hand-crafted files
      if (
        file === "ic_launcher.png" ||
        file === "ic_launcher_round.png" ||
        file === "ic_launcher.xml" ||
        file === "splash.png"
      ) {
        fs.unlinkSync(filePath);
        totalSize += stat.size;
        removedCount++;
        console.log(`✓ Removed: ${folder}/${file}`);
      }
    });
  }
});

console.log(
  `\n✅ Cleaned ${removedCount} files (${(totalSize / 1024).toFixed(
    2,
  )} KB freed)\n`,
);
console.log('Next step: Run "npm run assets:generate" to regenerate assets\n');
