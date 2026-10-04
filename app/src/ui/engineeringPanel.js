/**
 * Engineering data panel – docked side panel on desktop / tablet landscape,
 * bottom sheet (closed / half / full) on tablet portrait and phones, side
 * drawer on phone landscape. Content uses progressive disclosure:
 *   Level 2 – hole, bit, mud, casing, formation (always visible)
 *   Level 3 – BHA, hydraulics, mud window, casing design, cement, well control, hazards (expandable)
 */
import { SECTIONS, WELL, COMPLETION, BHA_COLORS, DRILL_PIPE, FORMATIONS, formationIndexAtMD, DESIGN_FACTORS } from '../engineeringData.js';
import { fmt, clamp } from '../utils/math.js';
import { tvdAt } from '../trajectory.js';

const $ = (id) => document.getElementById(id);

function winBar(m) {
  const lo = 8, hi = 18, x = (v) => `${(((v - lo) / (hi - lo)) * 100).toFixed(1)}%`;
  return `<div class="win" role="img" aria-label="Mud window ${m.win[0]} to ${m.win[1]} ppg, programme ${m.mw[0]} to ${m.mw[1]} ppg">
   <div class="axis"></div><div class="safe" style="left:${x(m.win[0])};width:calc(${x(m.win[1])} - ${x(m.win[0])})"></div>
   <div class="prog" style="left:${x(m.mw[0])};width:max(4px,calc(${x(m.mw[1])} - ${x(m.mw[0])}))"></div>
   ${[8, 10, 12, 14, 16, 18].map((v) => `<span class="tk" style="left:${x(v)}">${v}</span>`).join('')}</div>`;
}
function sfRows(sf) {
  return `<div class="sf">${Object.entries(sf).map(([k, v]) => `<span>${k}</span><div class="bar"><i style="width:${clamp(v / 4) * 100}%"></i><s style="left:${(DESIGN_FACTORS[k] / 4) * 100}%"></s></div><span>${v.toFixed(2)}</span>`).join('')}</div>
  <p class="muted">Red tick = minimum design factor (burst 1.10, collapse 1.10, axial 1.30, triaxial 1.25).</p>`;
}
const legend = () => `<details class="blk"><summary><h3>Cutaway legend</h3></summary><div class="legend">
  <span><i style="background:#6F8767"></i>Formation (section)</span><span><i style="background:#4a5240"></i>Open-hole wall</span>
  <span><i style="background:#B08850"></i>Mud (darker = heavier)</span><span><i style="background:#D6CEBB"></i>Cement</span>
  <span><i style="background:#A3AFBB"></i>Casing / liner</span><span><i style="background:#E0A040"></i>Casing shoe ring</span>
  <span><i style="background:#97A1A8"></i>Drill pipe</span><span><i style="background:#C9A13D"></i>BHA (MWD)</span>
  <span><i style="background:#6F8CA3"></i>Tubing</span><span><i style="background:#7A5A3A"></i>Displacement fluid</span></div>
  <p class="muted">Not to scale radially: hole and tubular diameters are exaggerated 5×. MD positions, shoe depths, KOP, EOB and TD are true.</p></details>`;

function summaryHTML() {
  return `<div class="blk"><h3>Well summary</h3><dl class="kv">
    <dt>Type</dt><dd>${WELL.type}</dd><dt>TD</dt><dd>9,604 ft MD / 8,561 ft TVD</dd><dt>KOP</dt><dd>700 ft, build 2°/100 ft</dd>
    <dt>Max inclination</dt><dd>29.74° from 2,187 ft</dd><dt>Azimuth</dt><dd>${WELL.azimuth}°</dd><dt>Target</dt><dd>Fm-G, 8,261 ft TVD</dd><dt>Rig</dt><dd>${WELL.rig}</dd></dl></div>
    <div class="blk"><h3>Casing programme</h3><dl class="kv">
    <dt>30" conductor</dt><dd>120 ft</dd><dt>20" in 26" hole</dt><dd>2,000 ft MD</dd><dt>13-3/8" in 17-1/2"</dt><dd>5,000 ft MD</dd>
    <dt>9-5/8" in 12-1/4"</dt><dd>9,259 ft MD</dd><dt>7" liner in 8-1/2"</dt><dd>9,108–9,604 ft MD</dd></dl></div>
    <div class="blk"><h3>Formations</h3><dl class="kv">${FORMATIONS.map((f) => `<dt><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${f.color};margin-right:6px"></i>${f.name}</dt><dd>${fmt(f.md)} ft MD · ${f.lith}</dd>`).join('')}</dl></div>
    ${legend()}
    <div class="blk"><h3>How to read</h3><p class="muted">The well is cut in half (cutaway) so casing, cement, drill string and fluid flow are visible. Equipment is positioned by measured depth along the planned trajectory. Tap equipment for details.</p></div>`;
}

function completionHTML() {
  return `<div class="blk"><h3>Production string</h3><dl class="kv"><dt>Tubing</dt><dd>${COMPLETION.tubing}</dd><dt>Pump</dt><dd>${COMPLETION.esp}</dd>
    <dt>ESP setting</dt><dd>${fmt(COMPLETION.espTop)}–${fmt(COMPLETION.espBot)} ft MD (illustrative)</dd><dt>Perforations</dt><dd>4 intervals in Fm-G (illustrative)</dd><dt>Initial target</dt><dd>${WELL.initialRate}</dd></dl></div>
    <div class="blk"><h3>Wellhead and X-mas tree</h3><dl class="kv">${COMPLETION.wellhead.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></div>
    <details class="blk"><summary><h3>Perforation intervals</h3></summary><dl class="kv">${COMPLETION.perfs.map(([a, b], i) => `<dt>Interval ${i + 1}</dt><dd>${fmt(a)}–${fmt(b)} ft MD</dd>`).join('')}</dl></details>
    ${legend()}
    <div class="blk"><h3>Sequence</h3><p class="muted">Perforate with TCP guns, run the ESP on 3-1/2" tubing, nipple down the BOP, nipple up the X-mas tree, then production test. Amber particles show oil entering through the perforations and being pumped by the ESP to surface.</p></div>`;
}

function sectionHTML(s, md) {
  const fm = FORMATIONS[formationIndexAtMD(Math.max(md, s.top))];
  const bhaLen = s.bha.reduce((a, r) => a + r[2], 0);
  return `
   <p class="lvl">Level 2 · section summary</p>
   <div class="blk"><dl class="kv">
     <dt>Hole</dt><dd>${s.hole}, ${fmt(s.top)}–${fmt(s.bot)} ft MD</dd>
     <dt>Bit</dt><dd>${s.bit}</dd>
     <dt>Mud</dt><dd>${s.mud.type}, ${s.mud.mw[0].toFixed(1)}–${s.mud.mw[1].toFixed(1)} ppg</dd>
     <dt>Casing</dt><dd>${s.csg.name} @ ${fmt(s.csg.shoe)} ft MD${s.csg.tol ? ` (TOL ${fmt(s.csg.tol)})` : ''}</dd>
     <dt>Formation</dt><dd>${fm.name} – ${fm.lith}</dd>
     ${s.eval ? `<dt>Evaluation</dt><dd>${s.eval}</dd>` : ''}
   </dl></div>
   <p class="lvl">Level 3 · details</p>
   <details class="blk"><summary><h3>BHA (${fmt(bhaLen)} ft)</h3></summary><ol class="bha">${s.bha.map(([n, , l, t]) => `<li><i style="background:${BHA_COLORS[t]}"></i>${n}<em>${Math.round(l * 10) / 10} ft</em></li>`).join('')}<li><i style="background:#8E989F"></i>${DRILL_PIPE.name}<em>to surface</em></li></ol></details>
   <details class="blk"><summary><h3>Hydraulics</h3></summary><div class="grid3">
     <div class="met"><b>${fmt(s.hyd.gpm)}</b><span>gpm</span></div><div class="met"><b>${fmt(s.hyd.spp)}</b><span>SPP, psi</span></div><div class="met"><b>${s.hyd.hsi.toFixed(1)}</b><span>HSI, hp/in²</span></div>
     <div class="met"><b>${fmt(s.hyd.tq)}</b><span>torque, ft-lbf</span></div><div class="met"><b>${fmt(s.hyd.hl)}</b><span>hook load, kip</span></div><div class="met"><b>${s.hyd.tfa.toFixed(1)}</b><span>TFA in², liner ${s.hyd.liner}</span></div></div></details>
   <details class="blk"><summary><h3>Mud window</h3></summary><dl class="kv"><dt>Programme MW</dt><dd>${s.mud.mw[0].toFixed(1)}–${s.mud.mw[1].toFixed(1)} ppg</dd>
     <dt>Window</dt><dd>${s.mud.win[0].toFixed(1)}${s.mud.win2 ? ` (${s.mud.win2} below 6,200 ft)` : ''} to ${s.mud.win[1].toFixed(1)} ppg</dd></dl>${winBar(s.mud)}<p class="muted">${s.mud.note}</p></details>
   <details class="blk"><summary><h3>Casing ${s.csg.name}</h3></summary><dl class="kv"><dt>Spec</dt><dd>${s.csg.spec}</dd><dt>Shoe</dt><dd>${fmt(s.csg.shoe)} ft MD / ${fmt(s.csg.shoeTVD)} ft TVD</dd>${s.csg.tol ? `<dt>Top of liner</dt><dd>${fmt(s.csg.tol)} ft MD / ${fmt(tvdAt(s.csg.tol))} ft TVD</dd>` : ''}</dl>
     <p class="muted" style="margin:8px 0 6px">Minimum safety factors (StressCheck)</p>${sfRows(s.csg.sf)}</details>
   <details class="blk"><summary><h3>Cement</h3></summary><p class="muted" style="margin:0">${s.cem}</p></details>
   <details class="blk"><summary><h3>Well control</h3></summary><dl class="kv"><dt>Equipment</dt><dd>${s.wc.bop}</dd><dt>Kick tolerance</dt><dd>${s.wc.kt}</dd><dt>LOT</dt><dd>${s.wc.lot}</dd></dl></details>
   <details class="blk"><summary><h3>Hazards</h3></summary><div class="chips">${s.haz.map((h) => `<span class="chip">${h}</span>`).join('')}</div></details>
   ${legend()}`;
}

export class EngineeringPanel {
  constructor({ onStateChange }) {
    this.el = $('eng');
    this.body = $('engBody');
    this.onStateChange = onStateChange;
    this.sec = null;
    this.layout = null;
    this.userTouched = false;
    $('engHandle').addEventListener('click', () => { if (this._dragged) return; this.toggle(); });
    $('engHalf').addEventListener('click', () => this.setState('half'));
    $('engFull').addEventListener('click', () => this.setState('full'));
    $('engClose').addEventListener('click', () => this.setState('closed'));
    $('btnSheet').addEventListener('click', () => this.toggle());
    $('btnData').addEventListener('click', () => this.toggle());
    this._drag();
  }

  get sheet() { return this.layout === 'phone' || this.layout === 'tablet'; }
  get isOpen() { return this.el.dataset.state !== 'closed'; }

  setLayout(layout) {
    const prev = this.layout;
    this.layout = layout;
    if (prev === layout) return;
    // default state per layout: docked open on desktop, closed elsewhere
    if (!this.userTouched || (prev && (prev === 'desktop') !== (layout === 'desktop'))) this.setState(layout === 'desktop' ? 'open' : 'closed', false);
    else if (this.sheet && this.el.dataset.state === 'open') this.setState('half', false);
    else if (!this.sheet && (this.el.dataset.state === 'half' || this.el.dataset.state === 'full')) this.setState('open', false);
  }

  toggle() {
    const s = this.el.dataset.state;
    if (s === 'closed') this.setState(this.sheet ? 'half' : 'open');
    else this.setState('closed');
  }

  setState(state, user = true) {
    if (user) this.userTouched = true;
    if (!this.sheet && (state === 'half' || state === 'full')) state = 'open';
    this.el.dataset.state = state;
    const open = state !== 'closed';
    for (const id of ['engHandle', 'btnSheet', 'btnData']) $(id).setAttribute('aria-expanded', String(open));
    $('btnSheet').querySelector('span').textContent = open ? '↓' : '↑';
    this.onStateChange?.(state);
  }

  _drag() {
    const h = $('engHandle');
    let y0 = null;
    h.addEventListener('pointerdown', (e) => { if (!this.sheet) return; y0 = e.clientY; this._dragged = false; h.setPointerCapture(e.pointerId); });
    h.addEventListener('pointermove', (e) => { if (y0 !== null && Math.abs(e.clientY - y0) > 8) this._dragged = true; });
    h.addEventListener('pointerup', (e) => {
      if (y0 === null) return;
      const dy = e.clientY - y0; y0 = null;
      if (!this._dragged) return;
      const order = ['closed', 'half', 'full'];
      const i = order.indexOf(this.el.dataset.state);
      this.setState(order[clamp(i + (dy < 0 ? 1 : -1), 0, 2)]);
      setTimeout(() => { this._dragged = false; }, 0);
    });
  }

  render(sec, S) {
    const key = `${sec}`;
    if (key === this.sec) return;
    this.sec = key;
    const open = [...this.body.querySelectorAll('details[open] summary h3')].map((h) => h.textContent.split(' ')[0]);
    if (sec === -1) { $('engTitle').textContent = 'Alpha-05'; this.body.innerHTML = summaryHTML(); }
    else if (sec === 4) { $('engTitle').textContent = 'Completion'; this.body.innerHTML = completionHTML(); }
    else { $('engTitle').textContent = `Section ${SECTIONS[sec].hole}`; this.body.innerHTML = sectionHTML(SECTIONS[sec], S.holeMD); }
    // keep previously expanded groups expanded
    for (const d of this.body.querySelectorAll('details')) if (open.includes(d.querySelector('h3').textContent.split(' ')[0])) d.open = true;
  }

  setSub(text) { const el = $('engSub'); if (el.textContent !== text) el.textContent = text; }
}
