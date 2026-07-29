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
    await expect(
      page.getByRole('complementary', { name: 'Current record overview' }),
    ).toBeVisible();
  } else {
    // The six-column board is retired: the Path asks which stage first, so
    // all six stages are offered as choices and no records are dumped.
    await expect(main.locator('.atlas-path-stage-option')).toHaveCount(7);
    await expect(
      page.getByRole('complementary', { name: 'Selected path' }),
    ).toBeVisible();
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
