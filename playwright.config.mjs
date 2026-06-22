import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4317',
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
