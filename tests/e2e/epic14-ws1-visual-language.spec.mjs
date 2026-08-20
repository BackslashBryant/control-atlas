import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("WS1 Home uses six canonical Library discovery metrics", async ({ page }) => {
  await gotoApp(page, "/#/");
  await waitForAppReady(page, { allowPartial: true });

  const discoveryLinks = page.locator(".home-library-kpis .home-library-kpi");
  await expect(discoveryLinks).toHaveCount(6);
  await expect(page.locator(".home-ecosystem-authorities, .home-ecosystem")).toHaveCount(0);

  const metrics = await discoveryLinks.evaluateAll((links) => links.map((link) => {
    return {
      href: link.getAttribute("href") || "",
      count: link.querySelector("strong")?.textContent?.trim() || "",
      label: link.querySelector("span > b")?.textContent?.trim() || "",
    };
  }));

  expect(metrics.every((entry) => /^\d[\d,]*$/.test(entry.count))).toBe(true);
  expect(metrics.every((entry) => entry.href.startsWith("#/library?") && entry.label.length > 0)).toBe(true);
});

test("WS1 decorative surfaces resolve to one teal accent", async ({ page }) => {
  await gotoApp(page, "/#/");
  await waitForAppReady(page, { allowPartial: true });

  const aliases = await page.evaluate(() => {
    const style = globalThis.getComputedStyle(globalThis.document.documentElement);
    return [
      "--ca-accent",
      "--ca-primary",
      "--ca-secondary",
      "--ca-link",
      "--ca-priority",
      "--ca-editorial",
      "--ca-info",
    ].map((token) => style.getPropertyValue(token).trim());
  });
  expect(new Set(aliases).size).toBe(1);

  const cardAccentColors = await page.locator(".home-secondary-action").evaluateAll(
    (cards) => cards.map((card) => globalThis.getComputedStyle(card, "::before").backgroundColor),
  );
  expect(cardAccentColors.length).toBeGreaterThan(0);
  expect(new Set(cardAccentColors).size).toBe(1);
});

test("WS1 Atlas exposes nine governed areas through the semantic landscape", async ({ page }) => {
  test.setTimeout(120_000);
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page, { allowPartial: true });

  const network = page.getByTestId("atlas-network");
  await expect(network).toBeVisible({ timeout: 60_000 });
  await expect(network).toHaveClass(/atlas-network--semantic/);
  await expect(network).toHaveAttribute("data-projection-level", "landscape");
  await expect(network.getByRole("button", { name: /Area ·/ })).toHaveCount(9);

  const areaTokens = await page.evaluate(() => {
    const style = globalThis.getComputedStyle(globalThis.document.documentElement);
    return [
      "--ca-area-governance",
      "--ca-area-risk",
      "--ca-area-compliance",
      "--ca-area-architecture",
      "--ca-area-implementation",
      "--ca-area-assessment",
      "--ca-area-operations",
      "--ca-area-threats-defense",
      "--ca-area-knowledge",
    ].map((token) => style.getPropertyValue(token).trim());
  });
  expect(areaTokens.every(Boolean)).toBe(true);
  expect(new Set(areaTokens).size).toBe(9);
});
