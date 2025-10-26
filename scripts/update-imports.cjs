const fs = require('fs-extra');
const path = require('path');

const ROOT = process.cwd();
const SEARCH_ROOT = path.join(ROOT, 'client', 'src');

const replacements = [
  // ProductCard -> shared
  {
    olds: [
      "../components/common/ProductCard",
      "../components/products/ProductCard",
      "../components/CustomProductCard",
      "components/common/ProductCard",
      "components/products/ProductCard",
      "components/CustomProductCard",
      "../components/products/ProductCard.jsx",
      "../components/common/ProductCard.jsx",
    ],
    newline: "../components/shared/ProductCard"
  },
  // Navbar -> ui/Navbar
  {
    olds: [
      "../assets/Navbar",
      "../components/ui/Navbar",
      "components/ui/Navbar",
      "assets/Navbar",
      "../assets/Navbar.jsx",
      "../components/ui/Navbar.jsx"
    ],
    newline: "../components/ui/Navbar"
  },
  // ToastProvider -> context/ToastContext (prefer context)
  {
    olds: [
      "../components/ui/ToastProvider",
      "../context/ToastContext",
      "components/ui/ToastProvider",
      "../components/ui/ToastProvider.jsx"
    ],
    newline: "../context/ToastContext"
  },
  // cn util -> utils/cn
  {
    olds: [
      "../lib/utils",
      "../utils/cn",
      "lib/utils",
      "utils/cn",
      "../lib/utils.js",
      "../utils/cn.js"
    ],
    newline: "../utils/cn"
  },
  // reactLeafletCompat duplicates -> utils/reactLeafletCompat
  {
    olds: [
      "../utils/reactLeafletCompat.js",
      "../utils/reactLeafletCompat.jsx",
      "utils/reactLeafletCompat",
      "utils/reactLeafletCompat.jsx",
      "utils/reactLeafletCompat.js"
    ],
    newline: "../utils/reactLeafletCompat"
  }
];

function getAllJSFiles(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results.push(...getAllJSFiles(filePath));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(filePath);
    }
  });
  return results;
}

function runDryRun() {
  const files = getAllJSFiles(SEARCH_ROOT);
  const changes = [];

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    replacements.forEach(rep => {
      rep.olds.forEach(oldPath => {
        const regex = new RegExp(`from\\s+['\"]${oldPath}['\"]`, 'g');
        if (regex.test(content)) {
          const newContent = content.replace(regex, `from '${rep.newline}'`);
          changes.push({ file, oldPath, preview: diffSnippet(content, newContent) });
        }
      });
    });
  });

  return changes;
}

function diffSnippet(oldStr, newStr) {
  // very small snippet: show changed lines around import
  const oldLines = oldStr.split(/\r?\n/);
  const newLines = newStr.split(/\r?\n/);
  const snippets = [];
  for (let i = 0; i < Math.min(oldLines.length, newLines.length); i++) {
    if (oldLines[i] !== newLines[i]) {
      const start = Math.max(0, i - 2);
      const end = Math.min(oldLines.length - 1, i + 2);
      snippets.push({old: oldLines.slice(start, end + 1).join('\n'), new: newLines.slice(start, end + 1).join('\n')});
      break;
    }
  }
  return snippets[0] || { old: '', new: '' };
}

async function applyChanges(changes) {
  // backup files first
  const backupDir = path.join(ROOT, 'backups', 'import-update-' + Date.now());
  await fs.ensureDir(backupDir);
  const applied = [];

  for (const ch of changes) {
    await fs.copy(ch.file, path.join(backupDir, path.basename(ch.file)));
    let content = fs.readFileSync(ch.file, 'utf8');
    replacements.forEach(rep => {
      rep.olds.forEach(oldPath => {
        const regex = new RegExp(`from\\s+['\"]${oldPath}['\"]`, 'g');
        content = content.replace(regex, `from '${rep.newline}'`);
      });
    });
    fs.writeFileSync(ch.file, content, 'utf8');
    applied.push(ch.file);
  }

  return { backupDir, applied };
}

(async () => {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry') || args.includes('--dry-run') || (!args.includes('--apply'));

  const changes = runDryRun();
  console.log(`Found ${changes.length} file(s) with matching imports.`);
  changes.forEach(c => {
    console.log('\nFILE:', c.file);
    console.log('--- OLD ---');
    console.log(c.preview.old);
    console.log('--- NEW ---');
    console.log(c.preview.new);
  });

  if (!dry && changes.length) {
    console.log('\nApplying changes... (backups will be written)');
    const res = await applyChanges(changes);
    console.log('Backup directory:', res.backupDir);
    console.log('Updated files:', res.applied.length);
  } else if (dry) {
    console.log('\nDry run only. To apply run: node scripts/update-imports.cjs --apply');
  }
})();
