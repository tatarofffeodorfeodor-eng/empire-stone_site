import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // не превращать фото в base64 — именно от этого мы и уходим
  },
});
