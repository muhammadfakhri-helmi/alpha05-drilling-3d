import { defineConfig } from 'vite';

// Source entry lives in app/ so the repository root can hold the BUILT site:
// GitHub Pages serves this repo from the root of `main` (Deploy from branch).
// `npm run build:pages` copies dist/ to the root; CI keeps it in sync.
export default defineConfig(({ command, isPreview }) => ({
  root: 'app',
  base: command === 'build' || isPreview ? '/alpha05-drilling-3d/' : '/',
  build: {
    target: 'es2020',
    outDir: '../dist',
    emptyOutDir: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: { manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : id.includes('node_modules/gsap') ? 'gsap' : undefined) },
    },
  },
  server: { host: true },
  preview: { host: true },
}));
