import process from 'node:process';

export default async function playwrightGlobalTeardown() {
  const port = process.env.PLAYWRIGHT_PORT ?? '4317';
  try {
    await fetch(`http://localhost:${port}/__control-atlas-test-shutdown`, {
      method: 'POST',
      signal: AbortSignal.timeout(2_000),
    });
  } catch {
    // The test server may already have stopped after an early failure.
  }
}
