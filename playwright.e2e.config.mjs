import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.mjs';

export default defineConfig({
  ...baseConfig,
  testIgnore: [
    '**/accessibility.spec.mjs',
    '**/approved-layout-visual.spec.mjs',
  ],
});
