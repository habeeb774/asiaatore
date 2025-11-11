#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running ESLint on NFT Loyalty Program...');

try {
  // Run ESLint
  execSync('npx eslint src/ --ext .js,.jsx', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  console.log('✅ Code linting passed!');

} catch (error) {
  console.error('❌ Code linting failed!');
  console.error('Please fix the linting errors before committing.');
  process.exit(1);
}