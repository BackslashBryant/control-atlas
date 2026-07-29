import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

const ROUTE_GROUPS = [
  {
    label: "entry and guidance",
    routes: [
      "/#/",
      "/#/start",
      "/#/search?q=AC-2",
      "/#/explore",
      "/#/explore?node=nist-800-53%3AAC-2&relationshipView=path",
      "/#/explore?node=nist-800-53%3AAC-2&relationshipView=map",
      "/#/explore?node=nist-800-53%3AAC-2&relationshipView=list",
    ],
  },
  {
    label: "catalog and records",
    routes: [
      "/#/catalog",
      "/#/catalog/nist-800-53",
      "/#/record/nist-800-53/AC-2",
    ],
  },
  {
    label: "build and resources",
    routes: [
      "/#/build",
      "/#/build/documents",
      "/#/build/documents/security_plan_starter",
      "/#/build/resources",
      "/#/build/resources/official-nist-sp800-53-r5",
    ],
  },
  {
    label: "workbenches and trust",
    routes: [
      "/#/compare",
      "/#/learn",
      "/#/sources",
      "/#/about",
      "/#/does-not-exist",
    ],
  },
];

const VIEWPORTS = [
  { label: "mobile", width: 375, height: 812 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "desktop", width: 1440, height: 900 },
];

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

for (const viewport of VIEWPORTS) {
  for (const group of ROUTE_GROUPS) {
    test(`responsive audit: ${group.label} fit the ${viewport.label} viewport`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000);
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      for (const route of group.routes) {
        try {
          await test.step(route, async () => {
            await gotoApp(page, route);
            await waitForAppReady(page);
            await dismissOnboarding(page);
            await expect(page.locator("main h1, main h2").first(), route).toBeVisible();

            if (route === "/#/") {
              const search = page.getByRole("search");
              const flourish = page.locator(".home-entry .brand-key-word");
              await expect(search).toBeVisible();
              await expect(flourish).toBeVisible();
              expect(
                (await search.boundingBox())?.y,
                "Home Search must start inside the first viewport",
              ).toBeLessThan(viewport.height);
            }

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
          });
        } catch (error) {
          await testInfo.attach("route-group-failure.json", {
            body: Buffer.from(JSON.stringify({
              group: group.label,
              route,
              viewport,
              url: page.url(),
              title: await page.title(),
            }, null, 2)),
            contentType: "application/json",
          });
          throw error;
        }
      }
    });
  }
}
