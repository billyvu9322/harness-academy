import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.VITE_ACADEMY_BASE_URL': JSON.stringify(env.VITE_ACADEMY_BASE_URL)
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
  }
});
