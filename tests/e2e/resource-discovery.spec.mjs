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

test("Resources is reachable from primary navigation and global search reaches communities", async ({
  page,
}) => {
  await gotoApp(page, "/#/library");
  await waitForAppReady(page);

  // Resources is a first-class destination for external tools, services, and
  // practitioner communities outside the Library publication corpus.
  const primaryNav = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await expect(
    primaryNav.getByRole("link", { name: "Resources", exact: true }),
  ).toBeVisible();

  await primaryNav
    .getByRole("link", { name: "Resources", exact: true })
    .click();
  await waitForAppReady(page);
  const resourceFilters = page.getByRole("complementary", { name: "Resource filters" });
  await expect(resourceFilters).toBeVisible();

  await page.getByRole("button", { name: "Open search" }).click();
  const search = page.getByRole("searchbox", {
    name: "Search Control Atlas",
  });
  await search.fill("NISTControls");
  await expect(page.getByText(/Communities \(\d+\)/)).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Reddit /r/NISTControls Practitioner Community",
      exact: true,
    }),
  ).toBeVisible();

  await page.getByRole("link", {
    name: "Reddit /r/NISTControls Practitioner Community",
    exact: true,
  }).click();
  await waitForAppReady(page);
  await expect(page).toHaveURL(
    /#\/resources\/community-reddit-nistcontrols$/,
  );
  await expect(
    primaryNav.getByRole("link", { name: "Resources", exact: true }),
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
    /#\/resources\/community-reddit-fedramp$/,
  );
  await expect(
    page.getByRole("link", { name: "Back" }),
  ).toBeVisible();
});
