/**
 * Top HUD (level-1 readouts), operation card, milestone banner, depth toasts
 * and engineering callouts. DOM is only written when a value changes.
 */
import { SECTIONS, FORMATIONS, formationIndexAtMD, CALLOUTS, DEPTH_MARKS } from '../engineeringData.js';
import { STEP_LABEL, PHASES } from '../stateMachine.js';
import { tvdAt, incAt } from '../trajectory.js';
import { fmt } from '../utils/math.js';

const $ = (id) => document.getElementById(id);
const FLOW_HTML = {
  mud: '<span class="sw" style="background:#E8D7B6"></span>Mud ↓ drill string → bit nozzles → ↑ annulus <span class="sw" style="background:#5d5544"></span>cuttings',
  cement: '<span class="sw" style="background:#ECE6D6"></span>Cement ↓ inside casing → out of shoe → ↑ annulus <span class="sw" style="background:#8A6A44"></span>displacement <span class="sw" style="background:#C0453A"></span>plug',
  oil: '<span class="sw" style="background:#E0A93A"></span>Oil: perforations → ESP intake → ↑ tubing → X-mas tree',
};

export class Hud {
  constructor() {
    this.cache = new Map();
    this.bannerId = null; this.bannerT = 0;
    this.toastT = 0;
    this.lastHole = 0;
    this.calloutKey = null;
    this.opMin = false;
    $('opMin').addEventListener('click', () => {
      this.opMin = !this.opMin;
      $('opcard').classList.toggle('min', this.opMin);
      $('opMin').textContent = this.opMin ? '+' : '–';
      $('opMin').setAttribute('aria-expanded', String(!this.opMin));
      this.onLayoutDirty?.();
    });
  }

  set(id, value, prop = 'textContent') {
    const k = `${id}.${prop}`;
    if (this.cache.get(k) === value) return;
    this.cache.set(k, value);
    if (prop === 'style.width') $(id).style.width = value; else $(id)[prop] = value;
  }

  update(S, dt, { playing }) {
    const ph = S.phase;
    this.set('opIdx', `${String(S.i + 1).padStart(2, '0')}/${PHASES.length}`);
    this.set('opName', ph.title.replace(/^Completion: .*/, 'Completion'));
    this.set('opStep', `· ${STEP_LABEL[S.step] ?? ''}`);
    const md = Math.max(0, S.readMD);
    this.set('roMD', fmt(md));
    this.set('roLabel', S.readLabel ? `· ${S.readLabel.toLowerCase()}` : '');
    this.set('roTVD', fmt(tvdAt(md)));
    this.set('roINC', `${incAt(md).toFixed(1)}°`);
    const sec = ph.sec >= 0 && ph.sec < 4 ? SECTIONS[ph.sec] : null;
    this.set('roMW', sec ? `${sec.mud.mw[1].toFixed(1)} ppg` : '—');
    this.set('roFM', md > 1 ? FORMATIONS[formationIndexAtMD(md)].name : '—');
    this.set('capIdx', `${String(S.i + 1).padStart(2, '0')}/${PHASES.length}`);
    this.set('capText', S.caption);

    // operation card
    const h = S.hud;
    if (h) {
      this.set('opTitle', h.title);
      const rows = h.rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
      this.set('opRows', rows, 'innerHTML');
      const prog = $('opBar').parentElement;
      const hasP = h.progress !== null && h.progress !== undefined;
      if (prog.hidden === hasP) prog.hidden = !hasP;
      if (hasP) {
        const pct = Math.round(Math.max(0, Math.min(1, h.progress)) * 100);
        this.set('opBar', `${pct}%`, 'style.width');
        this.set('opPct', `${pct}%`);
        prog.setAttribute('aria-valuenow', String(pct));
      }
      const flow = S.flow ? FLOW_HTML[S.flow] : '';
      this.set('opFlow', flow, 'innerHTML');
    }

    // milestone banner (shown at least 2.6 s)
    this.bannerT -= dt;
    if (S.banner && S.banner.id !== this.bannerId) {
      this.bannerId = S.banner.id;
      const b = $('banner');
      b.querySelector('b').textContent = S.banner.title;
      b.querySelector('span').textContent = S.banner.sub;
      b.classList.add('show');
      this.bannerT = 2.6;
    } else if (!S.banner && this.bannerT <= 0 && this.bannerId) {
      $('banner').classList.remove('show');
      this.bannerId = null;
    }

    // depth toasts while drilling forward
    if (playing && S.holeMD > this.lastHole && S.holeMD - this.lastHole < 400) {
      for (const [d, msg] of DEPTH_MARKS) if (this.lastHole < d && S.holeMD >= d) this.toast(msg);
    }
    this.lastHole = S.holeMD;
    if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) $('toast').classList.remove('show'); }

    // callout
    if (S.callout !== this.calloutKey) {
      this.calloutKey = S.callout;
      const c = $('callout');
      if (S.callout) {
        const d = CALLOUTS[S.callout];
        c.innerHTML = `<h4>${d.title}</h4><p>${d.text}</p>${d.list ? `<ul>${d.list.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}`;
        c.classList.add('show');
      } else c.classList.remove('show');
      this.onLayoutDirty?.();
    }
  }

  toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    this.toastT = 3.2;
  }

  /** Keep the callout just below the operation card. */
  syncCardHeight() {
    const h = $('opcard').getBoundingClientRect().height;
    document.getElementById('app').style.setProperty('--op-h', `${Math.round(h)}px`);
  }
}
