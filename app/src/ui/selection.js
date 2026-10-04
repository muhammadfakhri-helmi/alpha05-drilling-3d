/**
 * Tap / click equipment inspection (Raycaster). Works with touch (tap = short
 * press without drag); no hover or right-click is required. Hits on the
 * clipped (cut-away) half of downhole geometry are ignored.
 */
import { Raycaster, Vector2, Vector3 } from 'three';
import { CELLAR_DEPTH } from '../constants.js';
import { fmt } from '../utils/math.js';
import { tvdAt } from '../trajectory.js';

const $ = (id) => document.getElementById(id);
const KIND = { bha: 'BHA component', pipe: 'Drill string', casing: 'Casing', shoe: 'Casing shoe', liner: 'Liner', hanger: 'Liner hanger', tool: 'Downhole tool', esp: 'Completion', tubing: 'Completion', perf: 'Completion', cement: 'Cement', hole: 'Wellbore', mud: 'Fluid', target: 'Target', surface: 'Surface equipment', wellhead: 'Wellhead', bop: 'Well control', tree: 'Wellhead' };

function visibleChain(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }
function clipped(hit) {
  const m = hit.object.material;
  return !!(m && m.clippingPlanes && m.clippingPlanes.length && hit.point.z > 0.02 && hit.point.y < -CELLAR_DEPTH);
}

export class Selection {
  constructor({ canvas, camera, roots, getState, onSelect }) {
    this.canvas = canvas; this.camera = camera; this.roots = roots; this.getState = getState; this.onSelect = onSelect;
    this.ray = new Raycaster();
    this.ndc = new Vector2();
    this.selected = null;
    this.point = new Vector3();
    let down = null;
    canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, multi: !e.isPrimary }; });
    canvas.addEventListener('pointerup', (e) => {
      if (!down || e.pointerId !== down.id) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
      down = null;
      if (moved < 7 && dt < 450) this.pick(e.clientX, e.clientY);
    });
    $('pickClose').addEventListener('click', () => this.clear());
  }

  pick(cx, cy) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const hits = this.ray.intersectObjects(this.roots, true);
    const hit = hits.find((h) => h.object.userData.pick && visibleChain(h.object) && !clipped(h));
    if (!hit) { this.clear(); return; }
    this.selected = hit.object.userData.pick;
    this.point.copy(hit.point);
    this.render();
    this.onSelect?.(this.selected);
  }

  clear() {
    if (!this.selected && $('pick').hidden) return;
    this.selected = null;
    $('pick').hidden = true;
    this.onSelect?.(null);
  }

  /** Re-render the card (current-operation relevance and live MD change with time). */
  render() {
    const p = this.selected; if (!p) return;
    const S = this.getState();
    $('pick').hidden = false;
    $('pickKind').textContent = KIND[p.kind] ?? 'Equipment';
    $('pickTitle').textContent = p.title;
    $('pickInfo').textContent = p.info ?? '';
    const rows = [];
    const iv = p.interval?.();
    if (iv && Number.isFinite(iv[0]) && Number.isFinite(iv[1])) {
      const a = Math.max(0, iv[0]), b = Math.max(0, iv[1]);
      if (Math.abs(b - a) < 0.5) rows.push(['Depth', `${fmt(b)} ft MD / ${fmt(tvdAt(b))} ft TVD`]);
      else rows.push(['Interval', `${fmt(a)}–${fmt(b)} ft MD`], ['Length', `${fmt(b - a)} ft`]);
    }
    rows.push(['Now', relevance(p, S)]);
    $('pickRows').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  }
}

function relevance(p, S) {
  const step = S.step;
  switch (p.kind) {
    case 'bha': case 'pipe': return S.drill ? (S.drill.drilling ? 'Drilling – rotating on bottom' : step.startsWith('POOH') ? 'Pulling out of hole' : step === 'TRIP_IN' ? 'Tripping in' : 'Circulating') : S.tcp ? 'Conveying TCP guns' : S.liner?.runString ? 'Liner running string' : 'Not in use';
    case 'casing': case 'shoe': {
      const cs = S.casings[p.id?.split('-')[0]];
      if (!cs || cs.state === 'none') return 'Not yet run';
      if (cs.state === 'running') return `Running – shoe at ${fmt(Math.max(0, cs.shoeMD))} ft`;
      return S.cement && S.cement.key === p.id?.split('-')[0] ? 'Being cemented' : cs.cemented ? 'Installed and cemented' : 'Landed';
    }
    case 'liner': case 'hanger': return S.liner ? (S.liner.state === 'running' && !S.liner.hangerSet ? 'Running in hole' : S.liner.cemented ? 'Set and cemented' : 'Hanger set') : 'Not yet run';
    case 'cement': return S.cement ? `Pumping – ${S.cement.where}` : 'In place';
    case 'esp': case 'tubing': return S.flow === 'oil' ? 'Producing' : S.tubing ? 'Running / installed' : 'Not yet run';
    case 'perf': return S.perf > 0 ? 'Open to flow' : 'Not yet perforated';
    case 'tool': return S.wireline ? `Logging at ${fmt(Math.max(0, S.wireline.toolMD))} ft` : S.tcp ? (S.tcp.fired ? 'Guns fired' : 'Running to depth') : S.liner?.runString ? (S.liner.released ? 'Released from hanger' : 'Latched in hanger') : 'Not in use';
    case 'bop': case 'wellhead': case 'tree': return 'Pressure containment at surface';
    default: return S.phase.title;
  }
}
