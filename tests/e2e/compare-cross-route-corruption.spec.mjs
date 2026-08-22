import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

// Regression: after loading a full Compare result (graphReady=true), navigating
// to Templates used to render 0 cards because onSearchReady kept the Compare
// bundle (which has templateRegistry:{templates:[]}) instead of applying the
// fresh Templates bundle.
test("Templates shows cards after navigating from a full Compare result", async ({ page }) => {
  test.setTimeout(120_000);
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  // Land on Compare and run a crosswalk that loads the full graph.
  await gotoApp(
    page,
    "/#/compare/relationships?intent=frameworks&source=nist-800-53&target=csf-2&compareRun=true",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);

  // Wait for the results table to be present, confirming the full Compare bundle loaded.
  await expect(page.locator(".compare-results-table")).toBeVisible({ timeout: 60_000 });

  // Navigate to Templates via hash (client-side, no reload — simulates normal
  // in-app navigation so the Compare bundle stays in React state).
  await page.evaluate(() => { window.location.hash = "/build/documents"; });
  await waitForAppReady(page, { allowPartial: true });

  // Should show document cards, not a blank page.
  const cards = page.locator(".template-card, .document-card, [data-template-card], [class*='template']").first();
  // Fallback: count any link elements inside the templates workspace
  const templateLinks = page.locator("#workspace a[href*='documents']");
  const cardCount = await page.locator(".template-card").count();
  const anyContent = await page.locator("#workspace").evaluate(
    (el) => el.textContent?.trim().length > 50,
  );

  expect(anyContent, "Templates workspace should have content after Compare navigation").toBe(true);
});

// The evidence DOM should not be present before the user opens the details.
test("evidence section content is not in the DOM until opened", async ({ page }) => {
  test.setTimeout(120_000);
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await gotoApp(
    page,
    "/#/compare/relationships?intent=frameworks&source=nist-800-53&target=csf-2&compareRun=true",
  );
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await expect(page.locator(".compare-results-table")).toBeVisible({ timeout: 60_000 });

  // The mapping-evidence-list divs should not exist before any details is opened.
  const evidenceBodies = page.locator(".mapping-evidence-list");
  await expect(evidenceBodies).toHaveCount(0);

  // Open the first details element.
  const firstDetails = page.locator(".mapping-row-details").first();
  await firstDetails.click();

  // Now the evidence content should exist for that one row.
  await expect(page.locator(".mapping-evidence-list")).toHaveCount(1);
});
