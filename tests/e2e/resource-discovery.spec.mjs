import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.setViewportSize({ width: 1600, height: 900 });
});

test("Resources is reachable from utility navigation and global search reaches communities", async ({
  page,
}) => {
  await gotoApp(page, "/#/catalog");
  await waitForAppReady(page);

  // Resources holds external tools/templates/communities outside the Atlas
  // hierarchy, so it lives in utility navigation, not the five primary
  // destinations (Atlas/Library/Compare/Guides/Documents).
  const utilityNav = page.getByRole("navigation", {
    name: "Utility navigation",
  });
  await expect(
    utilityNav.getByRole("button", { name: "Resources", exact: true }),
  ).toBeVisible();

  await utilityNav
    .getByRole("button", { name: "Resources", exact: true })
    .click();
  await waitForAppReady(page);
  const resourceFilters = page.getByRole("region", {
    name: "Resource filters",
  });
  await expect(resourceFilters).toBeHidden();
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(resourceFilters).toBeVisible();

  await page.getByRole("button", { name: "Open search" }).click();
  const search = page.getByRole("searchbox", {
    name: "Search Control Atlas",
  });
  await search.fill("NISTControls");
  await expect(page.getByText(/Communities \(\d+\)/)).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Reddit /r/NISTControls Practitioner Community",
      exact: true,
    }),
  ).toBeVisible();

  await search.press("Enter");
  await waitForAppReady(page);
  await expect(page).toHaveURL(/#\/search\?q=NISTControls/);
  await expect(
    page.getByRole("button", { name: /Communities \(\d+\)/ }),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "Reddit /r/NISTControls Practitioner Community",
      exact: true,
    })
    .click();
  await waitForAppReady(page);
  await expect(page).toHaveURL(
    /#\/resources\/community-reddit-nistcontrols\?from=search/,
  );
  await expect(
    utilityNav.getByRole("button", { name: "Resources", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("former Build-nested Resources URLs recover to the top-level route", async ({
  page,
}) => {
  await gotoApp(
    page,
    "/#/build/resources/community-reddit-fedramp?from=templates",
  );
  await waitForAppReady(page);
  await expect(page).toHaveURL(
    /#\/resources\/community-reddit-fedramp\?from=templates/,
  );
  await expect(
    page.getByRole("button", { name: "Back to Resources" }),
  ).toBeVisible();
});
