#!/usr/bin/env node
/**
 * Simple theme packager: creates a zip of a theme folder.
 * Uses platform-native tools when available (tar on *nix, Compress-Archive on Windows) as a lightweight approach.
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const argv = process.argv.slice(2);
const getArg = (k, def) => {
  const idx = argv.indexOf(k);
  if (idx === -1) return def;
  return argv[idx+1] || def;
};

const src = getArg('--src', 'themes/my-store-template');
const out = getArg('--out', 'releases/my-store-template.zip');

if (!fs.existsSync(src)) {
  console.error('Source folder not found:', src);
  process.exit(1);
}

const absSrc = path.resolve(src);
const absOut = path.resolve(out);
const outDir = path.dirname(absOut);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

try {
  if (process.platform === 'win32') {
    // Use PowerShell Compress-Archive
    const cmd = `powershell -NoProfile -Command "Compress-Archive -Path '${absSrc}\\*' -DestinationPath '${absOut}' -Force"`;
    console.log('Running:', cmd);
    execSync(cmd, { stdio: 'inherit' });
  } else {
    // Use zip if available, else tar.gz
    try {
      execSync(`zip -r '${absOut}' '${absSrc}'`, { stdio: 'inherit' });
    } catch (e) {
      // fallback to tar.gz
      execSync(`tar -czf '${absOut.replace(/\.zip$/, '.tar.gz')}' -C '${path.dirname(absSrc)}' '${path.basename(absSrc)}'`, { stdio: 'inherit' });
    }
  }
  console.log('Packaged theme to', absOut);
} catch (e) {
  console.error('Packaging failed:', e.message || e);
  process.exit(2);
}
