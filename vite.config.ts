import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { RUNTIME_CACHE_VERSION } from './src/shared/runtime-cache-version.mjs';
import { HOME_CONTENT, HOME_DESTINATIONS } from './src/shared/home-content.mjs';
import { FIRST_PAINT_ROUTE_COPY, SITE_COPY } from './src/shared/site-copy.mjs';
import { AREA_PRESENTATIONS } from './src/ui/lib/areaVisualLanguage';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

function renderStaticHome() {
  const areas = AREA_PRESENTATIONS.map((area) => {
    const href = `#/library?area=${encodeURIComponent(area.id)}`;
    return `<a class="home-area-link" data-route="${href}" href="${href}"><span class="bucket-tag" data-area-id="${area.id}" style="--ca-area-color:var(${area.token})"><span aria-hidden="true" class="bucket-tag__dot"></span><span>${escapeHtml(area.label)}</span></span></a>`;
  }).join('');
  const destinations = HOME_DESTINATIONS.map((destination) => `
    <a class="home-secondary-action" data-route="${destination.href}" href="${destination.href}">
      <span><strong>${escapeHtml(destination.label)}</strong><small>${escapeHtml(destination.description)}</small></span>
      <span aria-hidden="true" class="home-secondary-arrow">→</span>
    </a>`).join('');
  return `<section class="home-entry" aria-labelledby="home-title" data-template="B" data-visual-identity="universal-front-door">
    <div class="home-hero">
      <div class="home-hero-lead">
        <header class="home-entry-header">
          <h1 id="home-title">${escapeHtml(HOME_CONTENT.headline)}</h1>
          <p class="home-product-identity">${escapeHtml(HOME_CONTENT.definition)}</p>
        </header>
        <form class="home-search" data-home-search role="search">
          <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="20"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
          <input aria-label="Search Control Atlas" name="query" placeholder="${escapeHtml(HOME_CONTENT.searchPlaceholder)}" type="search">
          <button class="button button--secondary" type="submit">Search</button>
        </form>
      </div>
    </div>
    <nav aria-label="Choose a Control Atlas destination" class="home-secondary-grid">${destinations}</nav>
    <nav aria-labelledby="home-area-heading" class="home-area-browse">
      <h2 id="home-area-heading">Browse by area</h2>
      <div class="home-ecosystem-areas">${areas}</div>
    </nav>
  </section>`;
}

export default defineConfig({
  base: './',
  root: resolve(rootDir, 'src'),
  plugins: [
    {
      name: 'control-atlas-runtime-cache-version',
      transformIndexHtml(html) {
        return {
          html: html
            .replace('<!-- CONTROL_ATLAS_HOME -->', renderStaticHome())
            .replace(
              '<!-- CONTROL_ATLAS_COPY -->',
              `<script id="control-atlas-copy" type="application/json">${JSON.stringify(FIRST_PAINT_ROUTE_COPY).replace(/</g, '\\u003c')}</script>`,
            )
            .replaceAll('CONTROL_ATLAS_PRODUCT_DESCRIPTION', escapeHtml(SITE_COPY.product.definition)),
          tags: [
          {
            tag: 'meta',
            attrs: {
              name: 'control-atlas-runtime-cache-version',
              content: RUNTIME_CACHE_VERSION,
            },
            injectTo: 'head',
          },
          ],
        };
      },
    },
    tailwindcss(),
    react(),
  ],
  build: {
    outDir: resolve(rootDir, 'dist/site'),
    emptyOutDir: true,
    sourcemap: false,
    assetsDir: 'assets',
  },
});
