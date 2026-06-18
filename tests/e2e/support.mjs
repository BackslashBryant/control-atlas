import { expect } from '@playwright/test';

function emitDiagnostic(event, detail) {
  console.log(`[pw-diag] ${event}: ${detail}`);
}

export function attachPageDiagnostics(page) {
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      emitDiagnostic(`console.${message.type()}`, message.text());
    }
  });
  page.on('pageerror', (error) => {
    emitDiagnostic('pageerror', error.stack || error.message);
  });
  page.on('requestfailed', (request) => {
    emitDiagnostic(
      'requestfailed',
      `${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown failure'}`,
    );
  });
  page.on('response', async (response) => {
    const url = response.url();
    const isRuntimeDependency = url.includes('/data/generated/') || url.endsWith('.mjs');
    if (!isRuntimeDependency) return;
    if (response.ok()) {
      emitDiagnostic('response', `${response.status()} ${url}`);
      return;
    }
    let bodyPreview = '';
    try {
      bodyPreview = (await response.text()).slice(0, 400);
    } catch {
      bodyPreview = '<response body unavailable>';
    }
    emitDiagnostic('response.error', `${response.status()} ${url} :: ${bodyPreview}`);
  });
}

export async function dismissOnboarding(page) {
  const skipOnboarding = page.getByRole('button', { name: 'Skip', exact: true });
  if (await skipOnboarding.isVisible()) {
    await skipOnboarding.click();
  }
}

export async function waitForAppReady(page) {
  try {
    await expect(page.locator('#app')).toHaveAttribute('data-app-ready', 'true', { timeout: 60000 });
  } catch (error) {
    const startupSnapshot = await page.evaluate(() => {
      const app = document.querySelector('#app');
      return {
        href: location.href,
        ready: app?.getAttribute('data-app-ready') || '<missing>',
        busy: app?.getAttribute('aria-busy') || '<missing>',
        text: app?.textContent?.trim().slice(0, 400) || '',
        html: app?.innerHTML?.slice(0, 800) || '',
      };
    });
    emitDiagnostic('startup.snapshot', JSON.stringify(startupSnapshot));
    throw error;
  }
}
