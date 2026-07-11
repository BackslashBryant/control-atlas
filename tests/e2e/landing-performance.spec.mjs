import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("landing presents the map-first hero and primary entry paths", async ({
  page,
}) => {
  await page.goto("/");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", { name: "Control Atlas", exact: true }),
  ).toBeVisible();

  // The landing page directly presents the primary intent paths
  await expect(
    page.getByRole("button", { name: /^click to start$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Research/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Navigate/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Build/ })).toBeVisible();
});

test("landing search and brand-home flow work without legacy onboarding surfaces", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/?view=explore");
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", {
      name: "Explore the control landscape",
      level: 1,
    }),
  ).toBeVisible({
    timeout: 90000,
  });

  await page.locator(".site-header button.brand").click({ force: true });
  await expect(
    page.getByRole("heading", { name: "Control Atlas", exact: true }),
  ).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("Novice Mode")).toHaveCount(0);
  await expect(page.getByText("Expert Mode")).toHaveCount(0);
});
