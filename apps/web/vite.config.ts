import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@tota-tamtam/contracts': fileURLToPath(new URL('../../packages/contracts/src/index.ts', import.meta.url))
    }
  },
  server: {
    port: 5173
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
