// @ts-check
const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const globals = require('globals');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    // All TypeScript source files — Node.js environment
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-console': 'warn',
    },
  },
  {
    // Test files — add Jest globals on top of Node globals
    files: ['**/*.spec.ts', '**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
        fail: 'readonly', // legacy Jest global not included in the globals package
      },
    },
  },
];
