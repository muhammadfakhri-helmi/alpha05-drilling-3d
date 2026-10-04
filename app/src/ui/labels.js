/**
 * Context-aware labels with screen-space collision control.
 *
 *   project anchor → candidate rectangles (right, left, above, below) →
 *   reject if outside the viewport, over UI (HUD, timeline, sheet, cards) or
 *   overlapping an already placed label → place first fit, else hide.
 *
 * Labels are processed in priority order (1 = high … 3 = low); each layout
 * caps the lowest priority shown (phone: high only, tablet: + medium,
 * desktop: all).
 */
import { Vector3 } from 'three';

const _v = new Vector3();
const GAP = 12;

export class LabelManager {
  constructor(container, camera) {
    this.el = container;
    this.camera = camera;
    this.items = [];
    this.maxPriority = 3;
    this.enabled = true;
    this.blockers = [];
    this.size = { w: 1, h: 1 };
  }

  /**
   * @param {object} d { id, text(S)|string, anchor(S, v)->Vector3|null, priority, context:'down'|'surface'|'any', show(S)->bool }
   */
  add(d) {
    const el = document.createElement('div');
    el.className = `lbl p${d.priority}`;
    this.el.appendChild(el);
    this.items.push({ ...d, el, text: d.text, cur: '', w: 0, h: 0, visible: false });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  setViewport(w, h) { this.size = { w, h }; }
  setBlockers(b) { this.blockers = b; }

  update(S, ctx) {
    const { w, h } = this.size;
    const placed = [];
    const blockers = this.blockers;
    const sorted = this.items;
    for (const it of sorted) {
      let ok = this.enabled && it.priority <= this.maxPriority && (!it.show || it.show(S, ctx));
      if (ok) {
        if (it.context === 'down' && !ctx.downhole) ok = false;
        if (it.context === 'surface' && !ctx.surface) ok = false;
        if (it.technical && ctx.cinematic) ok = false;
      }
      let p = null;
      if (ok) {
        p = it.anchor(S, _v, ctx);
        if (!p) ok = false;
      }
      if (ok) {
        _v.copy(p).project(this.camera);
        if (_v.z > 1 || _v.z < -1) ok = false;
      }
      if (!ok) { this._hide(it); continue; }
      const sx = ((_v.x + 1) / 2) * w, sy = ((1 - _v.y) / 2) * h;
      if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) { this._hide(it); continue; }
      const text = typeof it.text === 'function' ? it.text(S, ctx) : it.text;
      if (text !== it.cur) { it.el.textContent = text; it.cur = text; it.w = 0; }
      if (!it.w) { it.el.style.visibility = 'hidden'; it.el.style.display = 'block'; it.w = it.el.offsetWidth; it.h = it.el.offsetHeight; }
      const cands = [
        [sx + GAP, sy - it.h / 2, false],
        [sx - GAP - it.w, sy - it.h / 2, true],
        [sx + GAP, sy - it.h - 6, false],
        [sx + GAP, sy + 6, false],
        [sx - GAP - it.w, sy - it.h - 6, true],
        [sx - GAP - it.w, sy + 6, true],
      ];
      let chosen = null;
      for (const [x, y, flip] of cands) {
        const r = { x0: x, y0: y, x1: x + it.w, y1: y + it.h };
        if (r.x0 < 4 || r.y0 < 4 || r.x1 > w - 4 || r.y1 > h - 4) continue;
        if (hits(r, blockers) || hits(r, placed)) continue;
        chosen = { r, flip }; break;
      }
      if (!chosen) { this._hide(it); continue; }
      placed.push(chosen.r);
      it.el.style.transform = `translate(${chosen.r.x0.toFixed(1)}px, ${chosen.r.y0.toFixed(1)}px)`;
      if (it.flip !== chosen.flip) { it.el.classList.toggle('flip', chosen.flip); it.flip = chosen.flip; }
      if (!it.visible) { it.el.style.visibility = 'visible'; it.visible = true; }
    }
  }

  _hide(it) { if (it.visible || it.el.style.visibility !== 'hidden') { it.el.style.visibility = 'hidden'; it.visible = false; } }
}

function hits(r, list) {
  for (const b of list) if (r.x0 < b.x1 && r.x1 > b.x0 && r.y0 < b.y1 && r.y1 > b.y0) return true;
  return false;
}
