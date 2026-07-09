import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("legacy library-detail query shim resolves to record route", async ({
  page,
}) => {
  test.setTimeout(120000);
  await gotoApp(page, "/?view=library-detail&node=nist-800-53%3AAC-2");
  await waitForAppReady(page);
  await expect(page).toHaveURL(/library-detail|record\/nist-800-53/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/AC-2/i);
});
