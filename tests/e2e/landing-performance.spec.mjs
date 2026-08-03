import { expect, test } from "@playwright/test";
import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test("landing presents universal search, task entrances, and real capability previews", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForAppReady(page);
  await dismissOnboarding(page);

  await expect(
    page.getByRole("heading", {
      name: /Find the source\. See what connects/,
    }),
  ).toBeVisible();

  await expect(page.getByRole("search").first()).toBeVisible();
  // The brand keycap lives in the persistent header, which Home now shares.
  await expect(page.locator(".site-header .brand-kbd")).toBeVisible();
  // Pinned to the shape, not the literal: the word list is product copy and
  // has been trimmed before. src/shared/brand-rotation.ts owns the order.
  await expect(page.locator("[data-brand-word]")).toHaveText(/^[A-Z][a-z]+$/);
  await expect(page.getByRole("button", { name: /Understand a requirement/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Operate or defend/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Produce a document/ })).toBeVisible();
  await expect(page.locator(".home-secondary-action")).toHaveCount(7);
  await expect(page.locator(".home-capability-preview")).toHaveCount(3);

  const urlBeforeSkip = page.url();
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#workspace")).toBeFocused();
  expect(page.url()).toBe(urlBeforeSkip);
});

test("the local release server mirrors production compression for built styles", async ({
  request,
}) => {
  const home = await request.get("/", {
    headers: { "Accept-Encoding": "gzip" },
  });
  const stylesheet = (await home.text()).match(/href="\.\/(assets\/[^"]+\.css)"/)?.[1];
  expect(stylesheet).toBeTruthy();

  const response = await request.get(`/${stylesheet}`, {
    headers: { "Accept-Encoding": "gzip" },
  });
  expect(response.headers()["content-encoding"]).toBe("gzip");
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

  await page.getByRole("button", { name: /^Browse official publications$/ }).click();
  await waitForAppReady(page);
  await expect(page).toHaveURL(/#\/catalog/);

  await page.goBack();
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", {
      name: /Find the source\. See what connects/,
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
      name: /Find the source\. See what connects/,
    }),
  ).toBeVisible({
    timeout: 15000,
  });
  // "Novice" is retired product vocabulary; it must not return anywhere.
  await expect(page.getByText(/novice/i)).toHaveCount(0);
  await expect(page.getByText("Expert Mode")).toHaveCount(0);
});
