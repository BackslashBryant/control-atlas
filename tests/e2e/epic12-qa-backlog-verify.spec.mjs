import { expect, test } from '@playwright/test';

// Regression guard for the epic-12 QA backlog fixes (2026-08-10):
// B1/B2 default browse + map, B3 tools reachability, B5/B6 landing,
// B9/B10/B11 search polish, B13 no page overflow, B14 select label, B16 links.

test('B1: Library opens with a non-empty, browsable result set', async ({ page }) => {
  await page.goto('/#/library');
  await expect(page.locator('#library-results .search-result-row').first()).toBeVisible({ timeout: 15000 });
  expect(await page.locator('#library-results .search-result-row').count()).toBeGreaterThan(0);
  expect(await page.locator('#library-results a[href]').count()).toBeGreaterThan(0);
  expect(await page.locator('.search-result-count').innerText()).toMatch(/[0-9]/);
  await expect(page.locator('.empty-state')).toHaveCount(0);
});

test('B1: filters narrow the default set', async ({ page }) => {
  await page.goto('/#/library?q=access+control');
  await expect(page.locator('#library-results .search-result-row').first()).toBeVisible({ timeout: 15000 });
  const narrowed = Number((await page.locator('.search-result-count').innerText()).replace(/[^0-9]/g, ''));
  await page.goto('/#/library');
  await expect(page.locator('#library-results .search-result-row').first()).toBeVisible({ timeout: 15000 });
  const full = Number((await page.locator('.search-result-count').innerText()).replace(/[^0-9]/g, ''));
  expect(full).toBeGreaterThan(narrowed);
});

test('B2: the Atlas map toggle renders nodes while the corpus is non-empty', async ({ page }) => {
  await page.goto('/#/library?view=map');
  await expect(page.locator('.library-atlas-map')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.library-map-node').first()).toBeVisible({ timeout: 20000 });
  expect(await page.locator('.library-map-node').count()).toBeGreaterThan(0);
  expect(Number(await page.locator('.library-atlas-map').getAttribute('data-map-node-count'))).toBeGreaterThan(0);
});

test('B3: Tools & communities is reachable from home in <=2 clicks', async ({ page }) => {
  await page.goto('/#/');
  const direct = page.locator('a[href*="kind=tools-communities"]');
  await expect(direct.first()).toBeVisible();
  await direct.first().click();
  await expect(page).toHaveURL(/kind=tools-communities/);
  await expect(page.locator('#library-results .search-result-row, .search-result-row').first()).toBeVisible({ timeout: 15000 });
});

test('B4: the Atlas map is reachable from home in one click', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.locator('a[href*="/atlas"]').first()).toBeVisible();
});

test('B5: the hero has no reserved-but-empty second column', async ({ page }) => {
  await page.goto('/#/');
  const hero = page.locator('.home-hero');
  await expect(hero).toBeVisible();
  const tracks = await hero.evaluate((el) => {
    const cols = getComputedStyle(el).gridTemplateColumns.trim();
    return cols === 'none' ? [] : cols.split(/\s+/);
  });
  expect(tracks.length).toBeLessThanOrEqual(1);
  expect(await hero.evaluate((el) => el.children.length)).toBe(1);
});

test('B6: the entrances grid leaves no empty slot (centred flex-wrap, uniform cards)', async ({ page }) => {
  await page.goto('/#/');
  const grid = page.locator('.home-secondary-grid');
  await expect(grid).toBeVisible();
  const info = await grid.evaluate((el) => {
    const cs = getComputedStyle(el);
    const kids = /** @type {HTMLElement[]} */ ([...el.children]);
    return {
      display: cs.display,
      justifyContent: cs.justifyContent,
      first: kids[0].getBoundingClientRect().width,
      last: kids[kids.length - 1].getBoundingClientRect().width,
    };
  });
  expect(info.display).toBe('flex');
  expect(info.justifyContent).toBe('center');
  expect(Math.abs(info.last - info.first)).toBeLessThanOrEqual(2);
});

test('B9: overlay result descriptions clamp within their rows', async ({ page }) => {
  await page.goto('/#/');
  await page.keyboard.press('Control+k');
  await expect(page.locator('.search-overlay')).toBeVisible({ timeout: 10000 });
  await page.locator('#global-search-query').fill('control');
  await expect(page.locator('.search-overlay-result').first()).toBeVisible({ timeout: 10000 });
  const overflow = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.search-overlay-result'));
    return rows.filter((r) => r.scrollHeight > r.clientHeight + 1).length;
  });
  expect(overflow).toBe(0);
});

test('B10: overlay header has one clear and one close affordance, distinct', async ({ page }) => {
  await page.goto('/#/');
  await page.keyboard.press('Control+k');
  await expect(page.locator('.search-overlay')).toBeVisible({ timeout: 10000 });
  await page.locator('#global-search-query').fill('access');
  const header = page.locator('.search-overlay-header');
  await expect(header.getByLabel('Clear search')).toHaveCount(1);
  await expect(header.getByLabel('Close search')).toHaveCount(1);
  // The submit control must not be a second visible dismiss affordance.
  await expect(header.locator('button[type="submit"]')).toHaveClass(/visually-hidden/);
});

test('B11: the in-page Library search input sits symmetrically in its box', async ({ page }) => {
  await page.goto('/#/library?q=access');
  await page.locator('.catalog-search.search-results-query input').first().waitFor({ timeout: 15000 });
  const diff = await page.evaluate(() => {
    const box = document.querySelector('.catalog-search.search-results-query');
    const input = box.querySelector('input');
    const b = box.getBoundingClientRect();
    const i = input.getBoundingClientRect();
    return Math.round((i.left - b.left) - (b.right - i.right));
  });
  expect(Math.abs(diff)).toBeLessThanOrEqual(2);
});

test('B13: the Atlas page does not overflow horizontally at the document level', async ({ page }) => {
  await page.goto('/#/atlas');
  await page.waitForTimeout(2500);
  const { scrollW, clientW } = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  expect(scrollW).toBeLessThanOrEqual(clientW + 2);
});

test('B14: every Library select exposes a non-empty accessible name', async ({ page }) => {
  await page.goto('/#/library?q=access');
  await expect(page.locator('#library-results .search-result-row').first()).toBeVisible({ timeout: 15000 });
  const unnamed = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.filter((s) => {
      const aria = (s.getAttribute('aria-label') || '').trim();
      const labelled = s.id && document.querySelector(`label[for="${s.id}"]`);
      return !aria && !labelled;
    }).length;
  });
  expect(unnamed).toBe(0);
});

test('B16: the Compare intent screen offers a real link', async ({ page }) => {
  await page.goto('/#/compare');
  await expect(page.locator('.compare-mode-tabs').first()).toBeVisible({ timeout: 15000 });
  expect(await page.locator('main a[href]').count()).toBeGreaterThan(0);
});
