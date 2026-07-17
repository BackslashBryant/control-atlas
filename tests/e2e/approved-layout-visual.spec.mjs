import { expect, test } from '@playwright/test';

import {
  attachPageDiagnostics,
  dismissOnboarding,
  waitForAppReady,
} from './support.mjs';

const FOCUSED_ATLAS = '/#/atlas-map?node=nist-800-53%3AAC-2';
const VIEWPORTS = {
  desktop: { width: 1440, height: 1000 },
  compact: { width: 390, height: 844 },
};

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
  await waitForAppReady(page);
  await dismissOnboarding(page);
  await page.evaluate(() => globalThis.document.fonts.ready);

  const main = page.locator('main.atlas-focused-main');
  await expect(main).toBeVisible();
  if (relationshipView === 'map') {
    await expect(main.locator('.atlas-spatial-map')).toBeVisible();
    await expect(
      page.getByRole('complementary', { name: 'Selected record' }),
    ).toBeVisible();
  } else {
    await expect(main.locator('.atlas-decomposition-stage')).toHaveCount(6);
    await expect(
      page.getByRole('complementary', { name: 'Selected path' }),
    ).toBeVisible();
  }
  return main;
}

for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
  for (const relationshipView of ['map', 'purpose']) {
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
}
