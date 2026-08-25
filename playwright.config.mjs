import { defineConfig } from '@playwright/test';
import process from 'node:process';

const port = process.env.PLAYWRIGHT_PORT ?? '4317';
const baseURL = `http://localhost:${port}`;
const browserName = process.env.PLAYWRIGHT_BROWSER ?? 'chromium';

export default defineConfig({
  testDir: './tests/e2e',
  globalTeardown: './tools/playwright-global-teardown.mjs',
  fullyParallel: process.env.PLAYWRIGHT_FULLY_PARALLEL === '1',
  timeout: process.env.CI ? 45000 : 30000,
  workers: Math.max(1, Number.parseInt(process.env.PLAYWRIGHT_WORKERS ?? '1', 10) || 1),
  retries: process.env.CI ? 1 : 0,
  projects: [
    {
      name: browserName,
      use: { browserName },
    },
  ],
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
      CONTROL_ATLAS_PLAYWRIGHT_SERVER: '1',
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
