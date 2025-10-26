import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // ignore large build artifacts and generated assets
  globalIgnores(['client/dist/**', 'dist/**', 'client/.vite/**', 'node_modules/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      'jsx-a11y': jsxA11y,
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
])
