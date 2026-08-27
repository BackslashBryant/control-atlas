import { defineConfig } from "@playwright/test";
import baseConfig, { resolveWorkerCount } from "./playwright.config.mjs";

export default defineConfig({
  ...baseConfig,
  testDir: "./tests/guardian",
  testMatch: "**/experience-guardian.spec.mjs",
  fullyParallel: true,
  workers: resolveWorkerCount(),
  retries: 0,
  reporter: [["list"]],
});
