import React from 'react';
import { Button } from '../components/ui';

const TEMPLATES = [
  { id: 'habeeb-template', name: 'Habeeb Template', desc: 'Lightweight storefront theme with clean layout.' },
  { id: 'my-store-template', name: 'My Store Template', desc: 'Full-featured demo theme with marketing sections.' },
  { id: 'my-store-client-theme', name: 'Client Theme', desc: 'Client-side presentation theme used in examples.' }
];

const TemplateDemos = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-4">Template demos & quick clone</h2>
      <p className="text-muted mb-6">Preview and quickly clone any of the included templates to try locally. This page documents basic customization steps and points to an automated installer script (PowerShell / Node) for Windows/macOS/Linux.</p>

      <div className="grid gap-6 md:grid-cols-2">
        {TEMPLATES.map(t => (
          <div key={t.id} className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold">{t.name}</h3>
            <p className="text-sm text-muted mb-4">{t.desc}</p>
            <div className="flex gap-3">
              <button
                className="btn btn-outline"
                onClick={() => {
                  try {
                    const path = `themes/${t.id}`;
                    if (navigator?.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(path);
                      alert(`Copied path to clipboard: ${path}`);
                    } else {
                      alert(path);
                    }
                  } catch (e) {
                    alert(`themes/${t.id}`);
                  }
                }}
              >
                Copy path
              </button>
              <a className="btn btn-primary" href="#clone-instructions">Clone template</a>
            </div>
          </div>
        ))}
      </div>

      <section id="clone-instructions" className="mt-10">
        <h3 className="text-2xl font-semibold mb-3">Quick clone (recommended)</h3>
        <p className="mb-3">Use the included Node helper to copy a template to a new folder. From the repo root:</p>
        <pre className="bg-surface p-3 rounded"><code>node scripts/clone-template.js --template my-store-template --dest ./my-store-clone</code></pre>
        <p className="mt-3">Or use the PowerShell installer wrapper (Windows/macOS with PowerShell):</p>
        <pre className="bg-surface p-3 rounded"><code>pwsh themes/install-template.ps1</code></pre>

        <h4 className="mt-6 text-xl font-semibold">What the installer does</h4>
        <ul className="list-disc pl-6 mt-2">
          <li>Copies theme files to your chosen destination</li>
          <li>Leaves node_modules out (you should run npm/pnpm install in the clone)</li>
          <li>Optionally runs <code>npm --prefix &lt;dest&gt; install</code> when asked</li>
        </ul>

        <h4 className="mt-6 text-xl font-semibold">Next steps after cloning</h4>
        <ol className="list-decimal pl-6 mt-2">
          <li>cd into the cloned directory</li>
          <li>Install dependencies: <code>npm install</code> or <code>pnpm install</code></li>
          <li>Start the theme preview/watch: follow README inside the cloned theme (often <code>pnpm run watch</code> or <code>npm run dev</code>)</li>
        </ol>
      </section>

      <section className="mt-10">
        <h3 className="text-2xl font-semibold">Pro version</h3>
        <p className="mb-3">We offer a Pro version that includes:</p>
        <ul className="list-disc pl-6">
          <li>Full RTL support and QA for Arabic/Hebrew layouts</li>
          <li>Additional Widgets (promotions, countdowns, advanced banners)</li>
          <li>Multiple shipping option integrations and advanced rules</li>
          <li>Priority support and theming assistance</li>
        </ul>
        <p className="mt-4">See <code>themes/pro-version/README.md</code> for full details and pricing/contact info.</p>
      </section>
    </div>
  );
};

export default TemplateDemos;
