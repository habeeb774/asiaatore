#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Build script for NFT Loyalty component
console.log('🏗️  Building NFT Loyalty Program component...');

// Create dist directory
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy main files
const filesToCopy = [
  'NFTLoyalty.jsx',
  'index.js',
  'package.json',
  'README.md',
  'LICENSE'
];

filesToCopy.forEach(file => {
  const srcPath = path.join(__dirname, '..', file);
  const destPath = path.join(distDir, file);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

// Create a simple build info file
const buildInfo = {
  name: 'NFT Loyalty Program',
  version: require('../package.json').version,
  buildTime: new Date().toISOString(),
  files: filesToCopy
};

fs.writeFileSync(
  path.join(distDir, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('🎉 Build completed successfully!');
console.log(`📦 Output directory: ${distDir}`);