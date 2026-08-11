import { expect, test } from "@playwright/test";

import { attachPageDiagnostics, gotoApp, waitForAppReady } from "./support.mjs";

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("WS1 Home uses neutral bucket tags with nine labelled area dots", async ({ page }) => {
  await gotoApp(page, "/#/");
  await waitForAppReady(page, { allowPartial: true });

  const bucketTags = page.locator(".home-ecosystem-areas .bucket-tag");
  const lineTags = page.locator(".home-ecosystem-authorities .line-tag");
  await expect(bucketTags).toHaveCount(9);
  await expect(lineTags).toHaveCount(3);

  const styles = await bucketTags.evaluateAll((tags) => tags.map((tag) => {
    const dot = tag.querySelector(".bucket-tag__dot");
    return {
      area: tag.getAttribute("data-area-id"),
      background: globalThis.getComputedStyle(tag).backgroundColor,
      dot: dot ? globalThis.getComputedStyle(dot).backgroundColor : "",
      label: tag.textContent?.trim() || "",
    };
  }));

  expect(new Set(styles.map((entry) => entry.area)).size).toBe(9);
  expect(new Set(styles.map((entry) => entry.background)).size).toBe(1);
  expect(new Set(styles.map((entry) => entry.dot)).size).toBe(9);
  expect(styles.every((entry) => entry.label.length > 0)).toBe(true);
  expect(styles.every((entry) => entry.background !== entry.dot)).toBe(true);
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
  await gotoApp(page, "/#/atlas");
  await waitForAppReady(page, { allowPartial: true });

  const tree = page.locator('.atlas-tree[data-layout-status="ready"]');
  await expect(tree).toBeVisible({ timeout: 60_000 });
  const areaNodes = tree.locator(".atlas-tree-node--area");
  await expect.poll(
    () => areaNodes.evaluateAll((nodes) => new Set(nodes.map((node) => node.getAttribute("data-area-id")).filter(Boolean)).size),
  ).toBe(9);
  const styles = await areaNodes.evaluateAll((nodes) => nodes.map((node) => ({
    area: node.getAttribute("data-area-id"),
    background: globalThis.getComputedStyle(node).backgroundColor,
    border: globalThis.getComputedStyle(node).borderColor,
    borderStyle: globalThis.getComputedStyle(node).borderStyle,
    empty: node.classList.contains("is-empty"),
    hue: globalThis.getComputedStyle(node).getPropertyValue("--ca-area-color").trim(),
  })));

  expect(new Set(styles.map((entry) => entry.area)).size).toBe(9);
  expect(new Set(styles.map((entry) => entry.background)).size).toBe(9);
  expect(new Set(styles.map((entry) => entry.hue)).size).toBe(9);
  const populatedStyles = styles.filter((entry) => !entry.empty);
  const emptyStyles = styles.filter((entry) => entry.empty);
  expect(new Set(populatedStyles.map((entry) => entry.border)).size).toBe(populatedStyles.length);
  expect(emptyStyles).toHaveLength(2);
  expect(emptyStyles.every((entry) => entry.borderStyle === "dashed")).toBe(true);
});
