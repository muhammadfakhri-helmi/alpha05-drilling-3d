/**
 * Depth track (MD): formation column, drilled hole (mud-coloured), casing
 * strings with shoes, cement, KOP/EOB ticks and the active-depth marker.
 * Full on desktop, slim on tablet, compact strip on phones (tap to expand).
 */
import { FORMATIONS, SECTIONS, CASINGS } from '../engineeringData.js';
import { KOP, EOB, TD } from '../trajectory.js';
import { mudColor } from '../well/wellbore.js';
import { Color } from 'three';

const _c = new Color();

export class DepthTrack {
  constructor(canvas, toggle, container) {
    this.c = canvas; this.g = canvas.getContext('2d');
    this.container = container;
    this.key = '';
    toggle.addEventListener('click', () => {
      const ex = container.classList.toggle('expanded');
      toggle.setAttribute('aria-expanded', String(ex));
      toggle.setAttribute('aria-label', ex ? 'Collapse depth track' : 'Expand depth track');
      this.onToggle?.();
    });
  }

  draw(S) {
    const dpr = Math.min(devicePixelRatio, 2), w = this.c.clientWidth, h = this.c.clientHeight;
    if (!w || !h) return;
    // redraw only when something visible changed (throttles canvas work)
    const key = `${w}|${h}|${Math.round(S.readMD / 4)}|${Math.round(S.holeMD / 4)}|${S.step}|${S.cement ? Math.round(S.cement.front / 20) : ''}`;
    if (key === this.key) return;
    this.key = key;
    if (this.c.width !== Math.round(w * dpr) || this.c.height !== Math.round(h * dpr)) { this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr); }
    const g = this.g;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const compact = w < 50;
    const Y = (md) => 4 + (Math.max(0, md) / TD) * (h - 8);
    const fmW = compact ? Math.max(6, w * 0.32) : 16;
    // formations
    for (let k = 0; k < FORMATIONS.length; k++) {
      const a = FORMATIONS[k].md, b = k < FORMATIONS.length - 1 ? FORMATIONS[k + 1].md : TD;
      g.fillStyle = FORMATIONS[k].color; g.fillRect(0, Y(a), fmW, Y(b) - Y(a));
    }
    if (!compact) {
      g.font = '600 10px "Barlow Condensed", sans-serif'; g.fillStyle = 'rgba(20,18,14,.8)'; g.textAlign = 'center';
      for (let k = 0; k < FORMATIONS.length; k++) {
        const a = FORMATIONS[k].md, b = k < FORMATIONS.length - 1 ? FORMATIONS[k + 1].md : TD;
        if (Y(b) - Y(a) > 26) { g.save(); g.translate(11, (Y(a) + Y(b)) / 2); g.rotate(-Math.PI / 2); g.fillText(FORMATIONS[k].name, 0, 3); g.restore(); }
      }
    }
    // drilled hole
    const hx = fmW + (compact ? 2 : 6), hw = compact ? Math.max(4, w - fmW - 4) : 10;
    for (const s of SECTIONS) {
      const a = s.top, b = Math.min(s.bot, S.holeMD);
      if (b > a) { g.fillStyle = `#${mudColor(s.mud.mw[1], _c).getHexString()}`; g.fillRect(hx, Y(a), hw, Y(b) - Y(a)); }
    }
    if (S.holeMD > 0) { g.fillStyle = '#6d6258'; g.fillRect(hx, Y(0), hw, Y(Math.min(120, S.holeMD)) - Y(0)); }
    // casing strings
    const cx = compact ? null : { c30: 32, c20: 36, c13: 40, c9: 44, c7: 48 };
    CASINGS.forEach((c, i) => {
      const cs = c.liner ? S.liner : S.casings[c.key];
      if (!cs || cs.state === 'none') return;
      const top = Math.max(c.top, cs.topMD), sh = Math.max(0, cs.shoeMD);
      if (sh <= top) return;
      const x = compact ? hx + hw - 1 - (i % 2) : cx[c.key];
      g.strokeStyle = c.color; g.lineWidth = compact ? 1.5 : 2;
      g.beginPath(); g.moveTo(x, Y(top)); g.lineTo(x, Y(sh)); g.stroke();
      if (!compact && cs.state === 'set') { g.fillStyle = c.color; g.beginPath(); g.moveTo(x - 1, Y(sh)); g.lineTo(x + 5, Y(sh)); g.lineTo(x - 1, Y(sh) - 6); g.fill(); }
      if (!compact && cs.cemented) { g.fillStyle = 'rgba(211,204,188,.6)'; g.fillRect(x + 2, Y(c.toc), 2, Y(c.shoe) - Y(c.toc)); }
      if (!compact && S.cement && S.cement.key === c.key) {
        const cem = S.cement; g.fillStyle = 'rgba(236,230,214,.9)';
        if (cem.front > cem.Li) { const up = c.shoe - (cem.front - cem.Li); g.fillRect(x + 2, Y(up), 2, Y(c.shoe) - Y(up)); }
      }
    });
    // scale
    if (!compact) {
      g.fillStyle = 'rgba(174,184,192,.9)'; g.font = '500 10px Barlow, sans-serif'; g.textAlign = 'right';
      for (let d = 0; d <= 9000; d += 2000) { g.fillText(`${d / 1000}k`, w - 2, Y(d) + 3); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(56, Y(d), Math.max(0, w - 74), 1); g.fillStyle = 'rgba(174,184,192,.9)'; }
      g.textAlign = 'left';
      g.fillStyle = 'rgba(242,194,125,.9)'; [KOP, EOB].forEach((d) => g.fillRect(hx + hw + 1, Y(d) - 0.5, 5, 1));
    }
    // active depth marker
    const m = Math.max(0, S.readMD);
    if (m > 0) {
      g.fillStyle = '#F4D3A3';
      g.fillRect(0, Y(m) - 0.75, compact ? w : 56, 1.5);
      if (!compact) { g.beginPath(); g.moveTo(54, Y(m)); g.lineTo(62, Y(m) - 5); g.lineTo(62, Y(m) + 5); g.fill(); }
    }
  }
}
