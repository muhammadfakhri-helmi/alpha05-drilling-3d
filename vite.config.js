import { defineConfig } from 'vite';

// GitHub Pages serves the project at /alpha05-drilling-3d/
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/alpha05-drilling-3d/' : '/',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: { manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : id.includes('node_modules/gsap') ? 'gsap' : undefined) },
    },
  },
  server: { host: true },
  preview: { host: true },
}));
