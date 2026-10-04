/**
 * Surface: pad, substructure, mast, top drive, pipe handling and site equipment.
 *
 * Layout and proportions follow the original mockup. Added for the casing
 * operation: casing joints on the pipe rack, a handling joint that travels
 * catwalk → V-door → well centre, casing elevator on the top drive, and a
 * cement head used during cementing.
 */
import {
  Group, Mesh, BoxGeometry, CylinderGeometry, Vector3, Shape, Path, ShapeGeometry, PlaneGeometry,
  MeshStandardMaterial, LineSegments, LineBasicMaterial, BufferGeometry, Float32BufferAttribute,
  InstancedMesh, Matrix4, Quaternion, TorusGeometry,
} from 'three';
import { CELLAR_DEPTH, FLOOR_Y, CROWN_Y, JOINT, HOOK_MIN, rad, SURFACE_EXAGGERATION, RADIAL_EXAGGERATION } from '../constants.js';

/** Surface tubulars use the mild surface exaggeration (see constants.surfaceTaper). */
const radSurface = (inch) => rad(inch) * (SURFACE_EXAGGERATION / RADIAL_EXAGGERATION);
import { CASING_BY_KEY } from '../engineeringData.js';
import { Mat } from '../utils/materials.js';
import { gravelTextures, fieldTexture, concreteTexture } from '../utils/textures.js';
import { lerp, smooth, clamp } from '../utils/math.js';

const UP = new Vector3(0, 1, 0);
const H0 = FLOOR_Y, H1 = CROWN_Y;

export const RIG_ANCHORS = {
  mast: new Vector3(8, 120, 6),
  drawworks: new Vector3(-6, 38, 14.5),
  mudPump: new Vector3(-96, 9, 8),
  shaker: new Vector3(0, 15, -46),
  mudTank: new Vector3(-40, 12, -46),
  silo: new Vector3(76, 30, -86),
  pipeRack: new Vector3(100, 7, 16),
  catwalk: new Vector3(80, 7, 0),
  generator: new Vector3(-150, 10, 38),
  camp: new Vector3(180, 10, -95),
  accumulator: new Vector3(32, 6, 34),
  choke: new Vector3(22, 5, -24),
  cellar: new Vector3(3, 6, 0),
};

const INFO = {
  mast: ['Mast', 'Supports the crown block, travelling block and top drive; racks stands on the setback.'],
  topdrive: ['Top drive', 'Rotates the drill string and carries the hook load; elevator links pick up pipe and casing.'],
  drawworks: ['Drawworks', 'Hoisting winch that raises and lowers the travelling block.'],
  mudPump: ['Mud pumps', 'Triplex pumps circulating mud (and cement displacement) down the string.'],
  shaker: ['Shale shakers', 'Screen cuttings out of the returning mud.'],
  mudTank: ['Mud tanks', 'Active and reserve mud system.'],
  silo: ['Barite silos', 'Weighting material for mud-weight control.'],
  pipeRack: ['Pipe rack', 'Tubulars staged for the next run; joints are drifted and tallied here.'],
  catwalk: ['Catwalk / V-door', 'Path for joints from the pipe rack up to the rig floor.'],
  generator: ['Generators / SCR', 'Power for the electric rig.'],
  camp: ['Camp', 'Crew accommodation.'],
  accumulator: ['BOP accumulator', 'Stores hydraulic energy to close the BOP.'],
  choke: ['Choke manifold', 'Controls returns during well control.'],
};

export class Rig {
  constructor(scene, { shadows = true } = {}) {
    this.group = new Group();
    this.group.name = 'rig';
    scene.add(this.group);
    this.shadowCasters = [];
    this.pickables = [];
    this._buildGround();
    this._buildRig();
    this._buildSite();
    this._buildHandling();
    this.group.traverse((o) => { if (o.isMesh && !o.userData.noShadow) { o.castShadow = shadows; o.receiveShadow = shadows; } });
  }

  _box(w, h, d, mat, x, y, z, parent = this.group) {
    const m = new Mesh(new BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  _cyl(rt, rb, h, mat, x, y, z, seg = 18, parent = this.group) {
    const m = new Mesh(new CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  _bar(a, b, r, mat, parent = this.group, seg = 6) {
    const d = new Vector3().subVectors(b, a), L = d.length();
    const m = new Mesh(new CylinderGeometry(r, r, L, seg), mat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    parent.add(m); return m;
  }
  _pick(obj, key, anchor) {
    const [title, info] = INFO[key];
    obj.traverse((o) => { o.userData.pick = { id: key, title, info, kind: 'surface', anchor }; });
    this.pickables.push(obj);
  }

  _buildGround() {
    const g = this.group;
    const s = new Shape(); s.moveTo(-230, -190); s.lineTo(260, -190); s.lineTo(260, 190); s.lineTo(-230, 190); s.lineTo(-230, -190);
    const h = new Path(); h.moveTo(-8, -8); h.lineTo(8, -8); h.lineTo(8, 8); h.lineTo(-8, 8); h.lineTo(-8, -8); s.holes.push(h);
    const { map, roughnessMap } = gravelTextures(512);
    map.repeat.set(1 / 40, 1 / 40); roughnessMap.repeat.set(1 / 25, 1 / 25);
    const padGeo = new ShapeGeometry(s);
    const pad = new Mesh(padGeo, new MeshStandardMaterial({ map, roughnessMap, color: 0xb7b0a2, roughness: 1, metalness: 0 }));
    pad.rotation.x = -Math.PI / 2; pad.receiveShadow = true; pad.userData.noShadow = true;
    g.add(pad);
    const fs = new Shape(); fs.moveTo(-2600, -2600); fs.lineTo(2600, -2600); fs.lineTo(2600, 2600); fs.lineTo(-2600, 2600);
    const fh = new Path(); fh.moveTo(-230, -190); fh.lineTo(260, -190); fh.lineTo(260, 190); fh.lineTo(-230, 190); fs.holes.push(fh);
    const ft = fieldTexture(512); ft.repeat.set(1 / 260, 1 / 260);
    const field = new Mesh(new ShapeGeometry(fs), new MeshStandardMaterial({ map: ft, roughness: 1, metalness: 0 }));
    field.rotation.x = -Math.PI / 2; field.position.y = -0.3; field.receiveShadow = true; field.userData.noShadow = true;
    g.add(field);
    this.ground = [pad, field];
    // cellar
    const conc = Mat.concrete(concreteTexture());
    [[0, -8, 0], [0, 8, 0], [-8, 0, 1], [8, 0, 1]].forEach(([x, z, r]) => {
      const m = new Mesh(new PlaneGeometry(16, CELLAR_DEPTH), conc); m.position.set(x, -CELLAR_DEPTH / 2, z); if (r) m.rotation.y = Math.PI / 2; g.add(m);
    });
    this._box(18, 0.8, 1.2, conc, 0, 0.4, -8.6); this._box(18, 0.8, 1.2, conc, 0, 0.4, 8.6);
  }

  _buildRig() {
    const paint = Mat.paintedSteel('#DCD6C6'), frame = Mat.frameSteel(), red = Mat.paintedSteel('#B8423A');
    const V = (a, b, c) => new Vector3(a, b, c);
    const sub = new Group(); this.group.add(sub);
    [-14, 14].forEach((x) => {
      for (const z of [-22, -7, 7, 22]) { this._bar(V(x - 3, 0, z), V(x - 3, 26, z), 0.6, frame, sub); this._bar(V(x + 3, 0, z), V(x + 3, 26, z), 0.6, frame, sub); }
      for (const y of [1, 13, 25.5]) { this._bar(V(x - 3, y, -22), V(x - 3, y, 22), 0.5, frame, sub); this._bar(V(x + 3, y, -22), V(x + 3, y, 22), 0.5, frame, sub); }
      for (const [z0, z1] of [[-22, -7], [-7, 7], [7, 22]]) { this._bar(V(x - 3, 1, z0), V(x - 3, 25.5, z1), 0.35, frame, sub); this._bar(V(x + 3, 1, z1), V(x + 3, 25.5, z0), 0.35, frame, sub); }
    });
    // rig floor (opening at well centre left visible via rotary table)
    const floorMat = Mat.paintedSteel('#7C807F', { roughness: 0.8 });
    this._box(34, 1.6, 18, floorMat, 0, 26.8, -14); this._box(34, 1.6, 18, floorMat, 0, 26.8, 14);
    this._box(13, 1.6, 10, floorMat, -10.5, 26.8, 0); this._box(13, 1.6, 10, floorMat, 10.5, 26.8, 0);
    const rotary = new Mesh(new TorusGeometry(3.4, 0.9, 10, 28), Mat.darkSteel()); rotary.rotation.x = Math.PI / 2; rotary.position.set(0, 27.2, 0); this.group.add(rotary);
    // mast
    const legs = [[-7, -7], [7, -7], [7, 7], [-7, 7]];
    const at = (lx, lz, y) => { const f = (y - H0) / (H1 - H0); return V(lerp(lx, lx * 0.36, f), y, lerp(lz, lz * 0.36, f)); };
    const mast = new Group(); this.group.add(mast);
    legs.forEach(([x, z]) => this._bar(at(x, z, H0), at(x, z, H1), 0.75, paint, mast, 8));
    for (let y = H0; y < H1; y += 14) {
      const y1 = Math.min(H1, y + 14);
      for (let s2 = 0; s2 < 4; s2++) {
        const [ax, az] = legs[s2], [bx, bz] = legs[(s2 + 1) % 4];
        this._bar(at(ax, az, y1), at(bx, bz, y1), 0.3, paint, mast);
        if (!(s2 === 1 && y < H0 + 40)) this._bar(at(ax, az, y), at(bx, bz, y1), 0.22, paint, mast);
      }
    }
    this._box(11, 5, 11, red, 0, H1 + 2.5, 0, mast);
    this._box(2, 8, 12, paint, -6.3, H1 - 2, 0, mast);
    this._box(12, 0.7, 9, frame, 8, H0 + 88, -1, mast);
    this._bar(V(2, H0 + 88, -5.5), V(14, H0 + 88, -5.5), 0.25, Mat.safetyYellow(), mast);
    this._pick(mast, 'mast', RIG_ANCHORS.mast);
    // racked stands on the setback (instanced)
    const standGeo = new CylinderGeometry(0.22, 0.22, 88, 6);
    const stands = new InstancedMesh(standGeo, Mat.galvanized(), 12);
    const m4 = new Matrix4();
    let k = 0;
    for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) stands.setMatrixAt(k++, m4.makeTranslation(6 + a * 1.6, H0 + 44, -4.5 + b * 1.6));
    this.group.add(stands);
    this.racked = stands;
    // guide rails, standpipe
    this._bar(V(-4.5, H0, -4.5), V(-4.5, H1 - 6, -4.5), 0.25, Mat.darkSteel());
    this._bar(V(4.5, H0, -4.5), V(4.5, H1 - 6, -4.5), 0.25, Mat.darkSteel());
    this._bar(V(-6.4, H0, 6.4), V(-5.3, H0 + 62, 5.3), 0.35, red);
    // drawworks + doghouse
    const dw = this._box(9, 6.5, 9, Mat.paintedSteel('#3F6C95'), -6, H0 + 3.25, 14.5);
    this._pick(dw, 'drawworks', RIG_ANCHORS.drawworks);
    this._box(14, 9, 12, Mat.paintedSteel('#D6D3CB'), -24, H0 + 4.5, 9);
    this._box(14.2, 1.2, 12.2, Mat.orange(), -24, H0 + 7.3, 9);
    this._box(0.2, 3, 7, new MeshStandardMaterial({ color: '#2A3642', metalness: 0.6, roughness: 0.15 }), -17, H0 + 5, 9);

    // travelling block + top drive + elevator (moves)
    const TD = new Group(); this.group.add(TD);
    const block = this._box(4.2, 6, 3.4, Mat.safetyYellow(), 0, 6, 0, TD);
    const drive = this._box(4.6, 8, 4.2, Mat.orange(), 0, -1.5, 0, TD);
    const stem = new Mesh(new CylinderGeometry(0.5, 0.5, 5, 10), Mat.galvanized()); stem.position.y = -8; TD.add(stem);
    // elevator links + elevator (shown while handling casing/pipe by the elevator)
    const elev = new Group(); TD.add(elev);
    this._bar(V(-1.6, -5, 0), V(-1.6, -12.5, 0), 0.18, Mat.darkSteel(), elev);
    this._bar(V(1.6, -5, 0), V(1.6, -12.5, 0), 0.18, Mat.darkSteel(), elev);
    const ering = new Mesh(new TorusGeometry(1.6, 0.45, 8, 20), Mat.safetyYellow()); ering.rotation.x = Math.PI / 2; ering.position.y = -12.8; elev.add(ering);
    this.topDrive = TD; this.elevator = elev;
    this.stemLength = 10.5;     // top drive origin -> stem bottom
    this.elevatorLength = 12.8; // top drive origin -> elevator
    this._pick(TD, 'topdrive', null);
    const lines = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ color: 0x2a2a2a }));
    lines.geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(24), 3));
    this.group.add(lines); this.lines = lines;

    // V-door ramp + catwalk
    const ramp = new Mesh(new BoxGeometry(46, 1, 5), Mat.paintedSteel('#9A9C98'));
    ramp.rotation.set(0, 0, -0.55); ramp.position.set(36, 13.4, 0); this.group.add(ramp);
    const cw = this._box(64, 4, 6, Mat.frameSteel(), 92, 2, 0);
    this._pick(ramp, 'catwalk', RIG_ANCHORS.catwalk);
    this._pick(cw, 'catwalk', RIG_ANCHORS.catwalk);
  }

  _buildSite() {
    const V = (a, b, c) => new Vector3(a, b, c);
    // pipe racks: drill pipe (z<0) and casing (z>0), instanced
    const rackMat = Mat.paintedSteel('#6F6A60');
    const rackGroup = new Group(); this.group.add(rackGroup);
    [-16, 16].forEach((z) => this._box(60, 1.2, 12, rackMat, 92, 2.4, z, rackGroup));
    const dpGeo = new CylinderGeometry(0.42, 0.42, 58, 10); dpGeo.rotateZ(Math.PI / 2);
    const dp = new InstancedMesh(dpGeo, Mat.paintedSteel('#6C8A5A', { metalness: 0.5 }), 14);
    const m4 = new Matrix4();
    for (let q = 0; q < 14; q++) dp.setMatrixAt(q, m4.makeTranslation(92, 3.5 + Math.floor(q / 7) * 0.85, -16 - 4.5 + (q % 7) * 1.5));
    rackGroup.add(dp);
    const csgGeo = new CylinderGeometry(1, 1, 40, 14); csgGeo.rotateZ(Math.PI / 2);
    this.casingRack = new InstancedMesh(csgGeo, Mat.paintedSteel('#9FA9B2', { metalness: 0.6, roughness: 0.38 }), 18);
    rackGroup.add(this.casingRack);
    this._pick(rackGroup, 'pipeRack', RIG_ANCHORS.pipeRack);
    // mud tanks, shakers, flowline
    const tanks = new Group(); this.group.add(tanks);
    for (let q = 0; q < 4; q++) this._box(34, 9, 10, Mat.paintedSteel('#B9B19E'), -58 + q * 36, 4.5, -46, tanks);
    this._pick(tanks, 'mudTank', RIG_ANCHORS.mudTank);
    const shakers = new Group(); this.group.add(shakers);
    for (let q = 0; q < 3; q++) { this._box(7, 3.5, 6, Mat.paintedSteel('#5B6F80'), -8 + q * 8.5, 10.8, -46, shakers); this._box(6.6, 0.3, 5, Mat.darkSteel(), -8 + q * 8.5, 12.7, -46, shakers); }
    this._pick(shakers, 'shaker', RIG_ANCHORS.shaker);
    const flow = Mat.galvanized();
    this._bar(V(0, 20, -3), V(0, 13, -42), 0.9, flow);
    // mud pumps
    const pumps = new Group(); this.group.add(pumps);
    for (let q = 0; q < 3; q++) { this._box(17, 7, 7.5, Mat.paintedSteel('#3F6C95'), -96, 3.5, 8 - q * 16, pumps); const c = this._cyl(2.3, 2.3, 4, Mat.galvanized(), -86.5, 4, 8 - q * 16, 14, pumps); c.rotation.z = Math.PI / 2; }
    this._pick(pumps, 'mudPump', RIG_ANCHORS.mudPump);
    this._bar(V(-86, 4, -24), V(-6.5, 4, 6.4), 0.45, Mat.paintedSteel('#B8423A'));
    // generators & SCR
    const gens = new Group(); this.group.add(gens);
    for (let q = 0; q < 3; q++) this._box(20, 8.5, 8.5, Mat.paintedSteel('#E6E3DA'), -150, 4.25, 50 - q * 12, gens);
    this._box(26, 9, 9, Mat.paintedSteel('#D3D0C6'), -150, 4.5, 10, gens);
    this._pick(gens, 'generator', RIG_ANCHORS.generator);
    // barite silos
    const silos = new Group(); this.group.add(silos);
    for (let q = 0; q < 4; q++) { this._cyl(4.2, 4.2, 20, Mat.paintedSteel('#C9772E'), 60 + q * 11, 16, -86, 20, silos); this._cyl(4.2, 0.8, 5, Mat.paintedSteel('#C9772E'), 60 + q * 11, 3.5, -86, 20, silos); }
    this._pick(silos, 'silo', RIG_ANCHORS.silo);
    // water tanks
    for (let q = 0; q < 2; q++) { const w = this._cyl(5, 5, 26, Mat.paintedSteel('#8FA7B6'), 120, 5.2, 40 + q * 12, 20); w.rotation.z = Math.PI / 2; }
    // camp
    const camp = new Group(); this.group.add(camp);
    for (let q = 0; q < 6; q++) this._box(20, 8.5, 8.5, Mat.paintedSteel('#ECEAE3'), 180, 4.25, -120 + q * 11, camp);
    this._pick(camp, 'camp', RIG_ANCHORS.camp);
    // accumulator + choke manifold
    this._pick(this._box(10, 5, 5, Mat.paintedSteel('#B8423A'), 32, 2.5, 34), 'accumulator', RIG_ANCHORS.accumulator);
    this._pick(this._box(8, 4, 5, Mat.galvanized(), 22, 2, -24), 'choke', RIG_ANCHORS.choke);
    // flare line & stack
    this._bar(V(22, 2, -24), V(-190, 2, -170), 0.6, flow);
    this._cyl(1, 1.4, 26, Mat.darkSteel(), -190, 13, -170, 10);
    // light towers
    [[-60, 60], [90, -60]].forEach(([x, z]) => { this._cyl(0.4, 0.6, 34, Mat.frameSteel(), x, 17, z, 8); this._box(4, 2.5, 1, new MeshStandardMaterial({ color: '#F3EFE2', emissive: '#fff4cc', emissiveIntensity: 0.6 }), x, 34, z); });
    // crane
    const cr = Mat.paintedSteel('#3E8E7E');
    this._box(14, 5, 10, cr, -120, 2.5, -110);
    const base = V(-118, 6, -110), tip = V(-70, 120, -120);
    this._bar(base, tip, 1.1, cr); this._bar(base.clone().add(V(0, 0, 3)), tip, 0.6, cr);
    this._bar(tip, V(-70, 40, -120), 0.12, Mat.rubber());
  }

  _buildHandling() {
    // single joint travelling from the catwalk to well centre (casing or liner)
    this.handGeo = new CylinderGeometry(1, 1, 1, 18); // scaled per string
    this.handMat = new MeshStandardMaterial({ color: '#9FA9B2', metalness: 0.6, roughness: 0.36, emissive: '#5a4a30', emissiveIntensity: 0.25 });
    this.handJoint = new Mesh(this.handGeo, this.handMat);
    this.handJoint.visible = false;
    this.handJoint.userData.pick = { id: 'handjoint', title: 'Casing joint', kind: 'surface', info: 'Joint being picked up from the catwalk and stabbed into the string at well centre.' };
    this.group.add(this.handJoint);
    // cement head (on top of landing joint / running string during cementing)
    const ch = new Group();
    this._cyl(1.6, 1.6, 4, Mat.paintedSteel('#C9CDD0', { metalness: 0.5 }), 0, 2, 0, 16, ch);
    this._cyl(0.5, 0.5, 6, Mat.paintedSteel('#B8423A'), 3, 2.5, 0, 10, ch).rotation.z = Math.PI / 2;
    this._box(1.2, 1.2, 1.2, Mat.paintedSteel('#B8423A'), 0, 4.6, 0, ch);
    ch.visible = false;
    ch.traverse((o) => { o.userData.pick = { id: 'cementhead', title: 'Cement head', kind: 'surface', info: 'Holds the wiper plugs and connects the cement unit lines to the casing / running string.' }; });
    this.group.add(ch);
    this.cementHead = ch;
  }

  /** Lay out casing joints on the rack for the string about to be run. */
  setRack(ck) {
    if (this._rackFor === ck) return;
    this._rackFor = ck;
    const m4 = new Matrix4(), q = new Quaternion(), s = new Vector3(), p = new Vector3();
    if (!ck) { this.casingRack.count = 0; return; }
    const od = ck === 'liner' ? 7 : CASING_BY_KEY[ck].od;
    const r = radSurface(od);
    this.casingRack.material.color.set(ck === 'liner' ? '#C3CCD4' : CASING_BY_KEY[ck].color);
    let n = 0;
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9 - row; i++) {
      p.set(92, 3.6 + r + row * r * 1.8, 16 - 4.5 + i * (r * 2.1) + row * r);
      s.set(r, 1, r);
      m4.compose(p, q, s);
      this.casingRack.setMatrixAt(n++, m4);
    }
    this.casingRack.count = n;
    this.casingRack.instanceMatrix.needsUpdate = true;
  }

  update(S, dt) {
    // top drive height follows the hook (string top / elevator)
    const target = FLOOR_Y + S.hookH + (S.hookLoad === 'elevator' ? this.elevatorLength : this.stemLength);
    const y = clamp(target, FLOOR_Y + 9, H1 - 10);
    const TD = this.topDrive;
    const jump = Math.abs(TD.position.y - y) > 25;
    TD.position.y = jump ? y : lerp(TD.position.y || y, y, Math.min(1, dt * 14));
    this.elevator.visible = S.hookLoad === 'elevator';
    const lp = this.lines.geometry.attributes.position.array;
    let k = 0;
    for (const [x, z] of [[-1.5, -1], [1.5, -1], [-1.5, 1], [1.5, 1]]) { lp[k++] = x; lp[k++] = H1 - 2; lp[k++] = z; lp[k++] = x * 0.8; lp[k++] = TD.position.y + 9; lp[k++] = z * 0.8; }
    this.lines.geometry.attributes.position.needsUpdate = true;

    // pipe rack contents
    const ck = S.phase.casing ?? (S.phase.key === 'c7' ? 'liner' : null);
    const rackShown = ck && ['PREPARE_CASING', 'PICK_UP_CASING', 'RUN_CASING', 'CONDITION_HOLE', 'POOH_BHA', 'PREPARE_LINER', 'RUN_LINER'].includes(S.step);
    this.setRack(rackShown ? ck : null);

    // handling joint
    const h = S.handling;
    if (h) {
      const od = h.kind === 'liner' ? 7 : CASING_BY_KEY[h.ck].od;
      const color = h.kind === 'liner' ? '#C3CCD4' : CASING_BY_KEY[h.ck].color;
      this.handMat.color.set(color);
      this._poseJoint(h.prog, radSurface(od), h.stab);
      this.handJoint.visible = true;
      this.handJoint.userData.pick.title = h.kind === 'liner' ? '7" liner joint' : `${CASING_BY_KEY[h.ck].name.replace(' casing', '')} casing joint`;
    } else this.handJoint.visible = false;

    // cement head
    if (S.cementHead) { this.cementHead.visible = true; this.cementHead.position.set(0, -S.cementHead.md, 0); }
    else this.cementHead.visible = false;
  }

  /**
   * Joint pose along catwalk → V-door ramp → vertical below the elevator.
   * Interpolates the joint's top end and its inclination between keyframes.
   */
  _poseJoint(t, r, stab) {
    const L = JOINT.casing;
    const keys = [
      { top: new Vector3(64, 6.5, 0), ang: Math.PI },                          // lying on the catwalk
      { top: new Vector3(17, 26.6, 0), ang: Math.PI - 0.55 },                  // dragged up the ramp to the V-door
      { top: new Vector3(0, FLOOR_Y + HOOK_MIN + L, 0), ang: Math.PI / 2 },   // vertical at well centre
    ];
    const seg = t < 0.5 ? 0 : 1;
    const u = smooth(seg === 0 ? t / 0.5 : (t - 0.5) / 0.5);
    const a = keys[seg], b = keys[seg + 1];
    const top = new Vector3().lerpVectors(a.top, b.top, u);
    const ang = lerp(a.ang, b.ang, u);
    const dir = new Vector3(Math.cos(ang), Math.sin(ang), 0); // bottom -> top
    const center = top.clone().addScaledVector(dir, -L / 2);
    this.handJoint.position.copy(center);
    this.handJoint.quaternion.setFromUnitVectors(UP, dir);
    this.handJoint.scale.set(r, L, r);
    void stab;
  }

  /** World anchor for the top-drive label. */
  topDriveAnchor(v = new Vector3()) { return v.set(3, this.topDrive.position.y + 2, 0); }
}
