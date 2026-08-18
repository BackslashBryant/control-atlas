import { expect, test } from '@playwright/test';
import {
  attachPageDiagnostics,
  dismissOnboarding,
  gotoApp,
  waitForAppReady,
} from './support.mjs';

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('header height, brand width, and primary navigation positions remain stable across brand rotations', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, '/');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const header = page.locator('.site-header');
  const brand = page.locator('.brand');
  const activeKey = page.locator('.brand-key--active');
  const navLinks = page.locator('.primary-nav a');

  await expect(header).toBeVisible();
  await expect(brand).toBeVisible();
  await expect(activeKey).toBeVisible();

  const navLinkCount = await navLinks.count();
  expect(navLinkCount).toBeGreaterThan(0);

  // Sample the geometry of the header, brand, active keycap, and navigation links
  // across multiple rotations to verify zero layout jitter.
  const sampleCount = 20;
  const headerHeights = [];
  const brandWidths = [];
  const activeKeyWidths = [];
  const navPositions = [];
  const wordsSeen = new Set();

  for (let i = 0; i < sampleCount; i++) {
    const wordText = (await activeKey.locator('.brand-key-word').textContent())?.trim() || '';
    wordsSeen.add(wordText);

    const headerBox = await header.boundingBox();
    const brandBox = await brand.boundingBox();
    const activeKeyBox = await activeKey.boundingBox();

    if (headerBox) headerHeights.push(headerBox.height);
    if (brandBox) brandWidths.push(brandBox.width);
    if (activeKeyBox) activeKeyWidths.push(activeKeyBox.width);

    const currentNavX = [];
    for (let j = 0; j < navLinkCount; j++) {
      const box = await navLinks.nth(j).boundingBox();
      if (box) currentNavX.push(box.x);
    }
    navPositions.push(currentNavX);

    // Sample across ticks
    await page.waitForTimeout(600);
  }

  // Verify header height stability
  const minHeaderHeight = Math.min(...headerHeights);
  const maxHeaderHeight = Math.max(...headerHeights);
  expect(
    maxHeaderHeight - minHeaderHeight,
    `Header height must remain constant (min: ${minHeaderHeight}, max: ${maxHeaderHeight})`,
  ).toBeLessThanOrEqual(0.5);

  // Verify brand lockup width stability
  const minBrandWidth = Math.min(...brandWidths);
  const maxBrandWidth = Math.max(...brandWidths);
  expect(
    maxBrandWidth - minBrandWidth,
    `Brand width must remain constant across words (min: ${minBrandWidth}, max: ${maxBrandWidth})`,
  ).toBeLessThanOrEqual(0.5);

  // Verify active keycap width stability
  const minKeyWidth = Math.min(...activeKeyWidths);
  const maxKeyWidth = Math.max(...activeKeyWidths);
  expect(
    maxKeyWidth - minKeyWidth,
    `Active keycap width must remain reserved and constant (min: ${minKeyWidth}, max: ${maxKeyWidth})`,
  ).toBeLessThanOrEqual(0.5);

  // Verify navigation link X positions are stable
  for (let j = 0; j < navLinkCount; j++) {
    const xCoords = navPositions.map((pos) => pos[j]).filter((x) => x !== undefined);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    expect(
      maxX - minX,
      `Nav link ${j} X coordinate must remain constant without horizontal jitter (min: ${minX}, max: ${maxX})`,
    ).toBeLessThanOrEqual(0.5);
  }
});

test('prefers-reduced-motion halts brand flourish rotation and avoids animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, '/');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const activeKey = page.locator('.brand-key--active .brand-key-word');
  await expect(activeKey).toBeVisible();
  const initialWord = (await activeKey.textContent())?.trim();
  expect(initialWord).toBe('Explore');

  // Wait 3 seconds and ensure word does not change under reduced motion
  await page.waitForTimeout(3000);
  const currentWord = (await activeKey.textContent())?.trim();
  expect(currentWord).toBe('Explore');
});

test('mobile navigation sheet manages focus, Escape key, and toggle button return', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoApp(page, '/');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const toggle = page.getByRole('button', { name: 'Open navigation menu' });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  // Open mobile menu
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeVisible();
  const sheet = page.locator('.mobile-nav-sheet');
  await expect(sheet).toBeVisible();

  // Verify first link receives focus
  const firstLink = sheet.locator('nav a[href]').first();
  await expect(firstLink).toBeFocused();

  // Press Escape to close
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  const closedToggle = page.getByRole('button', { name: 'Open navigation menu' });
  await expect(closedToggle).toBeVisible();
  await expect(closedToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(closedToggle).toBeFocused();
});

test('desktop overflow menu manages focus, Escape key, and toggle button return', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page, '/');
  await waitForAppReady(page);
  await dismissOnboarding(page);

  const overflowToggle = page.getByRole('button', { name: 'Open more pages' });
  await expect(overflowToggle).toBeVisible();
  await expect(overflowToggle).toHaveAttribute('aria-expanded', 'false');

  // Open overflow menu
  await overflowToggle.click();
  await expect(page.getByRole('button', { name: 'Close more pages' })).toBeVisible();
  const menu = page.locator('.overflow-nav-menu');
  await expect(menu).toBeVisible();

  // Verify first link in menu receives focus
  const firstLink = menu.locator('nav a[href]').first();
  await expect(firstLink).toBeFocused();

  // Press Escape to close
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  const closedToggle = page.getByRole('button', { name: 'Open more pages' });
  await expect(closedToggle).toBeVisible();
  await expect(closedToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(closedToggle).toBeFocused();
});
