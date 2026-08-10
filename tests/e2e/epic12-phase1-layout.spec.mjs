import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

const ROUTES = [
  "/#/",
  "/#/explore",
  "/#/catalog",
  "/#/search?q=access+control",
  "/#/record/fips-200/AC",
  "/#/compare",
  "/#/learn",
  "/#/build",
  "/#/sources",
  "/#/about",
  "/#/start",
];

const VIEWPORTS = [
  { label: "desktop", width: 1440, height: 900 },
  { label: "laptop", width: 1024, height: 768 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "mobile", width: 375, height: 812 },
];

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const viewport of VIEWPORTS) {
  test(`Epic 12 Phase 1 keeps chrome and content ordered at ${viewport.label}`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const route of ROUTES) {
      await test.step(route, async () => {
        await gotoApp(page, route);
        await waitForAppReady(page, { allowPartial: true });

        await expect(page.locator(".static-route-shell")).toHaveCount(0);
        await expect(page.locator("#workspace h1")).toHaveCount(1, {
          timeout: 15_000,
        });
        if (route !== "/#/") {
          await expect(
            page.locator("#workspace [data-route-primary-header]"),
          ).toHaveCount(1, { timeout: 15_000 });
        }
        const pageHeaderHeight = route === "/#/"
          ? null
          : await page
              .locator("#workspace [data-route-primary-header]")
              .evaluate((element) => element.getBoundingClientRect().height);

        const layout = await page.evaluate(() => {
          const header = globalThis.document.querySelector("header.site-header");
          const firstHeading = globalThis.document.querySelector("#workspace h1");
          const appShell = globalThis.document.querySelector("#app");
          const appBox = appShell?.getBoundingClientRect();
          const outOfBounds = appBox
            ? [...appShell.querySelectorAll("*")]
                .filter((element) => {
                  const box = element.getBoundingClientRect();
                  const style = globalThis.getComputedStyle(element);
                  return (
                    style.display !== "none" &&
                    style.visibility !== "hidden" &&
                    box.width > 0 &&
                    (box.right > appBox.right + 2 || box.left < appBox.left - 2)
                  );
                })
                .map((element) => {
                  const box = element.getBoundingClientRect();
                  return {
                    className: element.className || "",
                    left: box.left,
                    right: box.right,
                    tagName: element.tagName,
                    text: element.textContent?.trim().slice(0, 80) || "",
                  };
                })
                .slice(0, 10)
            : [];
          const overflows = [...globalThis.document.querySelectorAll("body *")]
            .filter((element) => {
              // React Flow's transformed coordinate plane is intentionally
              // wider than its clipped viewport. Phase 7 keeps page bounds
              // protected by .atlas-tree__stage; the plane itself is not
              // document overflow.
              if (element.matches(".react-flow__viewport, .react-flow__nodes")) {
                return false;
              }
              const style = globalThis.getComputedStyle(element);
              return (
                element.clientWidth > 100 &&
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                element.scrollWidth > element.clientWidth + 2
              );
            })
            .map((element) => ({
              className: element.className || "",
              clientWidth: element.clientWidth,
              id: element.id || "",
              parentClassName: element.parentElement?.className || "",
              scrollWidth: element.scrollWidth,
              tagName: element.tagName,
              text: element.textContent?.trim().slice(0, 80) || "",
            }));

          return {
            firstHeadingY: firstHeading?.getBoundingClientRect().y ?? null,
            headerCount: globalThis.document.querySelectorAll("header.site-header").length,
            headerY: header?.getBoundingClientRect().y ?? null,
            landmarkCounts: {
              footer: globalThis.document.querySelectorAll("footer").length,
              h1: globalThis.document.querySelectorAll("h1").length,
              main: globalThis.document.querySelectorAll("main").length,
              skipLink: globalThis.document.querySelectorAll(".skip-link").length,
            },
            outOfBounds,
            overflows,
          };
        });

        expect(layout.headerCount, `${route} header count`).toBe(1);
        expect(layout.headerY, `${route} header y`).toBe(0);
        expect(layout.landmarkCounts, `${route} landmark counts`).toEqual({
          footer: 1,
          h1: 1,
          main: 1,
          skipLink: 1,
        });
        expect(
          layout.firstHeadingY,
          `${route} first meaningful content y`,
        ).not.toBeNull();
        expect(layout.firstHeadingY).toBeLessThan(viewport.width === 375 ? 480 : 400);
        if (route !== "/#/") {
          expect(pageHeaderHeight, `${route} compact title strip`).not.toBeNull();
          expect(pageHeaderHeight).toBeLessThanOrEqual(64);
        }
        expect(
          layout.overflows,
          `${route} overflowing elements; out of bounds: ${JSON.stringify(layout.outOfBounds)}`,
        ).toEqual([]);
      });
    }
  });
}

test("Epic 12 Phase 1 puts record content in payoff-first order", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, "/#/record/fips-200/AC");
  await waitForAppReady(page, { allowPartial: true });
  await expect(page.locator("[data-record-section]")).toHaveCount(5, {
    timeout: 15_000,
  });

  const positions = await page.evaluate(() =>
    ["official-text", "source-freshness", "hierarchy", "connections", "advanced"].map(
      (section) => ({
        section,
        y:
          globalThis.document
            .querySelector(`[data-record-section="${section}"]`)
            ?.getBoundingClientRect().y ?? null,
      }),
    ),
  );

  expect(positions.every(({ y }) => y !== null), JSON.stringify(positions)).toBe(true);
  expect(
    positions.map(({ y }) => y),
    JSON.stringify(positions),
  ).toEqual([...positions.map(({ y }) => y)].sort((a, b) => a - b));
});
