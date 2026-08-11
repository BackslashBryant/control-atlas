import { expect, test } from '@playwright/test';

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
  waitForSkeletonsSettled,
} from './support.mjs';

const ATLAS_STATES = {
  overview: '/#/atlas',
  branch: '/#/atlas?atlasAxis=framework&atlasLimb=atlas%3ALIMB-COMPLIANCE&atlasFramework=nist-800-53',
};
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
  { slug: 'resources', path: '/#/resources' },
  {
    slug: 'resource-detail',
    path: '/#/resources/official-nist-oscal',
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

async function openApprovedAtlas(page, viewport, state) {
  await page.setViewportSize(viewport);
  await page.goto(ATLAS_STATES[state]);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
      .site-header {
        position: static !important;
      }
    `,
  });
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.evaluate(() => globalThis.document.fonts.ready);

  const template = page.locator('[data-page-template="canvas"]');
  await expect(template).toBeVisible();
  await expect(template.locator('.atlas-tree')).toHaveAttribute('data-layout-status', 'ready');
  if (viewport.width >= 1024) {
    await expect(
      template.getByRole('application', { name: 'Interactive Atlas map hierarchy' }),
    ).toBeVisible();
  } else {
    await expect(
      template.getByRole('tree', { name: 'Atlas map hierarchy' }),
    ).toBeVisible();
  }
  if (state === 'branch') {
    await expect(
      template.getByRole('navigation', { name: 'Atlas breadcrumb' }),
    ).toContainText('SP 800-53 Rev. 5 Catalog');
  }
  return template;
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
      .site-header {
        position: static !important;
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
  for (const state of Object.keys(ATLAS_STATES)) {
    test(`${viewportName} approved Atlas ${state} composition`, async ({ page }) => {
      const template = await openApprovedAtlas(
        page,
        viewport,
        state,
      );
      await expect(template).toHaveScreenshot(
        `atlas-${viewportName}-${state}.png`,
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
