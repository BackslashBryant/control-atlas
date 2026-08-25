import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.mjs';

export default defineConfig({
  ...baseConfig,
  testMatch: '**/visual-regression.spec.mjs',
  workers: 1,
  retries: 0,
  expect: {
    ...baseConfig.expect,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    },
  },
});
