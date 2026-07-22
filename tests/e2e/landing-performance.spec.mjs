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

  await expect(page.getByRole("button", { name: "Find where to start" })).toBeVisible();
  await expect(page.getByText("Other ways to use Control Atlas")).toBeVisible();
});

test("landing search and brand-home flow work without legacy onboarding surfaces", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/?view=explore");
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", {
      name: "Search everything in one place",
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
