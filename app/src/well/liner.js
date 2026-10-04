/**
 * 7" liner system:  running string (DP) → running tool → liner hanger → 7" liner → liner shoe.
 * The liner only ever occupies its own MD interval (TOL → shoe); it never
 * extends to surface. The running string is a separate assembly that releases
 * from the hanger and is pulled out after cementing.
 */
import { Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CASING_BY_KEY, DRILL_PIPE } from '../engineeringData.js';
import { rad, JOINT } from '../constants.js';
import { Mat, cut } from '../utils/materials.js';
import { StringAssembly } from './stringAssembly.js';
import { TrajectoryTube, JointInstancer } from './tubular.js';
import { placeAtMD } from '../trajectory.js';

const HANGER_LEN = 14;

function makeLinerShoe(od) {
  const r = rad(od);
  const g = new Group();
  const body = new Mesh(new CylinderGeometry(r * 1.07, r * 1.07, 2.4, 24, 1, true), cut(new MeshStandardMaterial({ color: '#AEB7BF', metalness: 0.6, roughness: 0.35 })));
  body.position.y = 2.2;
  const nose = new Mesh(new CylinderGeometry(r * 1.0, r * 0.55, 1.0, 24), cut(new MeshStandardMaterial({ color: '#D8D0BC', roughness: 0.85, emissive: '#F2C27D', emissiveIntensity: 0.12 })));
  nose.position.y = 0.5;
  const ring = new Mesh(new CylinderGeometry(r * 1.1, r * 1.1, 0.45, 24, 1, true), cut(new MeshStandardMaterial({ color: '#E0A040', metalness: 0.4, roughness: 0.4, emissive: '#C07020', emissiveIntensity: 0.35 })));
  ring.position.y = 3.2;
  g.add(body, nose, ring);
  return g;
}

/** Slips modelled around +Y; their radial position is animated when the hanger sets. */
function makeSlips(count = 6) {
  const g = new Group();
  const mat = new MeshStandardMaterial({ color: '#D2A64A', metalness: 0.55, roughness: 0.35, emissive: '#6b4a17', emissiveIntensity: 0.25 });
  g.userData.slips = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const parts = [];
    for (let k = 0; k < 4; k++) { const t = new BoxGeometry(0.28, 0.5, 0.7); t.translate(0, 0.6 + k * 0.9, 0); parts.push(t); }
    const m = new Mesh(mergeGeometries(parts), mat);
    m.userData.angle = a;
    m.rotation.y = -a;
    g.add(m);
    g.userData.slips.push(m);
  }
  return g;
}

export class LinerSystem {
  constructor(scene) {
    const c = CASING_BY_KEY.c7;
    this.def = c;
    this.group = new Group();
    this.group.name = 'liner';
    scene.add(this.group);
    const linerPick = { id: 'c7', title: '7" liner', kind: 'liner', info: 'Liner hung from the 9-5/8" casing: covers only the 8-1/2" reservoir section, saving casing back to surface.', interval: () => [this.top, this.shoe] };
    const shoePick = { id: 'c7-shoe', title: '7" liner shoe', kind: 'shoe', info: 'Liner float shoe at TD.', interval: () => [this.shoe, this.shoe] };
    this.hangerPick = { id: 'hanger', title: 'Liner hanger', kind: 'hanger', info: 'Slips grip the 9-5/8" casing to carry the liner weight; the top packer seals the liner lap.', interval: () => [this.top, this.top + HANGER_LEN] };
    this.toolPick = { id: 'runtool', title: 'Liner running tool', kind: 'tool', info: 'Connects the drill-pipe running string to the hanger; released by rotation/pressure after the hanger is set.', interval: () => [this.runBottom - 10, this.runBottom] };

    this.bodyMat = Mat.casingSteel(c.color);
    this.liner = new StringAssembly({
      name: '7" liner',
      components: [{ key: 'c7-shoe', name: 'Liner shoe', length: 3.4, rigid: () => makeLinerShoe(c.od), pick: shoePick }],
      pipe: { name: '7" liner', radius: rad(c.od), material: this.bodyMat, radialSegments: 24, spacing: JOINT.casing, jointRadius: rad(c.od) * 1.08, jointLength: 1.2, jointMaterial: Mat.coupling(c.color), pick: linerPick },
      maxPipeLength: 600,
    });
    this.group.add(this.liner.group);

    // hanger body + packer + slips
    this.hanger = new TrajectoryTube({ radius: rad(8.2), material: cut(new MeshStandardMaterial({ color: '#8F9AA4', metalness: 0.6, roughness: 0.35 })), radialSegments: 24, sampleStep: 4, straightStep: 20, maxLength: 30 });
    this.hanger.mesh.userData.pick = this.hangerPick;
    this.packer = new TrajectoryTube({ radius: rad(8.6), material: cut(new MeshStandardMaterial({ color: '#2B2D30', roughness: 0.85 })), radialSegments: 24, sampleStep: 4, straightStep: 20, maxLength: 10 });
    this.packer.mesh.userData.pick = this.hangerPick;
    this.slips = makeSlips();
    this.slips.traverse((o) => { o.userData.pick = this.hangerPick; });
    this.group.add(this.hanger.mesh, this.packer.mesh, this.slips);

    // running string
    this.runString = new StringAssembly({
      name: 'Liner running string',
      components: [{ key: 'runtool', name: 'Running tool', length: 10, radius: rad(5.6), material: Mat.bhaPart('#3E4A55', 0.5), pick: this.toolPick, decor: [{ at: 7.5, build: () => new Mesh(new CylinderGeometry(rad(6.4), rad(6.4), 1.4, 20), Mat.solidPart('#C4532E', 0.3, 0.5)) }] }],
      pipe: { name: DRILL_PIPE.name, radius: rad(DRILL_PIPE.od), material: Mat.drillPipe(), spacing: JOINT.drillPipe, jointRadius: rad(DRILL_PIPE.tjOd), jointLength: 1.5, jointMaterial: Mat.toolJoint(), pick: { id: 'dp', title: 'Running string (5" DP)', kind: 'pipe', info: 'Drill pipe used to run and set the liner, and as the cement conduit.' } },
      maxPipeLength: 9800,
    });
    this.group.add(this.runString.group);
    this.top = c.top; this.shoe = c.shoe; this.runBottom = c.top;
  }

  update(S) {
    const L = S.liner;
    if (!L) { this.liner.hide(); this.hanger.setVisible(false); this.packer.setVisible(false); this.slips.visible = false; this.runString.hide(); return; }
    this.shoe = L.shoeMD; this.top = L.topMD;
    this.liner.update(L.shoeMD, L.topMD + HANGER_LEN * 0.5);
    const hangerVisible = !L.runString ? L.state === 'set' || L.hangerSet : true;
    const t = L.topMD;
    if (hangerVisible && L.shoeMD - L.topMD > 400) {
      this.hanger.setInterval(t, t + HANGER_LEN);
      this.packer.setInterval(t + 0.6, t + 2.6);
      this.slips.visible = true;
      placeAtMD(this.slips, t + HANGER_LEN - 1);
      const set = L.setProg ?? (L.hangerSet ? 1 : 0);
      for (const m of this.slips.userData.slips) {
        const r = rad(8.15) + set * (rad(9.0) - rad(8.15));
        m.position.set(Math.cos(m.userData.angle) * r, 0, Math.sin(m.userData.angle) * r);
      }
    } else { this.hanger.setVisible(false); this.packer.setVisible(false); this.slips.visible = false; }
    // emphasise the liner while it is the active operation
    const active = L.state === 'running' || (S.cement && S.cement.key === 'c7');
    this.bodyMat.emissive.set(active ? '#5a4a30' : '#000000');
    this.bodyMat.emissiveIntensity = active ? 0.35 : 0;

    if (L.runString && L.runString.bottomMD > L.runString.topMD) {
      this.runBottom = L.runString.bottomMD + 4;
      this.runString.update(this.runBottom, L.runString.topMD);
    } else this.runString.hide();
  }
}

export { HANGER_LEN };
