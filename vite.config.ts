import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 3000 },
  server: { port: 5174 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as never);
