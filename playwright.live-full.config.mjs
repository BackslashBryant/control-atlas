import { defineConfig } from "@playwright/test";
import liveConfig from "./playwright.live.config.mjs";

export default defineConfig({
  ...liveConfig,
  testMatch: [
    "accessibility.spec.mjs",
    "frontend-responsive.spec.mjs",
    "live-smoke.spec.mjs",
    "legacy-url-shim.spec.mjs",
    "publication-identity.spec.mjs",
  ],
});
