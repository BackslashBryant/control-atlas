import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { attachPageDiagnostics, dismissOnboarding, waitForAppReady } from './support.mjs';

const ROUTES = [
  '/',
  '/?view=search&q=AC-2',
  '/?view=library-detail&node=nist-800-53%3AAC-2',
  '/?view=matrix',
  '/?view=sources',
  '/?view=templates',
  '/?view=templates&templateType=security_plan_starter',
  '/?view=patterns',
  '/?view=start-here',
];

test.beforeEach(async ({ page }) => {
  attachPageDiagnostics(page);
});

test('primary translation-first surfaces have no serious or critical accessibility violations', async ({ page }) => {
  test.setTimeout(120000);
  for (const route of ROUTES) {
    await page.goto(route);
    await waitForAppReady(page);
    await dismissOnboarding(page);

    const results = await new AxeBuilder({ page })
      .include('#workspace')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const blocking = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact || ''),
    );

    expect(
      blocking,
      `Accessibility violations on ${route}: ${blocking.map((entry) => `${entry.id} (${entry.impact})`).join(', ')}`,
    ).toEqual([]);
  }
});
