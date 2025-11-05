#!/usr/bin/env node
// Simple helper to clone a template folder from /themes to a destination folder.
// Usage: node scripts/clone-template.js --template my-store-template --dest ./my-clone

import fs from 'fs/promises';
import path from 'path';

function usage() {
  console.log('Usage: node scripts/clone-template.js --template <name> [--dest <path>]');
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(s, d);
    } else if (entry.isFile()) {
      // do not copy node_modules
      if (entry.name === 'node_modules') continue;
      await fs.copyFile(s, d);
    }
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--template' || a === '-t') args.template = argv[++i];
    else if (a === '--dest' || a === '-d') args.dest = argv[++i];
  }
  if (!args.template) {
    usage();
    process.exit(1);
  }

  const repoRoot = path.resolve(new URL(import.meta.url).pathname, '..', '..').replace(/^\/[A-Z]:/i, (m)=>m.slice(1));
  const src = path.join(repoRoot, 'themes', args.template);
  const dest = path.resolve(args.dest || `./${args.template}-clone-${Date.now()}`);

  try {
    // verify src exists
    await fs.access(src);
  } catch (e) {
    console.error('Template not found at', src);
    process.exit(2);
  }

  console.log(`Cloning template '${args.template}' to '${dest}'...`);
  try {
    await copyDir(src, dest);
    console.log('Clone complete. Run `npm --prefix ' + dest + ' install` then follow the cloned theme README.');
  } catch (e) {
    console.error('Failed to clone:', e);
    process.exit(3);
  }
}

main();
