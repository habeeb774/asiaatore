import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // ignore large build artifacts, scripts, TypeScript and generated assets
  globalIgnores([
    'client/dist/**',
    'dist/**',
    'client/.vite/**',
    'node_modules/**',
    'themes/**',
    'packages/**',
    '.gh-pages/**',
    '.frontend-gh-pages/**',
    'temp/**',
    'uploads/**',
    'public/**',
    'client/public/**',
    'client/scripts/**',
    'client/src/**/*.ts',
    'client/src/**/*.tsx',
    'client/tests/**',
    'client/**/*.spec.ts',
    'client/**/*.test.ts',
    'reports/**',
    'my_store_db/**',
    'docs/**',
    'scripts/**',
    'server/uploads/**',
    'server/scripts/**',
    'server/data/**',
    'server/db/**',
    'server/config/**',
    'server/utils/**',
    'server/services/**',
    'server/middleware/**',
    'server/routes/**',
    'server/controllers/**',
    'server/modules/**',
    'server/prisma/**',
    'server/store/**',
    'server/graphql/**',
    'server/**/*.test.js',
    'server/**/*.spec.js',
    'tests/**',
    'tests-output/**',
    'tmp-build-check.txt',
    'baseline.sql',
    'discard.sql',
    'project_report.txt',
    'structure.txt',
    'TEMPLATE_README.md',
    'analyze_project.py',
    'vercel_ultimate_deploy.sh',
    'vercel.json',
    'railway.json',
    'ecosystem.config.js',
    'jsconfig.json',
    'tsconfig.json',
    'client/tsconfig.json',
    'client/jsconfig.json',
    'client/vitest.config.ts',
    'client/vitest.setup.ts',
    'client/playwright.config.ts',
    'client/postcss.config.cjs',
    'client/tailwind.config.js',
    'client/vite.config.js',
    'client/package.json',
    'client/pnpm-lock.yaml',
    'package.json',
    'pnpm-lock.yaml',
    'eslint.config.js',
    'client/eslint.config.js',
    'client/src/components/features/NFTLoyalty/**',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      'jsx-a11y': jsxA11y,
      'import': importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // basic JSX a11y rule enabled; plugin is registered above
      'jsx-a11y/alt-text': 'warn',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'react-refresh/only-export-components': 'off',
      'import/no-unresolved': 'off', // Disabled due to path resolution issues with Vite
    },
  },
  // Node/Server overrides
  {
    files: [
      'server/**/*.{js,jsx}',
      '*.config.{js,cjs}',
      'client/vite.config.js',
      'client/tailwind.config.js',
      'client/postcss.config.cjs',
      'client/playwright.config.ts',
      'client/vitest.config.ts',
      'ecosystem.config.cjs',
      'scripts/**/*.{js,jsx}',
      'client/src/components/features/NFTLoyalty/scripts/**/*.{js,jsx}',
      'mobile/**/*.{js,jsx}'
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.node },
      parserOptions: { sourceType: 'module' },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  // NFTLoyalty test files
  {
    files: [
      'client/src/components/features/NFTLoyalty/**/*.test.{js,jsx}',
      'client/src/components/features/NFTLoyalty/jest.setup.js'
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.jest,
        global: 'readonly',
      },
      parserOptions: { sourceType: 'module' },
    },
  },
])
