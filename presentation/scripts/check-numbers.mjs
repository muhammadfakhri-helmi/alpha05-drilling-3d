/**
 * Number check: every number SHOWN on screen vs the PPTX text.
 *
 *   npm run build && npm run preview   (in another terminal)
 *   npm run check:numbers              -> docs/number-check.md
 *
 * Opens each slide in a real browser, reads the HUD / panel text and the 3D
 * scene labels, extracts every number and looks it up in that slide's PPTX
 * text (source/slides_text.md). Scene labels are looked up across the deck.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  console.error('playwright is required: npm i -D playwright (or run where it is installed)');
  process.exit(1);
}
const BASE = process.env.BASE_URL || 'http://localhost:4173/';
const NUM = /\d+(?:[.,]\d+)*(?:-\d+\/\d+)?|\d+\/\d+/g;
const nums = (t) => (t.match(NUM) || []).map((n) => n.replace(/\.$/, ''));

const md = readFileSync(new URL('../source/slides_text.md', import.meta.url), 'utf8');
const pptx = {};
for (const part of md.split(/<!-- Slide number: (\d+) -->/).slice(1).reduce((a, x, i, arr) => (i % 2 ? a : [...a, [Number(x), arr[i + 1]]]), [])) {
  const [n, text] = part;
  const [body, notes = ''] = text.split('### Notes:');
  // drop image file references, they are not slide text
  const clean = (s) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  pptx[n] = { body: new Set(nums(clean(body))), notes: new Set(nums(notes)) };
}
const deck = new Set(Object.values(pptx).flatMap((p) => [...p.body]));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const rows = [];
const sceneRows = new Map();
for (let n = 1; n <= 18; n++) {
  await page.goto(`${BASE}#s=${n}`);
  await page.reload();
  await page.waitForTimeout(2500);
  const sel = [4, 7, 9, 11].includes(n) ? `[data-backup="${n}"]` : `[data-hud][data-slide="${n}"]`;
  // footer line "ALPHA-05 DEVELOPMENT WELL" is PPTX layout text (slideLayout2/3), not slide text
  const text = (await page.$eval(sel, (el) => el.innerText)).replace('ALPHA-05 DEVELOPMENT WELL', '');
  const seen = new Map();
  for (const x of nums(text)) seen.set(x, (seen.get(x) || 0) + 1);
  for (const [x, count] of seen) {
    // casing & cement on the section card come from the paired backup slide (6-7, 8-9, 10-11)
    const pair = { 6: 7, 8: 9, 10: 11 }[n];
    const ok = pptx[n].body.has(x) ? 'cocok' : pptx[n].notes.has(x) ? 'cocok (notes)' : pair && pptx[pair].body.has(x) ? `cocok (slide ${pair})` : 'TIDAK';
    rows.push({ n, x, count, ok });
  }
  // scene labels, every step of the slide
  const steps = await page.evaluate(() => document.querySelectorAll('.bar__steps i').length || 1);
  for (let k = 0; k < steps; k++) {
    if (k) { await page.goto(`${BASE}#s=${n}&k=${k}`); await page.reload(); await page.waitForTimeout(2500); }
    const labels = await page.$$eval('.label-layer .scene-label', (els) => els.filter((e) => e.style.visibility !== 'hidden').map((e) => e.textContent));
    for (const l of labels) for (const x of nums(l)) {
      const key = `${l}|${x}`;
      if (!sceneRows.has(key)) sceneRows.set(key, { label: l, x, slides: new Set(), ok: deck.has(x) ? 'cocok' : 'TIDAK' });
      sceneRows.get(key).slides.add(n);
    }
  }
}
await browser.close();

const bad = rows.filter((r) => r.ok === 'TIDAK').length + [...sceneRows.values()].filter((r) => r.ok === 'TIDAK').length;
let out = `# Cek angka: HUD vs PPTX v4\n\nDibuat otomatis oleh \`npm run check:numbers\` dari teks yang benar-benar tampil di layar (browser), dibandingkan dengan \`source/slides_text.md\`.\n\n`;
out += `Total angka HUD: ${rows.length} · label scene: ${sceneRows.size} · **tidak cocok: ${bad}**\n\n`;
out += `## Kartu HUD / panel per slide\n\n| Slide | Angka | Muncul | Cocok/tidak |\n|---|---|---|---|\n`;
for (const r of rows) out += `| ${r.n} | ${r.x} | ${r.count}x | ${r.ok} |\n`;
out += `\n## Label di scene 3D (dicocokkan ke seluruh deck)\n\n| Label | Angka | Tampil di slide | Cocok/tidak |\n|---|---|---|---|\n`;
for (const r of sceneRows.values()) out += `| ${r.label} | ${r.x} | ${[...r.slides].join(', ')} | ${r.ok} |\n`;
mkdirSync(new URL('../docs/', import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/number-check.md', import.meta.url), out);
console.log(`HUD numbers: ${rows.length}, scene labels: ${sceneRows.size}, mismatches: ${bad}`);
process.exit(bad ? 2 : 0);
