import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-public/**',
      'data/generated/**',
      'artifacts/**',
      'docs/**',
      'maps/**',
      'lib/**',
      'app/**',
      'styles/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', 'tools/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
];
