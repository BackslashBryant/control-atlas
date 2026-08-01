import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("landing presents search first, the rotating brand item, and exactly three other entrances", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", { name: "Control Atlas", exact: true }),
  ).toBeVisible();

  await expect(page.getByRole("search")).toBeVisible();
  await expect(page.locator(".home-entry .brand-kbd")).toBeVisible();
  // Pinned to the shape, not the literal: the word list is product copy and
  // has been trimmed before. src/shared/brand-rotation.ts owns the order.
  await expect(page.locator("[data-brand-word]")).toHaveText(/^[A-Z][a-z]+$/);
  await expect(page.getByRole("button", { name: /Open the Atlas/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Browse Catalog/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Find Tools & Resources/ })).toBeVisible();
  await expect(page.locator(".home-secondary-action")).toHaveCount(3);

  const urlBeforeSkip = page.url();
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#workspace")).toBeFocused();
  expect(page.url()).toBe(urlBeforeSkip);
});

test("protected Ctrl+Alt slogan rotates and native Home history remains coherent", async ({
  page,
}) => {
  await page.goto("/");
  await waitForAppReady(page);

  const firstWord = await page.locator("[data-brand-word]").textContent();
  await expect
    .poll(() => page.locator("[data-brand-word]").textContent(), {
      timeout: 15000,
    })
    .not.toBe(firstWord);

  await page.getByRole("button", { name: /Browse Catalog/ }).click();
  await waitForAppReady(page);
  await expect(page).toHaveURL(/#\/catalog/);

  await page.goBack();
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", { name: "Control Atlas", exact: true }),
  ).toBeVisible();

  await page.goForward();
  await waitForAppReady(page);
  await expect(page).toHaveURL(/#\/catalog/);
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
