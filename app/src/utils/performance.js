/**
 * Device classification, quality presets and adaptive DPR.
 * Quality never removes engineering information – only rendering cost
 * (pixel ratio, shadows, particle count, environment reflections).
 */
export const QUALITY_PRESETS = {
  low: { label: 'Low', dprMax: 1.0, shadows: false, shadowMap: 512, particles: 320, env: false, wall: 1400 },
  medium: { label: 'Medium', dprMax: 1.5, shadows: true, shadowMap: 1024, particles: 650, env: true, wall: 2000 },
  high: { label: 'High', dprMax: 2.0, shadows: true, shadowMap: 2048, particles: 1300, env: true, wall: 2400 },
};

export function deviceClass() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const s = Math.min(screen.width, screen.height);
  if (coarse && s < 600) return 'mobile';
  if (coarse && s < 1100) return 'tablet';
  return 'desktop';
}

/** AUTO starting point per device class (prompt guidance: mobile 1.25–1.75, tablet 1.5–2, desktop 2). */
export function autoPreset(device) {
  if (device === 'mobile') return { base: 'medium', dprMax: 1.5, particles: 420 };
  if (device === 'tablet') return { base: 'medium', dprMax: 1.75, particles: 650 };
  return { base: 'high', dprMax: 2, particles: 1100 };
}

/**
 * Rolling FPS monitor; in AUTO mode lowers / raises the pixel ratio in small
 * steps to keep frame pacing stable (≈30 fps floor on phones, 50+ elsewhere).
 */
export class AdaptiveQuality {
  constructor({ minDpr = 0.75, maxDpr = 2, target = 50, onChange }) {
    this.minDpr = minDpr; this.maxDpr = maxDpr; this.target = target; this.onChange = onChange;
    this.dpr = maxDpr; this.acc = 0; this.frames = 0; this.low = 0; this.high = 0; this.enabled = true; this.fps = 60;
  }
  setRange(min, max) { this.minDpr = min; this.maxDpr = max; this.dpr = Math.min(this.dpr, max); }
  sample(dt) {
    this.acc += dt; this.frames++;
    if (this.acc < 1) return;
    this.fps = this.frames / this.acc; this.acc = 0; this.frames = 0;
    if (!this.enabled || document.hidden) return;
    if (this.fps < this.target - 8) { this.low++; this.high = 0; } else if (this.fps > 57) { this.high++; this.low = 0; } else { this.low = 0; this.high = 0; }
    if (this.low >= 2 && this.dpr > this.minDpr) { this.dpr = Math.max(this.minDpr, this.dpr - 0.25); this.low = 0; this.onChange?.(this.dpr); }
    if (this.high >= 5 && this.dpr < this.maxDpr) { this.dpr = Math.min(this.maxDpr, this.dpr + 0.25); this.high = 0; this.onChange?.(this.dpr); }
  }
}
