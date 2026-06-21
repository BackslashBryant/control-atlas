import { expect, test } from "@playwright/test";
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("relationship compare exposes map and list toggles with summary", async ({
  page,
}) => {
  await page.goto(
    "/?view=matrix&workbench=relationships&source=nist-800-53&target=csf-2",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "Review results" }).click();
  await expect(page.locator(".compare-results-panel")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByRole("button", { name: "Map", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "List", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open in Atlas Map" })).toBeVisible();
});

test("baseline compare map toggle renders compare map panel", async ({ page }) => {
  await page.goto("/?view=matrix&workbench=baseline-compare");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel("Baseline A").selectOption("nist-800-53b:LOW");
  await page.getByLabel("Baseline B").selectOption("nist-800-53b:MODERATE");
  await expect(page.locator(".compare-results-panel")).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Compare map", level: 3 })).toBeVisible();
});

test("stig chain compare shows map unavailable before item selection", async ({
  page,
}) => {
  await page.goto("/?view=matrix&workbench=stig-chain");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByRole("button", { name: "View mapping trace" }).first().click();
  await expect(page.locator(".compare-results-panel")).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Compare map", level: 3 })).toBeVisible({
    timeout: 15000,
  });
});

test("threat chain compare map works after selecting a technique", async ({
  page,
}) => {
  await page.goto(
    "/?view=matrix&workbench=threat-chain&chainCatalog=mitre-attack&chainItem=T1033",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(page.locator(".compare-results-panel")).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Compare map", level: 3 })).toBeVisible({
    timeout: 15000,
  });
});
