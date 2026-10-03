/**
 * Responsive layout manager.
 *
 * Chooses one of five intentionally different layouts from the visible
 * viewport (not just the width), measures which screen areas the UI covers
 * and reports them so the renderer can re-centre the 3D view and labels can
 * avoid them. Handles rotation, dynamic browser toolbars (visualViewport)
 * and container resizes without reloading or recreating the scene.
 */
export function chooseLayout(w, h) {
  const landscape = w > h;
  if (landscape && h <= 500) return 'phone-land';
  if (w < 600) return 'phone';
  if (!landscape && w < 1100) return 'tablet';
  if (w < 900) return 'tablet';
  if (w < 1200) return 'tablet-land';
  return 'desktop';
}

export class Responsive {
  constructor(app, { onChange }) {
    this.app = app;
    this.onChange = onChange;
    this.layout = null;
    this.size = { w: 0, h: 0 };
    this._raf = 0;
    const schedule = () => { cancelAnimationFrame(this._raf); this._raf = requestAnimationFrame(() => this.measure()); };
    this.schedule = schedule;
    new ResizeObserver(schedule).observe(app);
    addEventListener('resize', schedule);
    addEventListener('orientationchange', () => setTimeout(schedule, 120));
    if (window.visualViewport) visualViewport.addEventListener('resize', schedule);
  }

  measure() {
    const r = this.app.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    const layout = chooseLayout(w, h);
    const changed = layout !== this.layout;
    if (changed) { this.layout = layout; this.app.dataset.layout = layout; }
    this.size = { w, h };
    this.onChange?.({ layout, w, h, layoutChanged: changed, insets: this.insets() });
  }

  /** UI-covered margins (px) used to centre the 3D view in the unobstructed area. */
  insets() {
    const app = this.app.getBoundingClientRect();
    const rect = (id) => { const el = document.getElementById(id); if (!el || el.hidden || getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden') return null; return el.getBoundingClientRect(); };
    const hud = rect('hud'), tl = rect('tl'), track = rect('track'), eng = rect('eng');
    let top = hud ? hud.bottom - app.top : 0;
    let bottom = tl ? app.bottom - tl.top : 0;
    let left = track && track.width > 40 ? track.right - app.left : 0;
    let right = 0;
    const engState = document.getElementById('eng').dataset.state;
    if (eng && engState !== 'closed') {
      const docked = eng.height > app.height * 0.6 && eng.width < app.width * 0.6;
      if (docked) right = app.right - eng.left;
      else bottom = Math.max(bottom, app.bottom - eng.top);
    }
    return { top, bottom, left, right };
  }

  /** Screen rectangles labels must not overlap. */
  blockers() {
    const ids = ['hud', 'tl', 'track', 'eng', 'opcard', 'pick', 'settings', 'callout', 'banner'];
    const out = [];
    const app = this.app.getBoundingClientRect();
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el || el.hidden) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) continue;
      if (id === 'eng' && el.dataset.state === 'closed') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      out.push({ x0: r.left - app.left - 4, y0: r.top - app.top - 4, x1: r.right - app.left + 4, y1: r.bottom - app.top + 4 });
    }
    return out;
  }
}
