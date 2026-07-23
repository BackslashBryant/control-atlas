import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  root: resolve(rootDir, 'src'),
  plugins: [tailwindcss(), react()],
  build: {
    outDir: resolve(rootDir, 'dist/site'),
    emptyOutDir: true,
    sourcemap: false,
    assetsDir: 'assets',
  },
});
