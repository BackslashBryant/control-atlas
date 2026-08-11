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
    page.getByRole("heading", {
      name: "See the landscape. Trace the source. Move the work forward.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search Control Atlas" })).toBeVisible();
  await expect(page.locator(".home-secondary-action")).toHaveCount(4);
  await expect(page.locator(".site-header .brand-key-word")).toBeVisible();
  await expect(page.locator(".home-product-identity")).toContainText(
    "Control Atlas brings the federal cybersecurity landscape together in one place",
  );
  await expect(page.locator(".home-ecosystem-areas > .bucket-tag")).toHaveCount(9);
  await expect(page.locator(".home-trust-boundary")).toContainText(
    "Official material stays source-traceable",
  );

  await gotoApp(page, "/#/library?q=AC-2");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  const controlResult = page
    .getByRole("article", { name: /AC-2.*Account Management/i })
    .filter({ hasNotText: "Assessment Procedure" });
  await expect(controlResult).toBeVisible({ timeout: 30000 });
  await controlResult.locator(".search-result-primary").click();
  await expect(
    page.getByText("Source excerpt from SP 800-53 Rev. 5", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
});

test("live smoke: Resources and Atlas workbench are first-class routes", async ({ page }) => {
  await gotoApp(page, "/#/resources?q=OSCAL");
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page).toHaveURL(/#\/resources\?q=OSCAL/);
  await expect(page.getByRole("heading", { name: "Find the ecosystem around the work" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Find resources" })).toHaveValue("OSCAL");
  await expect(page.locator(".resource-card").first()).toBeVisible();

  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page);
  await expect(page.locator(".atlas-tree")).toHaveAttribute("data-tree-node-count", "13");
  await expect(page.getByRole("heading", { name: "Cybersecurity", exact: true })).toBeVisible();
  await page
    .locator('.react-flow__node:has([data-atlas-node-id="atlas:LIMB-COMPLIANCE"])')
    .dispatchEvent("click");
  await expect(page).toHaveURL(/#\/atlas$/);
  await expect(page.getByRole("heading", { name: "Compliance", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open this area", exact: true }).click();
  await expect(page).toHaveURL(/atlasLimb=atlas%3ALIMB-COMPLIANCE/);
});

test("live smoke: compare hub loads", async ({ page }) => {
  await gotoApp(page, "/#/compare");
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

test("live smoke: deployed artifact matches the expected commit", async ({
  request,
}) => {
  const expectedSha = process.env.EXPECTED_DEPLOY_SHA;
  test.skip(!expectedSha, "exact deployment SHA check only runs after Pages deploys");
  expect(expectedSha).toMatch(/^[0-9a-f]{40}$/i);
  const response = await request.get(
    new URL("release.json", process.env.PLAYWRIGHT_BASE_URL).toString(),
  );
  expect(response.ok()).toBeTruthy();
  const release = await response.json();
  expect(release).toEqual({ schema_version: "1.0", commit_sha: expectedSha });
});
