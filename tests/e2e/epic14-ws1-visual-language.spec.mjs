import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("WS1 Home uses governed dimension galaxies weighted by source-backed record count", async ({ page }) => {
  await gotoApp(page, "/#/");
  await waitForAppReady(page, { allowPartial: true });

  const tagLinks = page.locator(".home-tag-galaxies .home-tag-link");
  await expect(page.locator(".home-tag-galaxy")).toHaveCount(6);
  await expect(tagLinks).toHaveCount(16);
  await expect(page.locator(".home-ecosystem-authorities, .home-ecosystem")).toHaveCount(0);

  const styles = await tagLinks.evaluateAll((tags) => tags.map((tag) => {
    return {
      count: Number(tag.getAttribute("data-record-count")),
      fontSize: Number.parseFloat(globalThis.getComputedStyle(tag).fontSize),
      label: tag.textContent?.trim() || "",
    };
  }));

  const highest = [...styles].sort((left, right) => right.count - left.count)[0];
  const lowest = [...styles].sort((left, right) => left.count - right.count)[0];
  expect(highest.count).toBe(5694);
  expect(lowest.count).toBe(520);
  expect(highest.fontSize).toBeGreaterThan(lowest.fontSize);
  expect(styles.every((entry) => entry.label.length > 0)).toBe(true);
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

test("WS1 Atlas spends the full area palette on its nine branch nodes", async ({ page }) => {
  test.setTimeout(120_000);
  await gotoApp(page, "/#/atlas?relationshipView=path");
  await waitForAppReady(page, { allowPartial: true });

  const tree = page.locator('.atlas-tree[data-layout-status="ready"]');
  await expect(tree).toBeVisible({ timeout: 60_000 });
  const areaNodes = tree.locator(".atlas-tree-node--area");
  await expect.poll(async () => {
    const styles = await areaNodes.evaluateAll((nodes) => nodes.map((node) => ({
      area: node.getAttribute("data-area-id"),
      background: globalThis.getComputedStyle(node).backgroundColor,
      border: globalThis.getComputedStyle(node).borderColor,
      borderStyle: globalThis.getComputedStyle(node).borderStyle,
      empty: node.classList.contains("is-empty"),
      hue: globalThis.getComputedStyle(node).getPropertyValue("--ca-area-color").trim(),
    })));
    const populatedStyles = styles.filter((entry) => !entry.empty);
    const emptyStyles = styles.filter((entry) => entry.empty);
    return {
      areas: new Set(styles.map((entry) => entry.area).filter(Boolean)).size,
      backgrounds: new Set(styles.map((entry) => entry.background)).size,
      hues: new Set(styles.map((entry) => entry.hue)).size,
      distinctPopulatedBorders: new Set(populatedStyles.map((entry) => entry.border)).size,
      populatedCount: populatedStyles.length,
      emptyCount: emptyStyles.length,
      emptyBordersDashed: emptyStyles.every((entry) => entry.borderStyle === "dashed"),
    };
  }).toEqual({
    areas: 9,
    backgrounds: 9,
    hues: 9,
    distinctPopulatedBorders: 7,
    populatedCount: 7,
    emptyCount: 2,
    emptyBordersDashed: true,
  });
});
