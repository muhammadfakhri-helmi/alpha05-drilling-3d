/**
 * Small procedural textures (no downloads – the app must run as a static site).
 * Kept at 256–1024 px; repeated with wrapping.
 */
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, NoColorSpace } from 'three';

const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/** Deterministic PRNG so textures look identical on every load. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function tex(c, { color = true, repeat = [1, 1] } = {}) {
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = color ? SRGBColorSpace : NoColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Value-noise field rendered by layering blurred random blobs (cheap, tileable enough at these scales). */
function speckle(g, w, h, rand, count, size, rgba) {
  for (let i = 0; i < count; i++) {
    const s = size * (0.4 + rand());
    g.fillStyle = rgba(rand());
    g.fillRect(rand() * w, rand() * h, s, s);
  }
}

/** Gravel pad: colour + roughness. */
export function gravelTextures(size = 512, seed = 7) {
  const rand = rng(seed);
  const c = canvas(size), g = c.getContext('2d');
  g.fillStyle = '#9C968A'; g.fillRect(0, 0, size, size);
  // large tonal patches
  for (let i = 0; i < 40; i++) {
    const r = size * (0.08 + rand() * 0.18), x = rand() * size, y = rand() * size;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const d = rand() < 0.5 ? '120,112,98' : '168,162,150';
    gr.addColorStop(0, `rgba(${d},.22)`); gr.addColorStop(1, `rgba(${d},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  speckle(g, size, size, rand, size * 22, 2.2, (v) => `rgba(${60 + v * 110 | 0},${56 + v * 100 | 0},${50 + v * 90 | 0},.45)`);
  speckle(g, size, size, rand, size * 3, 4, (v) => `rgba(${190 + v * 50 | 0},${186 + v * 48 | 0},${178 + v * 44 | 0},.35)`);
  const r = canvas(size / 2), rg = r.getContext('2d');
  rg.fillStyle = '#d8d8d8'; rg.fillRect(0, 0, size / 2, size / 2);
  speckle(rg, size / 2, size / 2, rand, size * 6, 2, (v) => `rgba(${150 + v * 105 | 0},${150 + v * 105 | 0},${150 + v * 105 | 0},.6)`);
  return { map: tex(c), roughnessMap: tex(r, { color: false }) };
}

/** Surrounding field: dry grass / dirt. */
export function fieldTexture(size = 512, seed = 11) {
  const rand = rng(seed);
  const c = canvas(size), g = c.getContext('2d');
  g.fillStyle = '#66704A'; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 70; i++) {
    const r = size * (0.05 + rand() * 0.2), x = rand() * size, y = rand() * size;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const d = rand() < 0.45 ? '128,118,84' : rand() < 0.5 ? '84,98,58' : '104,112,70';
    gr.addColorStop(0, `rgba(${d},.45)`); gr.addColorStop(1, `rgba(${d},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  speckle(g, size, size, rand, size * 14, 2, (v) => `rgba(${70 + v * 70 | 0},${80 + v * 60 | 0},${48 + v * 30 | 0},.4)`);
  return tex(c);
}

/** Concrete with subtle stains. */
export function concreteTexture(size = 256, seed = 3) {
  const rand = rng(seed);
  const c = canvas(size), g = c.getContext('2d');
  g.fillStyle = '#B5B0A6'; g.fillRect(0, 0, size, size);
  speckle(g, size, size, rand, size * 10, 2, (v) => `rgba(${120 + v * 90 | 0},${116 + v * 88 | 0},${108 + v * 84 | 0},.35)`);
  for (let i = 0; i < 10; i++) {
    const r = size * (0.1 + rand() * 0.2), x = rand() * size, y = rand() * size;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(90,84,74,.18)'); gr.addColorStop(1, 'rgba(90,84,74,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return tex(c);
}

/**
 * Drill pipe: longitudinal tonal bands (uv.y runs around the pipe) so that
 * scrolling offset.y reads as rotation without twisting geometry.
 */
export function pipeBandTexture(base = '#8E989F', band = '#5C656C') {
  const c = canvas(8, 64), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 8, 64);
  g.fillStyle = band; g.fillRect(0, 0, 8, 9); g.fillRect(0, 30, 8, 5);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 46, 8, 3);
  return tex(c);
}

/** Fine grain + bedding used as a multiply detail on the formation cross-section. */
export function rockDetailTexture(size = 256, seed = 5) {
  const rand = rng(seed);
  const c = canvas(size), g = c.getContext('2d');
  g.fillStyle = '#ececec'; g.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2 + rand() * 6) {
    g.fillStyle = `rgba(${150 + rand() * 60 | 0},${150 + rand() * 60 | 0},${150 + rand() * 60 | 0},${0.12 + rand() * 0.18})`;
    g.fillRect(0, y, size, 1 + rand() * 1.5);
  }
  speckle(g, size, size, rand, size * 10, 1.6, (v) => `rgba(${120 + v * 135 | 0},${120 + v * 135 | 0},${120 + v * 135 | 0},.35)`);
  return tex(c, { color: false });
}

/** Soft round sprite for particles. */
export function dotTexture(size = 64) {
  const c = canvas(size), g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}

/** Brushed metal roughness variation. */
export function brushedTexture(size = 256, seed = 9) {
  const rand = rng(seed);
  const c = canvas(size), g = c.getContext('2d');
  g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 2; i++) {
    const v = 110 + rand() * 90 | 0;
    g.fillStyle = `rgba(${v},${v},${v},.25)`;
    g.fillRect(0, rand() * size, size, 1);
  }
  return tex(c, { color: false });
}

export { canvas as makeCanvas };
