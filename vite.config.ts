import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { RUNTIME_CACHE_VERSION } from './src/shared/runtime-cache-version.mjs';
import {
  HOME_ATLAS_AREAS,
  HOME_AUTHORITY_GROUPS,
  HOME_CONTENT,
  HOME_DESTINATIONS,
} from './src/shared/home-content.mjs';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

function renderStaticHome() {
  const authorities = HOME_AUTHORITY_GROUPS.map((group) => `<span>${escapeHtml(group)}</span>`).join('');
  const areas = HOME_ATLAS_AREAS.map((area) => `<span>${escapeHtml(area)}</span>`).join('');
  const destinations = HOME_DESTINATIONS.map((destination) => `
    <a class="home-secondary-action" data-route="${destination.href}" href="${destination.href}">
      <span><strong>${escapeHtml(destination.label)}</strong><small>${escapeHtml(destination.description)}</small></span>
      <span aria-hidden="true" class="home-secondary-arrow">→</span>
    </a>`).join('');
  return `<section class="home-entry" aria-labelledby="home-title" data-visual-identity="universal-front-door">
    <div class="home-hero">
      <div class="home-hero-lead">
        <header class="home-entry-header">
          <p class="eyebrow">${escapeHtml(HOME_CONTENT.eyebrow)}</p>
          <h1 id="home-title">${escapeHtml(HOME_CONTENT.headline)}</h1>
          <p class="home-product-identity">${escapeHtml(HOME_CONTENT.definition)}</p>
          <p class="home-brand-line">${escapeHtml(HOME_CONTENT.support)}</p>
        </header>
        <form class="home-search" data-home-search role="search">
          <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="20"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
          <input aria-label="Search Control Atlas" name="query" placeholder="${escapeHtml(HOME_CONTENT.searchPlaceholder)}" type="search">
          <button class="button button--secondary" type="submit">Search</button>
        </form>
        <div class="home-primary-actions">
          <a class="button button--primary home-start-here" data-route="#/atlas" href="#/atlas">Explore the Atlas</a>
          <a class="home-inline-link" data-route="#/library" href="#/library">Search the Library</a>
        </div>
      </div>
      <aside aria-label="Federal cybersecurity ecosystem preview" class="home-ecosystem">
        <header><p class="eyebrow">The ecosystem at a glance</p><h2>From authority to action</h2></header>
        <div class="home-ecosystem-authorities" aria-label="Authority groups">${authorities}</div>
        <div class="home-ecosystem-trunk"><strong>Control Atlas</strong><small>connected reference system</small></div>
        <div class="home-ecosystem-areas" aria-label="Cybersecurity areas">${areas}</div>
        <p>Zoom from the whole landscape to the source, relationship, or record you need.</p>
      </aside>
    </div>
    <nav aria-label="Choose a Control Atlas destination" class="home-secondary-grid">${destinations}</nav>
    <aside class="home-trust-boundary"><p>${escapeHtml(HOME_CONTENT.trust)}</p></aside>
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
          html: html.replace('<!-- CONTROL_ATLAS_HOME -->', renderStaticHome()),
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
