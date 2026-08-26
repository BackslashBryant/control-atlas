import { expect, test } from '@playwright/test';

async function openStableWorkspace(page, route, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`/${route}`);
  await expect(page.locator('#workspace')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.addStyleTag({
    content: `
      .brand-key-word { visibility: hidden !important; }
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
}

test('resource directory desktop composition', async ({ page }) => {
  await openStableWorkspace(page, '#/resources', { width: 1440, height: 1000 });
  await expect(page.getByRole('heading', { name: 'Browse by Collection' })).toBeVisible();
  await expect(page.locator('#workspace')).toHaveScreenshot('resources-desktop.png');
});

test('source register desktop composition', async ({ page }) => {
  await openStableWorkspace(page, '#/sources', { width: 1440, height: 1000 });
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await page.locator('.source-title-link').first().click();

  const register = page.locator('.sources-table-panel');
  const evidence = page.locator('.sources-inspector-pane');
  await expect(register).toBeVisible();
  await expect(evidence).toBeVisible();

  const [registerBox, evidenceBox, viewportMetrics] = await Promise.all([
    register.boundingBox(),
    evidence.boundingBox(),
    page.evaluate(() => ({
      clientWidth: globalThis.document.documentElement.clientWidth,
      scrollWidth: globalThis.document.documentElement.scrollWidth,
    })),
  ]);

  expect(registerBox, 'the publication register needs a measurable desktop region').not.toBeNull();
  expect(evidenceBox, 'the selected-publication evidence panel needs a measurable desktop region').not.toBeNull();
  expect(registerBox.width, 'the publication register should remain the primary reading surface').toBeGreaterThan(
    evidenceBox.width * 1.75,
  );
  expect(
    evidenceBox.x - (registerBox.x + registerBox.width),
    'the two reading surfaces need a visible gutter',
  ).toBeGreaterThanOrEqual(16);
  expect(
    evidenceBox.x + evidenceBox.width,
    'the evidence panel must stay inside the viewport',
  ).toBeLessThanOrEqual(viewportMetrics.clientWidth);
  expect(viewportMetrics.scrollWidth, 'the desktop composition must not clip horizontally').toBe(
    viewportMetrics.clientWidth,
  );
});

test('resource directory mobile composition', async ({ page }) => {
  await openStableWorkspace(page, '#/resources?showAll=true', { width: 390, height: 844 });
  await expect(page.locator('.workspace-result-list')).toBeVisible();
  await expect(page).toHaveScreenshot('resources-mobile.png', { fullPage: false });
});
