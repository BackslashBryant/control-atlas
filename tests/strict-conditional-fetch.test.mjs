import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createStrictConditionalFetch } from '../scripts/lib/strict-conditional-fetch.mjs';

async function startServer(handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    server,
    url: `http://127.0.0.1:${address.port}/source`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

test('strict refresh revalidates unchanged bytes with ETag instead of downloading them again', async () => {
  const cachePath = mkdtempSync(join(tmpdir(), 'control-atlas-http-cache-'));
  let requests = 0;
  let transferredBytes = 0;
  let conditionalHeader = '';
  const body = 'publisher bytes';
  const fixture = await startServer((request, response) => {
    requests += 1;
    conditionalHeader = request.headers['if-none-match'] || conditionalHeader;
    if (request.headers['if-none-match'] === '"source-v1"') {
      response.writeHead(304, { etag: '"source-v1"', 'cache-control': 'max-age=0, must-revalidate' });
      response.end();
      return;
    }
    transferredBytes += Buffer.byteLength(body);
    response.writeHead(200, {
      'content-type': 'text/plain',
      'cache-control': 'max-age=0, must-revalidate',
      etag: '"source-v1"',
    });
    response.end(body);
  });

  try {
    const fetchSource = createStrictConditionalFetch({ cachePath });
    assert.equal(await (await fetchSource(fixture.url, { noProxy: '127.0.0.1' })).text(), body);
    const revalidated = await fetchSource(fixture.url, { noProxy: '127.0.0.1' });
    assert.equal(await revalidated.text(), body);
    assert.equal(revalidated.headers.get('x-local-cache-status'), 'revalidated');
    assert.equal(requests, 2);
    assert.equal(conditionalHeader, '"source-v1"');
    assert.equal(transferredBytes, Buffer.byteLength(body));
  } finally {
    await fixture.close();
    rmSync(cachePath, { recursive: true, force: true });
  }
});

test('strict refresh rejects automatic stale-cache fallback when the publisher is unavailable', async () => {
  const cachePath = mkdtempSync(join(tmpdir(), 'control-atlas-http-cache-'));
  const fixture = await startServer((_request, response) => {
    response.writeHead(200, { 'cache-control': 'max-age=0', etag: '"source-v1"' });
    response.end('publisher bytes');
  });
  const fetchSource = createStrictConditionalFetch({ cachePath });

  try {
    await (await fetchSource(fixture.url, { noProxy: '127.0.0.1' })).text();
    await fixture.close();
    await assert.rejects(
      fetchSource(fixture.url, { noProxy: '127.0.0.1' }),
      /strict refresh rejected stale cached bytes/,
    );
  } finally {
    if (fixture.server.listening) await fixture.close();
    rmSync(cachePath, { recursive: true, force: true });
  }
});

test('strict refresh revalidates with Last-Modified when ETag is unavailable', async () => {
  const cachePath = mkdtempSync(join(tmpdir(), 'control-atlas-http-cache-'));
  let conditionalHeader = '';
  let transferredBytes = 0;
  const body = 'publisher bytes';
  const modified = 'Wed, 02 Sep 2026 03:00:00 GMT';
  const fixture = await startServer((request, response) => {
    conditionalHeader = request.headers['if-modified-since'] || conditionalHeader;
    if (request.headers['if-modified-since'] === modified) {
      response.writeHead(304, { 'last-modified': modified, 'cache-control': 'max-age=0, must-revalidate' });
      response.end();
      return;
    }
    transferredBytes += Buffer.byteLength(body);
    response.writeHead(200, {
      'content-type': 'text/plain',
      'cache-control': 'max-age=0, must-revalidate',
      'last-modified': modified,
    });
    response.end(body);
  });

  try {
    const fetchSource = createStrictConditionalFetch({ cachePath });
    assert.equal(await (await fetchSource(fixture.url, { noProxy: '127.0.0.1' })).text(), body);
    const revalidated = await fetchSource(fixture.url, { noProxy: '127.0.0.1' });
    assert.equal(await revalidated.text(), body);
    assert.equal(revalidated.headers.get('x-local-cache-status'), 'revalidated');
    assert.equal(conditionalHeader, modified);
    assert.equal(transferredBytes, Buffer.byteLength(body));
  } finally {
    await fixture.close();
    rmSync(cachePath, { recursive: true, force: true });
  }
});

test('strict refresh accepts changed bytes returned with a new validator', async () => {
  const cachePath = mkdtempSync(join(tmpdir(), 'control-atlas-http-cache-'));
  let version = 1;
  const fixture = await startServer((_request, response) => {
    const body = `publisher bytes v${version}`;
    response.writeHead(200, {
      'content-type': 'text/plain',
      'cache-control': 'max-age=0, must-revalidate',
      etag: `"source-v${version}"`,
    });
    response.end(body);
  });

  try {
    const fetchSource = createStrictConditionalFetch({ cachePath });
    assert.equal(await (await fetchSource(fixture.url, { noProxy: '127.0.0.1' })).text(), 'publisher bytes v1');
    version = 2;
    assert.equal(await (await fetchSource(fixture.url, { noProxy: '127.0.0.1' })).text(), 'publisher bytes v2');
  } finally {
    await fixture.close();
    rmSync(cachePath, { recursive: true, force: true });
  }
});

test('strict refresh makes a fresh request when the publisher provides no validators', async () => {
  const cachePath = mkdtempSync(join(tmpdir(), 'control-atlas-http-cache-'));
  let requests = 0;
  let conditionalHeaders = 0;
  const fixture = await startServer((request, response) => {
    requests += 1;
    if (request.headers['if-none-match'] || request.headers['if-modified-since']) conditionalHeaders += 1;
    response.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
    response.end('publisher bytes');
  });

  try {
    const fetchSource = createStrictConditionalFetch({ cachePath });
    await (await fetchSource(fixture.url, { noProxy: '127.0.0.1' })).text();
    await (await fetchSource(fixture.url, { noProxy: '127.0.0.1' })).text();
    assert.equal(requests, 2);
    assert.equal(conditionalHeaders, 0);
  } finally {
    await fixture.close();
    rmSync(cachePath, { recursive: true, force: true });
  }
});

test('strict refresh rejects a bare 304 without cached publisher bytes', async () => {
  const cachePath = mkdtempSync(join(tmpdir(), 'control-atlas-http-cache-'));
  const fixture = await startServer((_request, response) => {
    response.writeHead(304, { etag: '"source-v1"' });
    response.end();
  });

  try {
    const fetchSource = createStrictConditionalFetch({ cachePath });
    await assert.rejects(
      fetchSource(fixture.url, { noProxy: '127.0.0.1' }),
      /304 without reusable cached bytes/,
    );
  } finally {
    await fixture.close();
    rmSync(cachePath, { recursive: true, force: true });
  }
});
