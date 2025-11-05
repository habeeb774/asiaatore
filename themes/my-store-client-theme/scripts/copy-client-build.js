const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const clientDist = path.resolve(root, '..', '..', 'client', 'dist');
const publicDir = path.resolve(root, 'public');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying client build from:', clientDist);
if (!fs.existsSync(clientDist)) {
  console.error('client/dist does not exist. Run `npm run build` in the client folder first.');
  process.exit(1);
}

copyRecursive(clientDist, publicDir);
console.log('Copied client build into theme public/');
