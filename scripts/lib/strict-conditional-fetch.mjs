import { join } from 'node:path';

import makeFetchHappen from 'make-fetch-happen';

const DEFAULT_CACHE_PATH = join(process.cwd(), '.local', 'http-cache-v1');

export function createStrictConditionalFetch(options = {}) {
  const cachePath = options.cachePath || process.env.CONTROL_ATLAS_HTTP_CACHE || DEFAULT_CACHE_PATH;
  const fetchImpl = options.fetchImpl || makeFetchHappen;

  return async function strictConditionalFetch(url, init = {}) {
    const response = await fetchImpl(url, {
      ...init,
      cache: 'no-cache',
      cachePath,
      retry: false,
    });
    const cacheStatus = response.headers?.get?.('x-local-cache-status') || '';
    if (cacheStatus === 'stale') {
      throw new Error(`strict refresh rejected stale cached bytes for ${url}`);
    }
    return response;
  };
}

export const strictConditionalFetch = createStrictConditionalFetch();
