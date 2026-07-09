import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: process.env.CI ? 45000 : 30000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  expect: {
    timeout: process.env.CI ? 15000 : 5000,
  },
  use: {
    baseURL: 'http://localhost:4317',
    actionTimeout: process.env.CI ? 15000 : 0,
    navigationTimeout: process.env.CI ? 30000 : 0,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node ./tools/serve-static-site.mjs',
    env: {
      PORT: '4317',
    },
    url: 'http://localhost:4317',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
