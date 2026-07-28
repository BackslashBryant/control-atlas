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
      "/#/menu",
      "/#/start",
      "/#/explore",
      "/#/explore?node=nist-800-53%3AAC-2&relationshipView=path",
      "/#/explore?node=nist-800-53%3AAC-2&relationshipView=map",
      "/#/explore?node=nist-800-53%3AAC-2&relationshipView=list",
      "/#/explore?node=csf-2%3ADE.AE-01&relationshipView=map",
      "/?view=explore&q=AC-2",
    ],
  },
  {
    label: "catalog and records",
    routes: [
      "/#/library",
      "/#/library/nist-800-53",
      "/#/record/nist-800-53/AC-2",
      "/?view=library-detail&node=nist-800-53%3AAC-2",
    ],
  },
  {
    label: "build and resources",
    routes: [
      "/#/build/resources",
      "/#/build/resources/official-nist-sp800-53-r5",
      "/?view=templates",
    ],
  },
  {
    label: "workbenches and trust",
    routes: [
      "/?view=matrix",
      "/?view=playbooks",
      "/?view=sources",
      "/?view=about",
      "/#/retired?q=old-control",
      "/#/does-not-exist",
    ],
  },
];

const VIEWPORTS = [
  { label: "mobile", width: 390, height: 844 },
  { label: "tablet", width: 768, height: 1024 },
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
