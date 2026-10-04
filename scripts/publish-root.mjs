// Copies the production build (dist/) to the repository root so that GitHub
// Pages "Deploy from branch: main / (root)" serves the built site.
import { cpSync, rmSync, existsSync, writeFileSync } from 'node:fs';

if (!existsSync('dist/index.html')) throw new Error('dist/ missing – run vite build first');
rmSync('assets', { recursive: true, force: true });
cpSync('dist/assets', 'assets', { recursive: true });
cpSync('dist/index.html', 'index.html');
writeFileSync('.nojekyll', '');
console.log('Published dist/ to repository root (index.html, assets/)');
