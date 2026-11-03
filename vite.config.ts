/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { viteSingleFile } from 'vite-plugin-singlefile';

const API = process.env.VITE_API_TARGET ?? 'http://localhost:4000';

// `--mode prototype`: one self-contained HTML file with in-browser sample data (no backend).
export default defineConfig(({ mode }) => ({
  plugins: mode === 'prototype' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'prototype' ? { outDir: 'dist-prototype', assetsInlineLimit: 100_000_000 } : undefined,
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { port: 5173, proxy: { '/api': API } },
  preview: { port: 5173, proxy: { '/api': API } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    css: false,
    testTimeout: 15000,
    exclude: ['e2e/**', 'node_modules/**'],
  },
}));
