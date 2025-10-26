const fs = require('fs-extra');
const path = require('path');

class ComponentMerger {
  constructor() {
    this.mergeQueue = [];
    this.backupDir = path.join(process.cwd(), 'backups', 'components');
  }

  addMergeTask(config) {
    this.mergeQueue.push(config);
  }

  async backupFiles(files) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, timestamp);
    await fs.ensureDir(backupPath);

    for (const file of files) {
      if (await fs.pathExists(file)) {
        const dest = path.join(backupPath, path.basename(file));
        await fs.copy(file, dest);
      }
    }

    return backupPath;
  }

  async mergeComponents({ sources, target, strategy }) {
    console.log(`\n🔧 Merging ${sources.length} source(s) -> ${target}  (strategy: ${strategy})`);
    const existing = sources.filter(s => fs.existsSync(s));
    if (!existing.length) {
      console.warn('No source files found for this task, skipping.');
      return;
    }

    const backupPath = await this.backupFiles(existing);
    console.log('Backed up sources to', backupPath);

    await fs.ensureDir(path.dirname(target));

    if (await fs.pathExists(target)) {
      console.log('Target exists, skipping creation:', target);
      return;
    }

    let best = existing[0];
    let bestSize = (await fs.stat(existing[0])).size;
    for (const s of existing.slice(1)) {
      const sz = (await fs.stat(s)).size;
      if (sz > bestSize) { best = s; bestSize = sz; }
    }

    const content = await fs.readFile(best, 'utf8');
    await fs.writeFile(target, content, 'utf8');
    console.log('Wrote target from', best);

    const report = {
      task: { sources, target, strategy },
      backedUp: existing,
      chosenSeed: best
    };
    const reportPath = path.join(path.dirname(target), 'merge-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    console.log('Wrote merge report to', reportPath);
  }

  async executeAll() {
    console.log(`Starting merge of ${this.mergeQueue.length} tasks`);
    for (const task of this.mergeQueue) {
      try {
        await this.mergeComponents(task);
      } catch (err) {
        console.error('Merge failed for', task.target, err);
      }
    }
    console.log('All merge tasks processed');
  }
}

module.exports = ComponentMerger;

if (require.main === module) {
  (async () => {
    const merger = new ComponentMerger();
    merger.addMergeTask({
      sources: [
        './client/src/components/common/ProductCard.jsx',
        './client/src/components/products/ProductCard.jsx',
        './client/src/components/CustomProductCard.js'
      ],
      target: './client/src/components/shared/ProductCard/ProductCard.jsx',
      strategy: 'combine-features'
    });

    merger.addMergeTask({
      sources: [
        './client/src/components/cart/CartPanel.jsx',
        './client/src/components/cart/CartSidebar.jsx',
        './client/src/components/ui/FloatingCart.jsx'
      ],
      target: './client/src/components/commerce/Cart/Cart.jsx',
      strategy: 'unify-interface'
    });

    await merger.executeAll();
  })();
}
