import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config.mjs";

export default defineConfig({
  ...baseConfig,
  testDir: "./tests/guardian",
  testMatch: "**/experience-guardian.spec.mjs",
  workers: 1,
  retries: 0,
  reporter: [["list"]],
});
