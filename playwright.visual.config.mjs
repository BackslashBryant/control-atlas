import baseConfig from './playwright.config.mjs';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  ...baseConfig,
  testIgnore: [],
  testMatch: '**/approved-layout-visual.spec.mjs',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  workers: 1,
});
