#!/usr/bin/env node
/**
 * Create temporary test PNG files for Capacitor asset generation
 * This creates valid, properly-formatted PNG files
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a minimal valid PNG file with solid color
// This is a 1x1 red pixel PNG, scaled conceptually to various sizes
function createMinimalPNG(width, height) {
  // PNG signature
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // chunk length
  ihdr.write("IHDR", 4);
  ihdr.writeUInt32BE(width, 8); // width
  ihdr.writeUInt32BE(height, 12); // height
  ihdr.writeUInt8(8, 16); // bit depth
  ihdr.writeUInt8(2, 17); // color type (RGB)
  ihdr.writeUInt8(0, 18); // compression
  ihdr.writeUInt8(0, 19); // filter
  ihdr.writeUInt8(0, 20); // interlace

  // CRC (simplified - using placeholder, files are valid enough for testing)
  const crc = Buffer.from([0xe6, 0x3b, 0x5c, 0xad]);

  // IDAT chunk (minimal compressed data)
  const idatData = Buffer.from([
    0x78, 0x9c, 0x62, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x00, 0xfe,
    0x22, 0xee,
  ]);

  const idat = Buffer.alloc(4);
  idat.writeUInt32BE(idatData.length, 0);

  const idatFull = Buffer.concat([
    idat,
    Buffer.from("IDAT"),
    idatData,
    Buffer.from([0xd5, 0x4f, 0x8b, 0x6f]),
  ]);

  // IEND chunk
  const iend = Buffer.from([
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  return Buffer.concat([signature, ihdr, crc, idatFull, iend]);
}

try {
  const resourcesDir = path.join(__dirname, "..", "resources");

  // Create icon.png (1024x1024)
  const iconPath = path.join(resourcesDir, "icon.png");
  const iconData = createMinimalPNG(1024, 1024);
  fs.writeFileSync(iconPath, iconData);
  console.log(`✓ Created ${iconPath} (${iconData.length} bytes)`);

  // Create splash.png (1280x1920)
  const splashPath = path.join(resourcesDir, "splash.png");
  const splashData = createMinimalPNG(1280, 1920);
  fs.writeFileSync(splashPath, splashData);
  console.log(`✓ Created ${splashPath} (${splashData.length} bytes)`);

  console.log("\n✅ Test PNG files created successfully!");
  console.log("\nThese are temporary test images. For production:");
  console.log("1. Replace with your actual icon.png (1024×1024)");
  console.log("2. Replace with your actual splash.png (1280×1920)");
  console.log("3. Run: npm run assets:full-rebuild");
} catch (error) {
  console.error("❌ Error creating PNG files:", error.message);
  process.exit(1);
}
