import { expect, test } from "@playwright/test";

import {
  attachPageDiagnostics,
  gotoApp,
  waitForAppReady,
} from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("WS5 Home implements Template B with one search, three cards, and nine area links", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/");
  await waitForAppReady(page, { allowPartial: true });

  const template = page.locator('[data-template="B"]');
  await expect(template).toBeVisible();
  await expect(template.locator(".home-hero")).toHaveCount(1);
  await expect(template.locator(".home-search")).toHaveCount(1);
  await expect(template.locator(".home-secondary-action")).toHaveCount(3);
  await expect(template.locator(".home-secondary-action strong")).toHaveText([
    "Browse the Atlas",
    "Search the Library",
    "Browse Resources",
  ]);
  await expect(template.getByRole("heading", { name: "Make federal cybersecurity compliance make sense.", level: 1 })).toBeVisible();
  await expect(template.getByText("Understand what applies, what it means, and what to do next.", { exact: true })).toBeVisible();
  await expect(template.getByText(/publisher|provenance|mapping/i)).toHaveCount(0);
  await expect(template.locator(".home-ecosystem, .home-primary-actions")).toHaveCount(0);
  await expect(template.getByText("Start with your work", { exact: true })).toHaveCount(0);

  const areaLinks = template.getByRole("navigation", { name: "Browse by area" }).getByRole("link");
  await expect(areaLinks).toHaveCount(9);
  await expect(template.locator(".home-ecosystem-areas .bucket-tag__dot")).toHaveCount(9);
  const hrefs = await areaLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(hrefs.every((href) => href?.startsWith("#/library?area="))).toBe(true);

  const accentColors = await template.locator(".home-secondary-action").evaluateAll((cards) => (
    cards.map((card) => globalThis.getComputedStyle(card, "::before").backgroundColor)
  ));
  expect(new Set(accentColors).size).toBe(1);
});

test("WS6 About states the research boundary exactly", async ({ page }) => {
  await gotoApp(page, "/#/about");
  await waitForAppReady(page);
  await expect(page.locator("main").getByText(
    "Control Atlas is a public research tool for federal cybersecurity requirements, controls, techniques, and guidance.",
    { exact: true },
  )).toBeVisible();
  await expect(page.locator("main").getByText(
    "Use Control Atlas for research, not compliance or authorization decisions.",
    { exact: true },
  )).toBeVisible();
});

test("WS5 Guides implements a numbered, icon-bearing, whole-card Template F directory", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoApp(page, "/#/guides");
  await waitForAppReady(page);

  const template = page.locator('[data-template="F"]');
  await expect(template).toBeVisible();
  await expect(template.getByRole("heading", { name: "Guides", level: 1 })).toBeVisible();

  const cards = template.locator("a.guide-card");
  await expect(cards).toHaveCount(12);
  await expect(cards.locator(".guide-card__icon svg")).toHaveCount(12);
  await expect(cards.locator(".bucket-tag__dot")).toHaveCount(12);
  await expect(cards.locator(".guide-card__step")).toHaveText(
    Array.from({ length: 12 }, (_, index) => `Step ${String(index + 1).padStart(2, "0")}`),
  );

  const iconShapes = await cards.locator(".guide-card__icon svg").evaluateAll((icons) => (
    icons.map((icon) => icon.innerHTML)
  ));
  expect(new Set(iconShapes).size).toBe(12);

  const firstCard = cards.first();
  const firstTitle = await firstCard.locator("strong").innerText();
  await firstCard.click();
  await expect(page).toHaveURL(/#\/guides\?pattern=starting-an-authorization/);
  await expect(page.getByRole("heading", { name: firstTitle, level: 1 })).toBeVisible();
});

test("WS5 Home and Guides stack without horizontal overflow below 640 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of ["/", "/#/guides"]) {
    await gotoApp(page, path);
    await waitForAppReady(page, { allowPartial: true });
    await expect(page.evaluate(() => (
      globalThis.document.documentElement.scrollWidth <= globalThis.document.documentElement.clientWidth
    ))).resolves.toBe(true);
  }

  const cards = page.locator("a.guide-card");
  await expect(cards).toHaveCount(12);
  const firstLeft = await cards.first().evaluate((card) => card.getBoundingClientRect().left);
  const secondLeft = await cards.nth(1).evaluate((card) => card.getBoundingClientRect().left);
  expect(Math.abs(firstLeft - secondLeft)).toBeLessThanOrEqual(1);
});
