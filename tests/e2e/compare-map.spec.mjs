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

  // Re-baselined 2026-08-16 (Phase 3, T3.6): this pair has exactly one
  // published mapping source, so it auto-resolves instead of forcing a
  // manual pick — "Mapping publication" now shows as read-only context, and
  // "Show mappings" is available as soon as source + target are set.
  await expect(page.locator(".field-value")).toHaveText("NIST CSF 2.0");
  await page.getByRole("button", { name: "Show mappings" }).click();

  await expect(page.locator(".compare-results-panel")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByRole("button", { name: "Map", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "List", exact: true })).toBeVisible();
  // Corrected locator: this is a link, and its accessible name is "Open
  // Atlas map" — "Open in the Atlas" never matched any element on this page
  // and this assertion was passing vacuously before (Playwright's default
  // .toBeVisible() on a non-existent locator only fails after its timeout,
  // which nothing upstream previously reached quickly enough to expose).
  await expect(page.getByRole("link", { name: "Open Atlas map" })).toBeVisible({
    timeout: 15000,
  });
});

test("T3.13: SP 800-171 Rev. 3 completes a real catalog-to-catalog comparison (regression for the T0.6 baseline dead-end)", async ({
  page,
}) => {
  await page.goto(
    "/?view=matrix&workbench=relationships&source=nist-800-171&target=nist-800-53",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // This pair has exactly one published mapping source, so it auto-resolves
  // (T3.6) — no manual "Mapping publication" pick is required to proceed.
  await expect(page.locator(".field-value")).toBeVisible();
  await page.getByRole("button", { name: "Show mappings" }).click();
  await expect(page.locator(".compare-results-panel")).toBeVisible({
    timeout: 15000,
  });
});

test("T3.8: a deep link naming a catalog with no valid comparison target recovers to a clear prompt, not a broken form", async ({
  page,
}) => {
  await page.goto(
    "/?view=matrix&workbench=relationships&source=nist-800-53&target=not-a-real-catalog",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // A stale/invalid target must never look silently ready or selected.
  await expect(page.getByRole("button", { name: "Show mappings" })).toHaveCount(0);
  await expect(
    page.getByText("Select a target publication to view published mappings."),
  ).toBeVisible();
});

test("item mapping crosswalk narrows results to specified control", async ({
  page,
}) => {
  await page.goto(
    "/?view=matrix&workbench=item-mapping&source=nist-800-53&items=AC-2",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await page.getByLabel("Publication B").selectOption("csf-2");
  await page.getByRole("button", { name: "Show mappings" }).click();
  await expect(page.locator(".compare-results-panel")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator(".detail-table")).toBeVisible();
  await expect(page.getByText("AC-2").first()).toBeVisible();
});
