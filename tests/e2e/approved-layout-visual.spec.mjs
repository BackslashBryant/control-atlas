import { expect, test } from '@playwright/test';

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
  waitForSkeletonsSettled,
} from './support.mjs';

const FOCUSED_ATLAS = '/#/explore?node=nist-800-53%3AAC-2';
const VIEWPORTS = {
  desktop: { width: 1440, height: 1000 },
  compact: { width: 390, height: 844 },
};
const ROUTE_COMPOSITIONS = [
  { slug: 'home', path: '/#/' },
  { slug: 'guided-start', path: '/#/start' },
  { slug: 'search', path: '/#/search?q=AC-2' },
  { slug: 'catalog', path: '/#/catalog' },
  { slug: 'record', path: '/#/record/nist-800-53/AC-2' },
  { slug: 'compare', path: '/#/compare' },
  { slug: 'resources', path: '/#/resources?lane=official' },
  {
    slug: 'resource-detail',
    path: '/#/resources/official-nist-sp800-53-r5',
  },
  { slug: 'learn', path: '/#/learn' },
  { slug: 'documents', path: '/#/build/documents' },
  { slug: 'sources', path: '/#/sources' },
  { slug: 'about', path: '/#/about' },
];

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function openApprovedComposition(page, viewport, relationshipView) {
  await page.setViewportSize(viewport);
  await page.goto(`${FOCUSED_ATLAS}&relationshipView=${relationshipView}`);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
  await waitForAppReady(page, { allowPartial: true });
  await dismissOnboarding(page);
  await page.evaluate(() => globalThis.document.fonts.ready);

  const main = page.locator('.atlas-focused-main');
  await expect(main).toBeVisible();
  if (relationshipView === 'map') {
    await expect(
      main.getByRole('region', { name: 'Relationship map' }),
    ).toBeVisible();
    // The map paints once from the neighborhood shard and again once every
    // counterpart label resolves, so screenshotting on first paint captured
    // one of two stable layouts at random. Wait for the traffic to stop and
    // the box to settle before the comparison.
    await page.waitForLoadState('networkidle');
    await expect
      .poll(async () => {
        const box = await main
          .getByRole('region', { name: 'Relationship map' })
          .boundingBox();
        return Math.round(box?.height ?? 0);
      })
      .toBeGreaterThan(0);
    await expect(
      page.getByRole('complementary', { name: 'Current record overview' }),
    ).toBeVisible();
  } else {
    // Re-baselined 2026-08-01 for the Cybersecurity trunk spine. A focused
    // record's Path is its structural position — the chain from the trunk down
    // to this record — rather than the retired stage board. The guarantee is
    // unchanged: the Path shows where you are and where you can go, and never
    // dumps a grid of records.
    await expect(
      page.getByRole('navigation', { name: 'Where this sits' }),
    ).toBeVisible();
    await expect(main.locator('.atlas-path-record')).toHaveCount(0);
  }
  return main;
}

async function openRouteComposition(page, viewport, path) {
  await page.setViewportSize(viewport);
  await page.goto(path);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
  // A route screenshot is evidence of its loaded composition. `partial` only
  // proves that search is available; Documents and Sources still render their
  // loading notice until the graph arrives.
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await waitForSkeletonsSettled(page);
  await page.evaluate(() => globalThis.document.fonts.ready);
  await expect(page.locator('#workspace')).toBeVisible();
  // App-ready fires before the heaviest routes have laid their content out, so
  // whichever route lost the race was screenshotted at viewport height instead
  // of its full composition. Wait for the workspace box to stop growing.
  await page.waitForLoadState('networkidle');
  let lastHeight = -1;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const height = await page
      .locator('#workspace')
      .evaluate((element) => Math.round(element.getBoundingClientRect().height));
    if (height === lastHeight) break;
    lastHeight = height;
    await page.waitForTimeout(250);
  }
  return page.locator('#workspace');
}

for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
  for (const relationshipView of ['map', 'path']) {
    test(`${viewportName} approved ${relationshipView} composition`, async ({ page }) => {
      const main = await openApprovedComposition(
        page,
        viewport,
        relationshipView,
      );
      await expect(main).toHaveScreenshot(
        `atlas-${viewportName}-${relationshipView}.png`,
        {
          animations: 'disabled',
          caret: 'hide',
          scale: 'css',
          // The relationship map lays its nodes out programmatically and
          // settles on one of a couple of near-identical arrangements, which
          // moved ~2% of pixels between otherwise identical runs. The budget
          // sits just above that jitter so the snapshot still catches real
          // changes — colour, type, spacing, a missing panel — without
          // failing on node positions.
          ...(relationshipView === 'map'
            ? { maxDiffPixelRatio: 0.035 }
            : {}),
        },
      );
    });
  }

  for (const route of ROUTE_COMPOSITIONS) {
    test(`${viewportName} ${route.slug} composition`, async ({ page }) => {
      const workspace = await openRouteComposition(
        page,
        viewport,
        route.path,
      );
      await expect(workspace).toHaveScreenshot(
        `route-${route.slug}-${viewportName}.png`,
        {
          animations: 'disabled',
          caret: 'hide',
          scale: 'css',
        },
      );
    });
  }
}
