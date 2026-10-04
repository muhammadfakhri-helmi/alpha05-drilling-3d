/**
 * Open hole walls (formation-tinted rock) and the mud column.
 * Hole walls grow with the drilled depth exactly (no draw-range stepping).
 */
import { Color, Group } from 'three';
import { SECTIONS, FORMATIONS, formationIndexAtMD, CASINGS } from '../engineeringData.js';
import { rad, CELLAR_DEPTH } from '../constants.js';
import { Mat } from '../utils/materials.js';
import { TrajectoryTube } from './tubular.js';

const fmColor = FORMATIONS.map((f) => new Color(f.color).multiplyScalar(0.42));
const fmBreaks = FORMATIONS.slice(1).map((f) => ({ md: f.md, split: true }));

/** Mud colour darkens with mud weight (kept from the original mockup). */
export function mudColor(mw, target = new Color()) {
  return target.set('#D2BD91').lerp(new Color('#6A4A2B'), Math.min(1, Math.max(0, (mw - 8.5) / 6.8)));
}

export class Wellbore {
  constructor(scene) {
    this.group = new Group();
    this.group.name = 'wellbore';
    scene.add(this.group);
    this.holes = SECTIONS.map((s) => {
      const t = new TrajectoryTube({
        radius: rad(s.holeIn), material: Mat.holeWall(), radialSegments: 32, sampleStep: 10, straightStep: 120,
        breaks: fmBreaks, colorFn: (md, c) => c.copy(fmColor[formationIndexAtMD(md)]), maxLength: s.bot - s.top + 10,
        edgeColor: '#1d1712', edgeOpacity: 0.75,
      });
      t.mesh.userData.pick = { id: `hole-${s.id}`, title: `${s.hole} open hole`, kind: 'hole', info: `Open hole drilled with the ${s.bit} bit; wall coloured by formation.`, interval: () => [s.top, s.bot] };
      this.group.add(t.mesh);
      return { sec: s, tube: t };
    });
    // mud column – radius follows the innermost bore at each MD
    this.boreFn = (md) => this._bore(md) * 0.88; // sits behind cement / displacement shells (0.86 × casing radius)
    const breaks = [120, 2000, 5000, 9108, 9259].map((md) => ({ md, split: true }));
    this.mudMat = Mat.mud('#B08850');
    this.mud = new TrajectoryTube({ radius: this.boreFn, material: this.mudMat, radialSegments: 24, sampleStep: 12, straightStep: 150, breaks });
    this.mud.mesh.renderOrder = 2;
    this.mud.mesh.userData.pick = { id: 'mud', title: 'Drilling fluid', kind: 'mud', info: 'Mud column: controls formation pressure, carries cuttings and stabilises the hole.' };
    this.group.add(this.mud.mesh);
    this._casingSig = '';
    this._S = null;
  }

  _bore(md) {
    const S = this._S;
    let r = Infinity;
    if (S) {
      for (const c of CASINGS) {
        const cs = c.liner ? S.liner : S.casings[c.key];
        if (cs && cs.state === 'set' && md >= c.top - 0.01 && md <= c.shoe + 0.01) r = Math.min(r, rad(c.od) * 0.9);
      }
    }
    if (r === Infinity) {
      const s = SECTIONS.find((x) => md >= x.top && md <= x.bot);
      r = s ? rad(s.holeIn) : rad(30) * 0.9;
    }
    return r;
  }

  update(S) {
    this._S = S;
    for (const h of this.holes) {
      const bot = Math.min(S.holeMD, h.sec.bot);
      if (bot > h.sec.top) h.tube.setInterval(h.sec.top, bot); else h.tube.setVisible(false);
    }
    // mud column: changes with depth or casing state
    const sig = CASINGS.map((c) => (c.liner ? S.liner?.state : S.casings[c.key].state)).join();
    const force = sig !== this._casingSig;
    this._casingSig = sig;
    const secIdx = S.phase.sec >= 0 && S.phase.sec < 4 ? S.phase.sec : S.phase.sec === 4 ? 3 : 0;
    const fluidMW = S.phase.sec === 4 ? 8.6 : SECTIONS[secIdx].mud.mw[1];
    mudColor(fluidMW, this.mudMat.color);
    if (S.holeMD > CELLAR_DEPTH + 1) this.mud.setInterval(CELLAR_DEPTH, S.holeMD, force); else this.mud.setVisible(false);
  }
}
