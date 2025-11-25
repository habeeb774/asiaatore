#!/usr/bin/env node
/* Performance budget check.
 * Reads client/dist assets after build and enforces size thresholds.
 * Thresholds intentionally generous for first pass; tighten over time.
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const distDir = path.resolve(process.cwd(), 'client', 'dist', 'assets');
const fail = (msg) => { console.error('\n[perf-budget] FAIL:', msg); process.exitCode = 1; };

// Second phase tightened thresholds (was generous first pass).
// Target reductions:
// - vendor.react: aim <61 kB gzip now (final goal <55)
// - chunk.admin: aim <63 kB gzip now (final goal <55)
// - vendor.maps: keep stable or reduce (<45 kB future)
// - index main: incremental (<35 kB goal)
// - router: unchanged for now (already small)
const budgets = [
  { test: /vendor.react.*\.js$/, gzipKB: 61, rawKB: 200 },
  { test: /chunk.admin.*\.js$/, gzipKB: 63, rawKB: 270 },
  { test: /vendor.maps.*\.js$/, gzipKB: 46, rawKB: 155 },
  { test: /index-.*\.js$/, gzipKB: 36, rawKB: 125 },
  { test: /vendor.router.*\.js$/, gzipKB: 24, rawKB: 70 },
];

function formatKB(bytes){ return (bytes/1024).toFixed(2) + ' kB'; }
function gzipSize(buf){ return zlib.gzipSync(buf).length; }

if (!fs.existsSync(distDir)) {
  fail('Dist directory not found: ' + distDir + '\nRun build first (npm run build -w client).');
  process.exit();
}

const files = fs.readdirSync(distDir).filter(f => /\.js$/.test(f));
const results = [];
for (const file of files) {
  const full = path.join(distDir, file);
  const buf = fs.readFileSync(full);
  const raw = buf.length;
  const gz = gzipSize(buf);
  results.push({ file, raw, gz });
}

console.log('[perf-budget] Asset sizes:');
results.sort((a,b)=>b.gz - a.gz).forEach(r => {
  console.log('  ' + r.file.padEnd(32) + ' raw ' + formatKB(r.raw).padStart(10) + ' gzip ' + formatKB(r.gz).padStart(10));
});

for (const b of budgets) {
  const match = results.find(r => b.test.test(r.file));
  if (!match) {
    console.warn('[perf-budget] WARN: No asset matched budget regex', b.test);
    continue;
  }
  if (match.raw > b.rawKB * 1024) {
    fail(`${match.file} raw ${formatKB(match.raw)} exceeds ${b.rawKB} kB`);
  }
  if (match.gz > b.gzipKB * 1024) {
    fail(`${match.file} gzip ${formatKB(match.gz)} exceeds ${b.gzipKB} kB`);
  }
}

if (process.exitCode === 1) {
  console.error('\n[perf-budget] One or more budgets exceeded. Consider further code-splitting or optimization.');
} else {
  console.log('\n[perf-budget] OK: All budgets within limits.');
}
