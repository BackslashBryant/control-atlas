import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";
import { RUNTIME_CACHE_VERSION } from "../../src/shared/runtime-cache-version.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("live smoke: current Home contract and AC-2 record path", async ({ page }) => {
  test.setTimeout(120000);
  await gotoApp(page, "/");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  if (process.env.PLAYWRIGHT_BASE_URL) {
    expect(page.url()).toContain("/control-atlas/");
  }
  await expect(
    page.getByRole("heading", { name: "Control Atlas", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("search")).toBeVisible();
  await expect(page.locator(".home-secondary-action")).toHaveCount(3);
  await expect(page.locator(".home-entry .brand-key-word")).toBeVisible();
  await expect(page.locator(".home-product-identity")).toContainText(
    "people doing the work can find what they need and keep moving",
  );
  await expect(page.locator(".home-trust-boundary")).toContainText(
    "The people doing the work decide what applies",
  );

  await gotoApp(page, "/#/search?q=AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  const controlResult = page
    .getByRole("article", { name: /AC-2.*Account Management/i })
    .filter({ hasNotText: "Assessment Procedure" });
  await expect(controlResult).toBeVisible({ timeout: 30000 });
  await controlResult.getByRole("button", { name: "Open record" }).click();
  await expect(
    page.getByText("Source excerpt from SP 800-53 Rev. 5", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
});

test("live smoke: compare hub loads", async ({ page }) => {
  await gotoApp(page, "/?view=matrix");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(
    page.getByRole("heading", { name: "What do you want to compare?" }),
  ).toBeVisible();
});

test("live smoke: deployed runtime cache version matches source", async ({
  request,
}) => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL,
    "deployed runtime version check only runs against the live site",
  );
  const home = await request.get(process.env.PLAYWRIGHT_BASE_URL);
  expect(home.ok()).toBeTruthy();
  const html = await home.text();
  const deployedVersion = html.match(
    /<meta name="control-atlas-runtime-cache-version" content="([^"]+)">/,
  )?.[1];
  expect(deployedVersion).toBe(RUNTIME_CACHE_VERSION);
});
