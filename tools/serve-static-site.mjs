#!/usr/bin/env node

import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createServer } from 'node:http';

const ROOT = join(process.cwd(), 'dist', 'site');
const PORT = Number(process.env.PORT || 4173);

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
]);

createServer((request, response) => {
  const rawPath = request.url.split('?')[0];
  const requestPath = rawPath === '/' ? '/index.html' : rawPath;
  const filePath = normalize(join(ROOT, requestPath));
  if (!filePath.startsWith(ROOT) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    // Mirror GitHub Pages: unknown paths serve 404.html (which redirects
    // path-style deep links into the HashRouter) with a 404 status.
    const notFoundPage = join(ROOT, '404.html');
    if (existsSync(notFoundPage)) {
      response.writeHead(404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      createReadStream(notFoundPage).pipe(response);
      return;
    }
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'content-type': contentTypes.get(extname(filePath)) || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(response);
}).listen(PORT, 'localhost', () => {
  console.log(`Control Atlas static site available at http://localhost:${PORT}`);
});
