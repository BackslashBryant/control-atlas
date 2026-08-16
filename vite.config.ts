import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { RUNTIME_CACHE_VERSION } from './src/shared/runtime-cache-version.mjs';
import { HOME_CONTENT, HOME_DESTINATIONS } from './src/shared/home-content.mjs';
import { FIRST_PAINT_ROUTE_COPY, SITE_COPY } from './src/shared/site-copy.mjs';
import { HOME_TAG_GROUPS } from './src/ui/lib/homeTagConstellation';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
});

function formatBuildDate(value: string | undefined) {
  return value ? DATE_FORMATTER.format(new Date(value)) : 'local development build';
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

function renderStaticHome() {
  const tagGroups = HOME_TAG_GROUPS.map((group) => {
    const tags = group.tags.map((tag) => {
      const href = `#/library?tag=${encodeURIComponent(tag.id)}`;
      return `<li><a aria-label="${escapeHtml(`${tag.label}, ${tag.count.toLocaleString()} records`)}" class="home-tag-link" data-record-count="${tag.count}" data-route="${href}" href="${href}" style="--tag-scale:${tag.scale}"><span class="home-tag-link__label">${escapeHtml(tag.label)}</span><span aria-hidden="true" class="home-tag-link__count">${tag.count.toLocaleString()}</span></a></li>`;
    }).join('');
    return `<section aria-labelledby="home-tag-group-${escapeHtml(group.id)}" class="home-tag-galaxy" data-tag-dimension="${escapeHtml(group.id)}"><h3 id="home-tag-group-${escapeHtml(group.id)}">${escapeHtml(group.label)}</h3><ul>${tags}</ul></section>`;
  }).join('');
  const destinations = HOME_DESTINATIONS.map((destination) => `
    <a class="home-secondary-action" data-route="${destination.href}" href="${destination.href}">
      <span><strong>${escapeHtml(destination.label)}</strong><small>${escapeHtml(destination.description)}</small></span>
      <span aria-hidden="true" class="home-secondary-arrow">→</span>
    </a>`).join('');
  const coverFreshness = formatBuildDate(globalThis.process.env.VITE_CONTROL_ATLAS_SOURCE_DATA_DATE);
  // Depth-0 Signal cover, part of the static first paint (React does not boot on
  // Home). Hidden by default so no-JS users see the Home underneath; main.tsx
  // reveals it, gates it to once per session, and wires dismissal.
  const cover = SITE_COPY.home.cover;
  const coverStats = [
    ...cover.stats.map((stat) =>
      `<div class="signal-cover__stat"><span class="signal-cover__stat-value">${escapeHtml(stat.value).replace('-', '&#8209;')}</span><span class="signal-cover__stat-label">${escapeHtml(stat.label)}</span>${stat.detail ? `<span class="signal-cover__stat-detail">${escapeHtml(stat.detail)}</span>` : ''}</div>`,
    ),
    `<div class="signal-cover__stat"><span class="signal-cover__stat-value">${escapeHtml(coverFreshness)}</span><span class="signal-cover__stat-label">${escapeHtml(cover.freshnessLabel)}</span></div>`,
  ].join('');
  const signalCover = `<div class="signal-cover" data-signal-cover hidden role="button" tabindex="0" aria-label="Welcome to Control Atlas. Click or press Enter to start."><div class="signal-cover__grid" aria-hidden="true"></div><div class="signal-cover__inner"><div class="signal-cover__brand"><span class="signal-cover__name">${escapeHtml(cover.wordmark)}</span><span class="signal-cover__keys" aria-hidden="true"><kbd>Ctrl</kbd><span>+</span><kbd>Alt</kbd><span>+</span><kbd class="signal-cover__rotor">Learn</kbd></span></div><p class="signal-cover__tagline">${escapeHtml(cover.tagline)}</p><div class="signal-cover__stats">${coverStats}</div><p class="signal-cover__prompt" aria-hidden="true">${escapeHtml(cover.prompt)}</p></div></div>`;
  return `${signalCover}<section class="home-entry" aria-labelledby="home-title" data-template="B" data-visual-identity="universal-front-door">
    <div class="home-hero">
      <div class="home-hero-lead">
        <header class="home-entry-header">
          <h1 id="home-title">${escapeHtml(HOME_CONTENT.headline)}</h1>
          <p class="home-product-identity">${escapeHtml(HOME_CONTENT.definition)}</p>
        </header>
        <form class="home-search" data-home-search role="search">
          <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="20"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
          <input aria-label="Search Control Atlas" name="query" placeholder="${escapeHtml(HOME_CONTENT.searchPlaceholder)}" type="search">
          <button class="home-search-submit" type="submit">Search</button>
        </form>
      </div>
    </div>
    <nav aria-label="Choose a Control Atlas destination" class="home-secondary-grid">${destinations}</nav>
    <nav aria-labelledby="home-tag-heading" class="home-tag-constellation">
      <div class="home-tag-constellation__heading"><div><h2 id="home-tag-heading">Browse by tag</h2><p>More records, bigger tag.</p></div><a class="home-tag-constellation__all" data-route="#/library" href="#/library">See all tags <span aria-hidden="true">→</span></a></div>
      <div class="home-tag-galaxies" data-tag-count-scale="logarithmic">${tagGroups}</div>
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
            .replaceAll('CONTROL_ATLAS_PRODUCT_DESCRIPTION', escapeHtml(SITE_COPY.product.definition))
            .replaceAll('CONTROL_ATLAS_RELEASE_DATE', escapeHtml(formatBuildDate(globalThis.process.env.VITE_CONTROL_ATLAS_RELEASE_DATE)))
            .replaceAll('CONTROL_ATLAS_SOURCE_DATA_DATE', escapeHtml(formatBuildDate(globalThis.process.env.VITE_CONTROL_ATLAS_SOURCE_DATA_DATE))),
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
