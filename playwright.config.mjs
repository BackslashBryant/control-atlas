import { defineConfig } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '4317';
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: '**/approved-layout-visual.spec.mjs',
  timeout: process.env.CI ? 45000 : 30000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  expect: {
    timeout: process.env.CI ? 15000 : 5000,
  },
  use: {
    baseURL,
    actionTimeout: process.env.CI ? 15000 : 0,
    navigationTimeout: process.env.CI ? 30000 : 0,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node ./tools/serve-static-site.mjs',
    env: {
      PORT: port,
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
