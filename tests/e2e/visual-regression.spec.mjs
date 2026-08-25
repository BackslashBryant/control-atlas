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
  await expect(page.locator('#workspace')).toHaveScreenshot('sources-desktop.png');
});

test('resource directory mobile composition', async ({ page }) => {
  await openStableWorkspace(page, '#/resources?showAll=true', { width: 390, height: 844 });
  await expect(page.locator('.workspace-result-list')).toBeVisible();
  await expect(page.locator('#workspace')).toHaveScreenshot('resources-mobile.png');
});
