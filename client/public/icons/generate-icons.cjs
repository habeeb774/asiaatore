// Icon generation script for PWA
// This script generates multiple icon sizes from the base 512x512 icon
// Run with: node generate-icons.cjs

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512, 1024];

// Check if sharp is available for image processing
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not found. Please install it: npm install sharp');
  console.log('For now, copying existing icons to expected sizes...');
  
  // Fallback: copy existing icons to expected sizes
  const baseIcons = {
    'pwa-192.png': [72, 96, 128, 144, 152, 192],
    'pwa-512.png': [384, 512]
  };
  
  Object.entries(baseIcons).forEach(([source, sizes]) => {
    const sourcePath = path.join(__dirname, source);
    if (fs.existsSync(sourcePath)) {
      sizes.forEach(size => {
        const targetPath = path.join(__dirname, `pwa-${size}.png`);
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`Created: pwa-${size}.png (copied from ${source})`);
        }
      });
    }
  });
  
  // Create a placeholder 1024x1024 icon
  const placeholder1024 = path.join(__dirname, 'pwa-1024.png');
  if (!fs.existsSync(placeholder1024)) {
    const source512 = path.join(__dirname, 'pwa-512.png');
    if (fs.existsSync(source512)) {
      fs.copyFileSync(source512, placeholder1024);
      console.log('Created: pwa-1024.png (copied from pwa-512.png)');
    }
  }
  
  process.exit(0);
}

// If sharp is available, generate proper icons
async function generateIcons() {
  const sourceIcon = path.join(__dirname, 'pwa-512.png');
  
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon pwa-512.png not found!');
    return;
  }
  
  for (const size of iconSizes) {
    const outputPath = path.join(__dirname, `pwa-${size}.png`);
    
    if (fs.existsSync(outputPath)) {
      console.log(`Skipping existing: pwa-${size}.png`);
      continue;
    }
    
    try {
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(outputPath);
      
      console.log(`Generated: pwa-${size}.png`);
    } catch (error) {
      console.error(`Error generating ${size}x${size}:`, error.message);
    }
  }
}

generateIcons().then(() => {
  console.log('Icon generation complete!');
}).catch(console.error);
