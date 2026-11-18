// Copies the production build to ../dwop so GitHub Pages ("Deploy from branch:
// main / root") serves it at /alpha05-drilling-3d/dwop/, next to the existing
// digital twin at the site root (which stays unchanged).
import { cpSync, rmSync, existsSync, writeFileSync } from 'node:fs';

if (!existsSync('dist/index.html')) throw new Error('dist/ missing: run vite build first');
rmSync('../dwop', { recursive: true, force: true });
cpSync('dist', '../dwop', { recursive: true });
writeFileSync('../.nojekyll', '');
console.log('Published presentation/dist to /dwop');
