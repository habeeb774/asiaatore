import { execSync, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = resolve(process.cwd(), 'dist');
mkdirSync(outputDir, { recursive: true });
const outputFile = resolve(outputDir, `my-store-${timestamp}.zip`);

let status = '';
try {
  status = execSync('git status --porcelain', { encoding: 'utf8' });
} catch (error) {
  console.warn('Unable to read git status:', error.message);
}

if (status.trim()) {
  console.warn('⚠️ Working tree has uncommitted changes. Archive will contain the last committed state.');
}

const result = spawnSync('git', ['archive', '--format=zip', `--output=${outputFile}`, 'HEAD'], {
  stdio: 'inherit'
});

if (result.status !== 0) {
  console.error('git archive failed.');
  process.exit(result.status ?? 1);
}

console.log(`✅ Archive created at: ${outputFile}`);