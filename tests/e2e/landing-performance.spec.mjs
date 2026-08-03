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
    page.getByRole("heading", {
      name: /Federal cyber guidance is scattered/,
    }),
  ).toBeVisible();

  await expect(page.getByRole("search").first()).toBeVisible();
  // The brand keycap lives in the persistent header, which Home now shares.
  await expect(page.locator(".site-header .brand-kbd")).toBeVisible();
  // Pinned to the shape, not the literal: the word list is product copy and
  // has been trimmed before. src/shared/brand-rotation.ts owns the order.
  await expect(page.locator("[data-brand-word]")).toHaveText(/^[A-Z][a-z]+$/);
  await expect(page.getByRole("button", { name: /Follow implementation/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Compare guidance/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Start a document/ })).toBeVisible();
  await expect(page.locator(".home-secondary-action")).toHaveCount(3);
  // Home proves the claim with one real published chain.
  await expect(page.locator(".home-chain-subject")).toHaveText(
    "AC-2 Account Management",
  );

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

  await page.getByRole("button", { name: /^Browse the Library$/ }).click();
  await waitForAppReady(page);
  await expect(page).toHaveURL(/#\/catalog/);

  await page.goBack();
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", {
      name: /Federal cyber guidance is scattered/,
    }),
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
    page.getByRole("heading", { name: "Library", level: 1 }).first(),
  ).toBeVisible({
    timeout: 90000,
  });

  await page
    .getByRole("button", { name: "Control Atlas — home" })
    .first()
    .click({ force: true });
  await expect(
    page.getByRole("heading", {
      name: /Federal cyber guidance is scattered/,
    }),
  ).toBeVisible({
    timeout: 15000,
  });
  // "Novice" is retired product vocabulary; it must not return anywhere.
  await expect(page.getByText(/novice/i)).toHaveCount(0);
  await expect(page.getByText("Expert Mode")).toHaveCount(0);
});
