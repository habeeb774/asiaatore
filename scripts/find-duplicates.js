const fs = require('fs');
const path = require('path');

function findDuplicateComponents(rootDir) {
  const componentsMap = new Map();

  function scanDirectory(dir) {
    let files = [];
    try { files = fs.readdirSync(dir); } catch (e) { return; }

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      let stat;
      try { stat = fs.statSync(fullPath); } catch (e) { return; }

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
        let content = '';
        try { content = fs.readFileSync(fullPath, 'utf8'); } catch (e) { return; }
        const componentName = extractComponentName(content, file);

        if (componentName) {
          if (!componentsMap.has(componentName)) {
            componentsMap.set(componentName, []);
          }
          componentsMap.get(componentName).push(fullPath);
        }
      }
    });
  }

  function extractComponentName(content, filename) {
    // Try to extract component name from exports
    const componentMatch = content.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/);
    if (componentMatch) return componentMatch[1];

    // fallback to filename (without extension)
    return path.basename(filename, path.extname(filename));
  }

  scanDirectory(rootDir);

  const duplicates = {};
  for (const [name, paths] of componentsMap) {
    if (paths.length > 1) {
      duplicates[name] = paths;
    }
  }

  return duplicates;
}

if (require.main === module) {
  const root = process.argv[2] || './client/src';
  const duplicates = findDuplicateComponents(root);
  console.log(JSON.stringify(duplicates, null, 2));
}

module.exports = { findDuplicateComponents };
