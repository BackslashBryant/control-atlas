import { networkInterfaces } from 'node:os';
import { defineConfig } from '@playwright/test';

const localHost = Object.values(networkInterfaces())
  .flat()
  .find((entry) => entry && entry.family === 'IPv4' && !entry.internal)?.address || '127.0.0.1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: `http://${localHost}:4317`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node ./tools/serve-static-site.mjs',
    env: {
      PORT: '4317',
    },
    port: 4317,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
