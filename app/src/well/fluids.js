/**
 * Lightweight flow particles (single BufferGeometry, no per-frame allocation).
 *
 *  mud    : ↓ inside drill string → out of the bit → ↑ annulus, with cuttings tinted by the formation at the bit
 *  cement : along the cement path – ↓ inside casing, out of the shoe, ↑ annulus; displacement fluid behind
 *  oil    : reservoir → perforations → liner/casing bore → ESP intake → ↑ tubing
 *
 * Particles sit close to the cutaway plane (z ≲ 0) so they read in section.
 */
import { BufferGeometry, BufferAttribute, Points, PointsMaterial, Color, DynamicDrawUsage } from 'three';
import { SECTIONS, FORMATIONS, formationIndexAtMD, COMPLETION, CASING_BY_KEY, ESP_PARTS } from '../engineeringData.js';
import { rad, CELLAR_DEPTH } from '../constants.js';
import { survey } from '../trajectory.js';
import { dotTexture } from '../utils/textures.js';
import { mudColor } from './wellbore.js';
import { rng } from '../utils/textures.js';
import { frac } from '../utils/math.js';

const MAX = 1600;
const _s = {};
const C = {
  cement: new Color('#ECE6D6'), cementTail: new Color('#CFC6B0'), disp: new Color('#8A6A44'),
  oil: new Color('#E0A93A'), gas: new Color('#F3E3B5'), white: new Color('#ffffff'),
};

export class FluidParticles {
  constructor(scene) {
    this.positions = new Float32Array(MAX * 3);
    this.colors = new Float32Array(MAX * 3);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(this.positions, 3).setUsage(DynamicDrawUsage));
    g.setAttribute('color', new BufferAttribute(this.colors, 3).setUsage(DynamicDrawUsage));
    this.geometry = g;
    this.material = new PointsMaterial({ size: 1.5, map: dotTexture(), vertexColors: true, transparent: true, alphaTest: 0.15, depthWrite: false, sizeAttenuation: true });
    this.points = new Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 3;
    this.points.visible = false;
    scene.add(this.points);
    const r = rng(42);
    this.p = Array.from({ length: MAX }, (_, j) => ({
      u: r(), r: r(), side: r() < 0.5 ? -1 : 1, d: 0.08 + r() * 0.45, sp: 0.6 + r() * 0.8, k: r(), cut: r() < 0.22,
    }));
    this.count = 700;
    this.window = 650;
    this._tmp = new Color();
    this._mud = new Color();
  }

  setBudget(n) { this.count = Math.min(MAX, n); }

  /** World position of a particle at md, radius r, on one side of the cut plane. */
  _put(j, md, r, q) {
    survey(md, _s);
    const nx = Math.cos(_s.inc), ny = Math.sin(_s.inc);
    const c = Math.cos(q.d) * q.side, s = -Math.sin(q.d);
    this.positions[j * 3] = _s.vs + nx * r * c;
    this.positions[j * 3 + 1] = -_s.tvd + ny * r * c;
    this.positions[j * 3 + 2] = r * s;
  }
  _col(j, c) { this.colors[j * 3] = c.r; this.colors[j * 3 + 1] = c.g; this.colors[j * 3 + 2] = c.b; }

  update(S, dt, ctx) {
    const mode = S.flow;
    this.points.visible = !!mode;
    if (!mode) return;
    const n = this.count;
    if (mode === 'mud') this._mudFlow(S, dt, n, ctx);
    else if (mode === 'cement') this._cementFlow(S, dt, n);
    else this._oilFlow(S, dt, n);
    this.geometry.setDrawRange(0, n);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  _mudFlow(S, dt, n, ctx) {
    const d = S.drill; if (!d) { this.points.visible = false; return; }
    const sec = SECTIONS[d.sec];
    const bit = d.bitMD, top = Math.max(CELLAR_DEPTH, bit - this.window);
    const span = bit - top;
    if (span < 5) { this.points.visible = false; return; }
    mudColor(sec.mud.mw[1], this._mud);
    const down = this._tmp.copy(this._mud).lerp(C.white, 0.55);
    const up = this._mud.clone().lerp(C.white, 0.18);
    const cutC = new Color(FORMATIONS[formationIndexAtMD(bit)].color).multiplyScalar(0.55);
    const bhaLen = ctx.bhaLength ?? 300;
    const nDown = Math.floor(n * 0.32);
    for (let j = 0; j < n; j++) {
      const q = this.p[j];
      if (j < nDown) {
        // inside the string, flowing down
        q.u = (q.u + dt * q.sp * 0.5) % 1;
        const md = top + q.u * span;
        const inner = md > bit - bhaLen ? rad(2.8) : rad(4.2);
        this._put(j, md, q.r * inner * 0.9, q);
        this._col(j, down);
      } else {
        // annulus, flowing up; first few feet spread out of the bit nozzles
        q.u = (q.u + dt * q.sp * 0.34) % 1;
        const md = bit - q.u * span;
        const strOD = md > bit - bhaLen ? ctx.bhaRadius(md) : rad(5);
        const outer = ctx.bore(md) * 0.95;
        const rr = strOD + 0.15 + q.r * Math.max(0.1, outer - strOD - 0.3);
        this._put(j, md, rr, q);
        this._col(j, q.cut ? cutC : up);
      }
    }
  }

  _cementFlow(S, dt, n) {
    const cem = S.cement; if (!cem) { this.points.visible = false; return; }
    const c = CASING_BY_KEY[cem.key];
    const total = cem.Li + cem.La;
    const focusX = cem.front;
    const xa = Math.max(0, focusX - this.window * 1.4), xb = Math.min(total, focusX + 40);
    const span = xb - xa;
    if (span < 5) { this.points.visible = false; return; }
    const inR = c.liner ? (md) => (md < c.top ? rad(4.2) * 0.85 : rad(c.od) * 0.8) : () => rad(c.od) * 0.8;
    const annIn = rad(c.od) + 0.15;
    const annOut = c.liner ? (md) => (md > 9259 ? rad(c.hole) * 0.95 : rad(9.625) * 0.88) : () => rad(c.hole) * 0.95;
    for (let j = 0; j < n; j++) {
      const q = this.p[j];
      q.u = (q.u + dt * q.sp * 0.42) % 1;
      const x = xa + q.u * span;
      if (x > cem.front) { this.positions[j * 3 + 2] = 1e6; continue; } // ahead of the front: nothing pumped yet
      const isCement = x >= cem.tail;
      let md, r;
      if (x <= cem.Li) { md = cem.insideTop + x; r = q.r * inR(md); }
      else { md = c.shoe - (x - cem.Li); r = annIn + q.r * Math.max(0.1, annOut(md) - annIn); }
      this._put(j, md, r, q);
      this._col(j, isCement ? (q.cut ? C.cementTail : C.cement) : C.disp);
    }
  }

  _oilFlow(S, dt, n) {
    const perfTop = COMPLETION.perfs[0][0], perfBot = COMPLETION.perfs[3][1];
    const espBot = COMPLETION.espBot;
    const intake = espBot - (ESP_PARTS[0][2] + ESP_PARTS[1][2] + ESP_PARTS[2][2] + ESP_PARTS[3][2] / 2);
    const espTop = COMPLETION.espTop;
    const top = espTop - 900;
    const span = perfBot - top;
    for (let j = 0; j < n; j++) {
      const q = this.p[j];
      q.u = (q.u + dt * q.sp * 0.16) % 1;
      // particles start at a perforation interval, enter radially, then rise
      // enter only at the perforated intervals
      const iv = COMPLETION.perfs[Math.min(COMPLETION.perfs.length - 1, Math.floor(q.k * COMPLETION.perfs.length))];
      const startMD = iv[0] + frac(q.k * COMPLETION.perfs.length) * (iv[1] - iv[0]);
      const life = q.u;
      if (life < 0.12) {
        const e = life / 0.12;
        this._put(j, startMD, rad(7) + 3.2 * (1 - e), q);
      } else {
        const md = startMD - (life - 0.12) / 0.88 * (startMD - top);
        let r;
        if (md > espBot) r = q.r * rad(7) * 0.8;                                     // liner / casing bore below pump
        else if (md > intake) r = rad(5.4) + 0.15 + q.r * (rad(9.625) * 0.85 - rad(5.4)); // past the motor to the intake
        else if (md > espTop) r = q.r * rad(5.4) * 0.7;                              // through the pump
        else r = q.r * rad(3.5) * 0.7;                                              // inside the tubing
        this._put(j, md, r, q);
      }
      this._col(j, q.cut ? C.gas : C.oil);
    }
    void span;
  }
}
