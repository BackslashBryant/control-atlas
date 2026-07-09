import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

const ROUTES = [
  "/",
  "/?view=start-here",
  "/?view=atlas-map",
  "/?view=explore&q=AC-2",
  "/?view=library-detail&node=nist-800-53%3AAC-2",
  "/?view=matrix",
  "/?view=playbooks",
  "/?view=templates",
  "/?view=sources",
  "/?view=about",
];

const VIEWPORTS = [
  { label: "mobile", width: 390, height: 844 },
  { label: "tablet", width: 768, height: 1024 },
];

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

for (const viewport of VIEWPORTS) {
  test(`responsive audit: shipped routes fit the ${viewport.label} viewport`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    for (const route of ROUTES) {
      await gotoApp(page, route);
      await waitForAppReady(page);
      await dismissOnboarding(page);
      await expect(page.locator("main h1").first(), route).toBeVisible();

      const overflow = await page.evaluate(() => ({
        body:
          globalThis.document.body.scrollWidth -
          globalThis.document.body.clientWidth,
        document:
          globalThis.document.documentElement.scrollWidth -
          globalThis.document.documentElement.clientWidth,
      }));
      expect(
        overflow,
        `${route} must not create document-level horizontal overflow`,
      ).toEqual({ body: 0, document: 0 });
    }
  });
}
