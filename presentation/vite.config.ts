import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' keeps every asset path relative, so the same build works on
// GitHub Pages (/alpha05-drilling-3d/dwop/), from any static server, or as a
// copied folder on the presentation laptop. `--mode single` additionally
// inlines everything into ONE html file that opens offline by double-click.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    target: 'es2020',
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    emptyOutDir: true,
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
    chunkSizeWarningLimit: 1500,
  },
  server: { host: true },
  preview: { host: true },
}));
