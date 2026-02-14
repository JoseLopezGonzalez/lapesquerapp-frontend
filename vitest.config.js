import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    pool: 'threads',
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    server: {
      deps: {
        external: ['@asamuzakjp/css-color', '@csstools/css-calc'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.{js,jsx,ts,tsx}', '**/node_modules/**', '**/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
});
