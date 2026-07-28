import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;
if (!baseURL) {
  throw new Error("PLAYWRIGHT_BASE_URL is required for live Playwright tests");
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: [
    "accessibility.spec.mjs",
    "frontend-responsive.spec.mjs",
    "live-smoke.spec.mjs",
    "legacy-url-shim.spec.mjs",
  ],
  timeout: 120000,
  workers: 1,
  use: {
    baseURL,
    // Persist first-failure evidence for each bounded route group. This is
    // intentionally configured, not proof that a live run has occurred.
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
});
