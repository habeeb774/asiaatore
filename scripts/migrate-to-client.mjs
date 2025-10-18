#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const clientDir = path.join(root, 'client');

const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };

const copyDirRecursive = (src, dest) => {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const item of fs.readdirSync(src)) {
      const s = path.join(src, item);
      const d = path.join(dest, item);
      copyDirRecursive(s, d);
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
};

const rmDirRecursive = (p) => {
  if (!fs.existsSync(p)) return;
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const item of fs.readdirSync(p)) {
      rmDirRecursive(path.join(p, item));
    }
    fs.rmdirSync(p);
  } else {
    fs.unlinkSync(p);
  }
};

const moveIfExists = (fromRel, toRel) => {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (fs.existsSync(from)) {
    ensureDir(path.dirname(to));
    try {
      fs.renameSync(from, to);
      console.log(`Moved ${fromRel} -> ${toRel}`);
    } catch (err) {
      // Windows may throw EPERM/EXDEV; fallback to copy + delete
      console.warn(`Rename failed for ${fromRel} -> ${toRel}, falling back to copy. Reason: ${err.code || err.message}`);
      copyDirRecursive(from, to);
      rmDirRecursive(from);
      console.log(`Copied ${fromRel} -> ${toRel} and removed source`);
    }
  }
};

const copyIfExists = (fromRel, toRel) => {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (fs.existsSync(from)) {
    ensureDir(path.dirname(to));
    fs.copyFileSync(from, to);
    console.log(`Copied ${fromRel} -> ${toRel}`);
  }
};

// 1) Create client dir
ensureDir(clientDir);

// 2) Move frontend-rooted files/dirs into client/
moveIfExists('src', 'client/src');
moveIfExists('public', 'client/public');
moveIfExists('index.html', 'client/index.html');
moveIfExists('vite.config.js', 'client/vite.config.js');
moveIfExists('tailwind.config.js', 'client/tailwind.config.js');
moveIfExists('postcss.config.cjs', 'client/postcss.config.cjs');
moveIfExists('dev-dist', 'client/dev-dist');

// 3) Create client tsconfig.json (basic)
const clientTsConfigPath = path.join(clientDir, 'tsconfig.json');
if (!fs.existsSync(clientTsConfigPath)) {
  fs.writeFileSync(clientTsConfigPath, JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      types: ['vite/client', 'node'],
      strict: true,
      resolveJsonModule: true,
      noEmit: true,
      skipLibCheck: true
    },
    include: ['src', 'vite.config.js']
  }, null, 2));
  console.log('Created client/tsconfig.json');
}

// 4) Prepare client/package.json
const rootPkgPath = path.join(root, 'package.json');
const clientPkgPath = path.join(clientDir, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

// Heuristic: dependencies likely used by client
const clientDepsList = [
  'react','react-dom','@vitejs/plugin-react','vite','@tanstack/react-query','@tanstack/react-query-devtools',
  'i18next','react-i18next','framer-motion','zustand','sass','sass-embedded','tailwindcss','tailwindcss-animate',
  '@fontsource/cairo','leaflet','react-leaflet','vite-plugin-pwa'
];

const fromDeps = (rootPkg.dependencies||{});
const fromDev = (rootPkg.devDependencies||{});
const clientDeps = {};
const clientDevDeps = {};
for (const name of clientDepsList) {
  if (fromDeps[name]) clientDeps[name] = fromDeps[name];
  if (fromDev[name]) clientDevDeps[name] = fromDev[name];
}

const clientPkg = {
  name: 'my-store-client',
  private: true,
  version: rootPkg.version || '0.0.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'vite build',
    preview: 'vite preview'
  },
  dependencies: clientDeps,
  devDependencies: clientDevDeps
};

fs.writeFileSync(clientPkgPath, JSON.stringify(clientPkg, null, 2));
console.log('Created client/package.json');

// 5) Update root package.json to act as workspace orchestrator
rootPkg.workspaces = rootPkg.workspaces || ['client', 'server'];
rootPkg.scripts = Object.assign({}, rootPkg.scripts || {}, {
  'dev:client': 'npm run dev -w client',
  'build:client': 'npm run build -w client',
  'preview:client': 'npm run preview -w client',
  'dev:server': rootPkg.scripts?.['dev:server'] || 'node server/index.js',
  'dev:all': 'npm-run-all -p dev:server dev:client'
});

// Make default dev/build point to client to keep existing habits working
if (rootPkg.scripts.dev && rootPkg.scripts.dev.includes('vite')) {
  rootPkg.scripts.dev = 'npm run dev -w client';
}
if (rootPkg.scripts.build && rootPkg.scripts.build.includes('vite build')) {
  rootPkg.scripts.build = 'npm run build -w client';
}

fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2));
console.log('Updated root package.json with workspaces and scripts');

console.log('\nMigration complete. Next steps:');
console.log('- Run: npm install');
console.log('- Start server and client in parallel: npm run dev:all');
console.log('- Or individually: npm run dev:server and npm run dev:client');
