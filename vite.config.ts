import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { RUNTIME_CACHE_VERSION } from './src/shared/runtime-cache-version.mjs';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  root: resolve(rootDir, 'src'),
  plugins: [
    {
      name: 'control-atlas-runtime-cache-version',
      transformIndexHtml() {
        return [
          {
            tag: 'meta',
            attrs: {
              name: 'control-atlas-runtime-cache-version',
              content: RUNTIME_CACHE_VERSION,
            },
            injectTo: 'head',
          },
        ];
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
