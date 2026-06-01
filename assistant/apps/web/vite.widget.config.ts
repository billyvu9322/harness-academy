import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Library build for the embeddable academy widget. Produces a single self-contained
 * `assistant-widget.js` (React + chat + Tailwind CSS string all bundled in) that the academy
 * site lazy-loads. CSS is imported via `?inline` in the entry, so no separate stylesheet ships.
 */
export default defineConfig({
  plugins: [react()],
  define: {
    // React needs an explicit production env in a library build (no Vite app mode here).
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist-widget',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('./src/widget/index.tsx', import.meta.url)),
      name: 'HarnessAssistant',
      formats: ['iife'],
      fileName: () => 'assistant-widget.js',
    },
  },
});
