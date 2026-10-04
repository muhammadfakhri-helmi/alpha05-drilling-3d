/**
 * Wellhead sections, diverter, BOP stacks and X-mas tree (in the cellar,
 * modelled at true scale – these are surface equipment, not exaggerated).
 * Configuration per stage follows the plan's well-control equipment list.
 */
import { Group, Mesh, CylinderGeometry, BoxGeometry, TorusGeometry, MeshStandardMaterial } from 'three';
import { Mat } from '../utils/materials.js';
import { lerp } from '../utils/math.js';

const stl = () => Mat.galvanized();
const handWheel = () => Mat.paintedSteel('#B8322B');

function flanged(r, h, mat, y, parent) {
  const g = new Group();
  g.add(new Mesh(new CylinderGeometry(r, r, h, 24), mat));
  for (const dy of [h / 2 - 0.3, -h / 2 + 0.3]) {
    const f = new Mesh(new CylinderGeometry(r * 1.35, r * 1.35, 0.6, 24), mat); f.position.y = dy; g.add(f);
    for (let q = 0; q < 12; q++) {
      const bt = new Mesh(new CylinderGeometry(0.08, 0.08, 0.9, 5), stl());
      const a = (q / 12) * Math.PI * 2; bt.position.set(Math.cos(a) * r * 1.25, dy, Math.sin(a) * r * 1.25); g.add(bt);
    }
  }
  g.position.y = y; parent.add(g); return g;
}
function outlet(x, y, z, dir, mat, parent, wheel) {
  const g = new Group();
  const p = new Mesh(new CylinderGeometry(0.35, 0.35, 2.4, 12), mat); p.rotation.z = Math.PI / 2; p.position.x = 1.2; g.add(p);
  const v = new Mesh(new BoxGeometry(1.1, 1.2, 1.1), mat); v.position.x = 2.3; g.add(v);
  if (wheel) { const w = new Mesh(new TorusGeometry(0.6, 0.08, 6, 18), handWheel()); w.position.set(2.3, 1.3, 0); w.rotation.x = Math.PI / 2; g.add(w); }
  g.position.set(x, y, z); g.rotation.y = dir; parent.add(g); return g;
}
function ramBody(y, mat, parent) {
  const g = new Group();
  g.add(new Mesh(new BoxGeometry(3.4, 1.6, 3.2), mat));
  for (const sd of [-1, 1]) { const c = new Mesh(new CylinderGeometry(0.9, 0.9, 2.4, 16), mat); c.rotation.z = Math.PI / 2; c.position.x = sd * 2.9; g.add(c); }
  g.position.y = y; parent.add(g); return g;
}

const tag = (g, pick) => g.traverse((o) => { o.userData.pick = pick; });

export class WellheadStack {
  constructor(scene) {
    this.group = new Group();
    this.group.name = 'wellhead';
    scene.add(this.group);
    const green = Mat.wellheadPaint(), red = Mat.bopPaint();
    const s1 = new Group(), s2 = new Group(), s3 = new Group();
    this.group.add(s1, s2, s3);
    flanged(1.35, 2.8, green, -8.4, s1); outlet(0, -8.4, 0, 0, green, s1, true); outlet(0, -8.4, 0, Math.PI, green, s1, true);
    flanged(1.1, 2.8, green, -5.5, s2); outlet(0, -5.5, 0, 0, green, s2, true); outlet(0, -5.5, 0, Math.PI, green, s2, true);
    flanged(0.95, 2.6, green, -2.8, s3); outlet(0, -2.8, 0, 0, green, s3, true); outlet(0, -2.8, 0, Math.PI, green, s3, true);
    tag(s1, { id: 'wh1', title: 'Casing head 21-1/4" x 20"', kind: 'wellhead', info: 'Lowermost wellhead section, landed on the 20" surface casing.' });
    tag(s2, { id: 'wh2', title: 'Casing spool 21-1/4" 2K x 13-5/8" 5K', kind: 'wellhead', info: 'Suspends the 13-3/8" casing and provides annulus access.' });
    tag(s3, { id: 'wh3', title: 'Tubing head spool 13-5/8" 5K x 11" 5K', kind: 'wellhead', info: 'Suspends the 9-5/8" casing; later carries the tubing hanger.' });
    this.wh = [s1, s2, s3];

    // diverter (26" section)
    const dv = new Group(); this.group.add(dv);
    flanged(1.9, 3, stl(), -8, dv);
    const cross = new Mesh(new BoxGeometry(3, 2.6, 3), stl()); cross.position.y = -5; dv.add(cross); outlet(0, -5, 0, Math.PI, stl(), dv, false);
    flanged(1.9, 2, stl(), -2.8, dv);
    const ann = new Mesh(new CylinderGeometry(3, 3.3, 5.6, 28), red); ann.position.y = 1; dv.add(ann);
    const riser = new Mesh(new CylinderGeometry(1.4, 1.4, 20, 18), Mat.darkSteel()); riser.position.y = 14; dv.add(riser);
    tag(dv, { id: 'diverter', title: 'Diverter 29-1/2" x 500 psi', kind: 'bop', info: 'Diverts shallow gas away from the rig while drilling the 26" surface hole.' });
    this.div = dv;

    const mk = (scale, rams, pick) => {
      const g = new Group(); let y = 0;
      flanged(1.05 * scale, 2.2, red, y + 1.1, g); y += 2.2;
      const mc = new Mesh(new BoxGeometry(2.6 * scale, 2.2, 2.6 * scale), red); mc.position.y = y + 1.1; g.add(mc);
      outlet(0, y + 1.1, 0, 0, red, g, true); outlet(0, y + 1.1, 0, Math.PI, red, g, true); y += 2.2;
      for (let q = 0; q < rams; q++) { ramBody(y + 0.9, red, g); y += 1.8; }
      const an = new Mesh(new CylinderGeometry(2.1 * scale, 2.6 * scale, 4.2, 28), red); an.position.y = y + 2.1; g.add(an); y += 4.2;
      const bnH = 26.5 - y + 2;
      const bn = new Mesh(new CylinderGeometry(1.1, 1.1, bnH, 16), Mat.darkSteel()); bn.position.y = y + bnH / 2 - 1; g.add(bn);
      tag(g, pick);
      g.userData.h = y; this.group.add(g); return g;
    };
    this.b21 = mk(1.25, 2, { id: 'bop21', title: 'BOP 21-1/4" x 2,000 psi', kind: 'bop', info: 'Annular + 2 rams for the 17-1/2" section.' });
    this.b13 = mk(1.0, 3, { id: 'bop13', title: 'BOP 13-5/8" (annular + 3 rams)', kind: 'bop', info: 'Well-control stack for the 12-1/4" and 8-1/2" sections.' });

    // X-mas tree
    const tr = new Group(); this.group.add(tr);
    const tv = (yy) => {
      const v = new Mesh(new BoxGeometry(1.5, 1.4, 1.5), green); v.position.y = yy; tr.add(v);
      const w = new Mesh(new TorusGeometry(0.9, 0.1, 6, 22), handWheel()); w.position.set(0, yy, 1.3); tr.add(w);
      const sp = new Mesh(new CylinderGeometry(0.08, 0.08, 0.8, 5), handWheel()); sp.rotation.x = Math.PI / 2; sp.position.set(0, yy, 1.0); tr.add(sp);
    };
    flanged(0.8, 1, green, 0.5, tr); tv(1.9); tv(3.5);
    const tc = new Mesh(new BoxGeometry(1.6, 1.6, 1.6), green); tc.position.y = 5.2; tr.add(tc);
    outlet(0, 5.2, 0, 0, green, tr, true); outlet(0, 5.2, 0, Math.PI, green, tr, true);
    tv(6.9);
    const cap = new Mesh(new CylinderGeometry(0.45, 0.6, 1.2, 14), green); cap.position.y = 8.2; tr.add(cap);
    const gauge = new Mesh(new CylinderGeometry(0.5, 0.5, 0.25, 18), new MeshStandardMaterial({ color: '#E6E3DA' })); gauge.rotation.x = Math.PI / 2; gauge.position.set(0, 9.2, 0); tr.add(gauge);
    const ch = new Mesh(new BoxGeometry(1, 1.2, 1), green); ch.position.set(4.8, 5.2, 0); tr.add(ch);
    const fl = new Mesh(new CylinderGeometry(0.35, 0.35, 30, 10), Mat.galvanized()); fl.rotation.z = Math.PI / 2; fl.position.set(20, 5.2, 0); tr.add(fl);
    tag(tr, { id: 'tree', title: 'X-mas tree (API 6A, PSL2, PR2)', kind: 'tree', info: 'Master, wing and swab valves (3-1/8" 5K) controlling production from the tubing.' });
    this.tree = tr;
    this.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }

  update(S) {
    this.wh.forEach((g, j) => { g.visible = S.wh > j; });
    this.div.visible = S.bop === 'div';
    const base = S.wh === 0 ? -10 : S.wh === 1 ? -7 : S.wh === 2 ? -4 : -1.5;
    for (const k of ['b21', 'b13']) {
      const g = this[k];
      g.visible = S.bop === k && S.bopLift < 0.98;
      g.position.y = base + (k === 'b13' ? S.bopLift * 22 : 0);
    }
    this.tree.visible = S.bop === 'tree';
    this.tree.position.y = lerp(-1.5, 18, S.treeDrop);
  }

  /** Label anchor for the active stack. */
  anchorY(S) { return S.bop === 'tree' ? 6 : 8; }
}
