/**
 * Icon Generation Script
 *
 * Generates PWA icons in required sizes from a source image.
 *
 * Usage: node scripts/generate-icons.js
 *
 * Prerequisites:
 * - Place your Raiders icon in public/raiders-icon.png (or raiders-icon.jpg/svg)
 * - Icon should be square and at least 512x512 pixels
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Icon sizes required for PWA
const SIZES = [
  { size: 192, filename: 'pwa-192x192.png' },
  { size: 512, filename: 'pwa-512x512.png' },
];

async function findSourceIcon() {
  const possibleNames = ['raiders-icon.png', 'raiders-icon.jpg', 'raiders-icon.jpeg'];

  for (const name of possibleNames) {
    const iconPath = path.join(PUBLIC_DIR, name);
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  }

  return null;
}

async function generateIcons() {
  console.log('🏈 Raiders Game Manager - Icon Generator\n');

  // Find source icon
  const sourceIconPath = await findSourceIcon();

  if (!sourceIconPath) {
    console.error('❌ Error: Source icon not found!');
    console.log('\nPlease download the Raiders icon from:');
    console.log('   https://i.imgur.com/YJiOC8p.png');
    console.log('\nAnd save it to one of these locations:');
    console.log('   - public/raiders-icon.png');
    console.log('   - public/raiders-icon.jpg');
    process.exit(1);
  }

  console.log(`✓ Found source icon: ${path.basename(sourceIconPath)}\n`);

  // Generate each size
  for (const { size, filename } of SIZES) {
    const outputPath = path.join(PUBLIC_DIR, filename);

    try {
      await sharp(sourceIconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 27, g: 41, b: 71, alpha: 1 } // Raiders navy blue
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${filename} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${filename}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✅ All icons generated successfully!');
  console.log('\nGenerated files:');
  SIZES.forEach(({ filename }) => {
    console.log(`   - public/${filename}`);
  });
  console.log('\nYou can now build the app with: npm run build');
}

// Run the script
generateIcons().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
