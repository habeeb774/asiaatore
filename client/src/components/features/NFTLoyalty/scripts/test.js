#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running NFT Loyalty Program tests...');

try {
  // Run Jest tests
  execSync('npx jest --coverage --watchAll=false', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  console.log('✅ All tests passed!');

  // Check coverage thresholds
  const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
  if (require('fs').existsSync(coveragePath)) {
    const coverage = require(coveragePath);
    const { branches, functions, lines, statements } = coverage.total;

    console.log('\n📊 Coverage Report:');
    console.log(`Branches: ${branches.pct}%`);
    console.log(`Functions: ${functions.pct}%`);
    console.log(`Lines: ${lines.pct}%`);
    console.log(`Statements: ${statements.pct}%`);

    // Check if coverage meets thresholds
    const thresholds = { branches: 70, functions: 80, lines: 80, statements: 80 };
    let passed = true;

    Object.entries(thresholds).forEach(([key, threshold]) => {
      if (coverage.total[key].pct < threshold) {
        console.error(`❌ ${key} coverage (${coverage.total[key].pct}%) below threshold (${threshold}%)`);
        passed = false;
      }
    });

    if (!passed) {
      process.exit(1);
    }
  }

} catch (error) {
  console.error('❌ Tests failed!');
  process.exit(1);
}