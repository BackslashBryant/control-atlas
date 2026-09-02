import assert from 'node:assert/strict';
import test from 'node:test';
import { retrieveStructuredOlirArtifact } from '../tools/relationship-builders/olir-retrieval.mjs';

test('GitHub blob XLSX is retrieved through the Contents API without a HEAD page probe', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    if (String(url).startsWith('https://api.github.com/repos/example/mapping/contents/OLIR.xlsx')) {
      return Response.json({
        type: 'file', name: 'OLIR.xlsx', path: 'OLIR.xlsx',
        download_url: 'https://raw.githubusercontent.com/example/mapping/main/OLIR.xlsx',
      });
    }
    if (String(url).startsWith('https://raw.githubusercontent.com/example/mapping/main/OLIR.xlsx')) {
      return new Response(Buffer.from([0x50, 0x4b, 0x03, 0x04]), {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    }
    throw new Error(`unexpected URL: ${url}`);
  };
  try {
    const result = await retrieveStructuredOlirArtifact(
      ['https://github.com/example/mapping/blob/main/OLIR.xlsx'],
      { fetchImpl: globalThis.fetch },
    );
    assert.ok(result.artifact, 'the GitHub XLSX must be downloaded, not quarantined');
    assert.equal(result.artifact.url, 'https://raw.githubusercontent.com/example/mapping/main/OLIR.xlsx');
    assert.equal(result.artifact.bytes.length, 4);
    assert.ok(calls.some((call) => call.url.includes('api.github.com/repos/example/mapping/contents/OLIR.xlsx')));
    assert.ok(calls.every((call) => call.method === 'GET'), 'a GitHub blob page HEAD request is not an artifact test');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('public Google Sheets submission resolves through its deterministic XLSX export', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), 'https://docs.google.com/spreadsheets/d/public-sheet/export?format=xlsx');
    return new Response(Buffer.from([0x50, 0x4b, 0x03, 0x04]), { status: 200, headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } });
  };
  try {
    const result = await retrieveStructuredOlirArtifact(
      ['https://docs.google.com/spreadsheets/d/public-sheet/edit'],
      { fetchImpl: globalThis.fetch },
    );
    assert.equal(result.artifact?.url, 'https://docs.google.com/spreadsheets/d/public-sheet/export?format=xlsx');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
