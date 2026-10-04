/**
 * Wireline logging string, TCP perforating guns, perforation tunnels and
 * the ESP + 3-1/2" tubing completion – all positioned by MD.
 */
import { Group, Mesh, CylinderGeometry, ConeGeometry, InstancedMesh, MeshStandardMaterial, Matrix4, Quaternion, Vector3, PointLight, Color } from 'three';
import { COMPLETION, ESP_PARTS, DRILL_PIPE } from '../engineeringData.js';
import { rad, JOINT } from '../constants.js';
import { Mat, cut } from '../utils/materials.js';
import { StringAssembly } from './stringAssembly.js';
import { TrajectoryTube } from './tubular.js';
import { getPosition, getNormal, getBinormal } from '../trajectory.js';
import { WIRELINE_TOOL_LEN, TCP_LEN } from '../stateMachine.js';

const band = (r, h, mat) => () => new Mesh(new CylinderGeometry(r, r, h, 16), mat);

export class CompletionSystem {
  constructor(scene) {
    this.group = new Group();
    this.group.name = 'completion';
    scene.add(this.group);

    // --- wireline logging tool on cable
    const toolPick = { id: 'wireline', title: 'Wireline logging tools', kind: 'tool', info: 'Quad combo + resistivity: logs the 8-1/2" open hole while being pulled up on cable.', interval: () => [this.wireline.bottomMD - WIRELINE_TOOL_LEN, this.wireline.bottomMD] };
    const toolMat = Mat.solidPart('#D9B23E', 0.5, 0.35);
    const toolBand = Mat.solidPart('#3A3D40', 0.4, 0.5);
    this.wireline = new StringAssembly({
      name: 'Wireline',
      components: [{ key: 'wl-tool', name: 'Logging tool string', length: WIRELINE_TOOL_LEN, radius: rad(3.6), material: toolMat, radialSegments: 14, pick: toolPick, decor: [12, 30, 48, 62].map((at) => ({ at, build: band(rad(3.9), 1.2, toolBand) })) }],
      pipe: { name: 'Wireline cable', edgeColor: null, radius: 0.14, material: Mat.solidPart('#1E1F21', 0.3, 0.6), radialSegments: 6, pick: { id: 'cable', title: 'Wireline cable', kind: 'pipe', info: 'Armoured logging cable: conveys the tools and transmits log data to the logging unit.' } },
      maxPipeLength: 9800,
    });
    this.group.add(this.wireline.group);

    // --- TCP guns on drill pipe
    const gunPick = { id: 'tcp', title: 'TCP perforating guns', kind: 'tool', info: 'Tubing-conveyed perforating guns: shaped charges create tunnels through liner, cement and into the reservoir.', interval: () => [this.tcp.bottomMD - TCP_LEN, this.tcp.bottomMD] };
    this.gunMat = Mat.bhaPart('#4C5156', 0.55);
    const gunBand = Mat.solidPart('#C4532E', 0.3, 0.5);
    const decor = [];
    for (let at = 8; at < TCP_LEN; at += 30) decor.push({ at, build: band(rad(4.9), 1.2, gunBand) });
    this.tcp = new StringAssembly({
      name: 'TCP',
      components: [{ key: 'tcp-guns', name: 'TCP guns', length: TCP_LEN, radius: rad(4.6), material: this.gunMat, radialSegments: 16, pick: gunPick, decor }],
      pipe: { name: DRILL_PIPE.name, radius: rad(DRILL_PIPE.od), material: Mat.drillPipe(), spacing: JOINT.drillPipe, jointRadius: rad(DRILL_PIPE.tjOd), jointLength: 1.5, jointMaterial: Mat.toolJoint(), pick: { id: 'dp', title: 'Drill pipe (TCP string)', kind: 'pipe', info: 'Conveys the perforating guns to depth.' } },
      maxPipeLength: 9800,
    });
    this.group.add(this.tcp.group);

    // --- ESP + tubing
    const espPick = { id: 'esp', title: 'ESP (160 HP)', kind: 'esp', info: 'Electric submersible pump: motor, seal, intake and multistage pump lifting reservoir fluid up the tubing.', interval: () => [COMPLETION.espTop, COMPLETION.espBot] };
    this.espMats = [];
    const comps = ESP_PARTS.map(([name, od, len, color], i) => {
      const mat = Mat.solidPart(color, 0.45, 0.4);
      this.espMats.push(mat);
      return { key: `esp-${i}`, name, length: len, radius: rad(od), material: mat, radialSegments: 16, pick: { ...espPick, title: `ESP – ${name}` } };
    });
    this.tubing = new StringAssembly({
      name: 'Tubing + ESP',
      components: comps,
      pipe: { name: COMPLETION.tubing, radius: rad(COMPLETION.tubingOd), material: Mat.tubingSteel(), spacing: JOINT.tubing, jointRadius: rad(4.5), jointLength: 1, jointMaterial: cut(new MeshStandardMaterial({ color: '#56728A', metalness: 0.6, roughness: 0.35 })), pick: { id: 'tubing', title: '3-1/2" tubing', kind: 'tubing', info: 'Production tubing: conduit for the pumped fluid from the ESP to the tree.' } },
      maxPipeLength: 9000,
    });
    this.group.add(this.tubing.group);
    this.espLen = this.tubing.length;
    this.cable = new TrajectoryTube({ radius: 0.16, material: Mat.solidPart('#2A2A2A', 0.2, 0.6), radialSegments: 6, sampleStep: 10, straightStep: 200, offsetN: rad(COMPLETION.tubingOd) + 0.3 });
    this.cable.mesh.userData.pick = { id: 'espcable', title: 'ESP power cable', kind: 'tubing', info: 'Armoured power cable strapped to the tubing, feeding the ESP motor.' };
    this.group.add(this.cable.mesh);

    // --- perforation tunnels (instanced)
    this._buildPerfs();
    this.flash = new PointLight(0xffb060, 0, 160, 1.4);
    getPosition(9450, this.flash.position).add(new Vector3(0, 0, 12));
    this.group.add(this.flash);
  }

  _buildPerfs() {
    const list = [];
    for (const [a, b] of COMPLETION.perfs) for (let md = a; md <= b; md += 6) for (const ang of [-0.35, -1.57, -2.8]) list.push({ md, ang });
    const geo = new ConeGeometry(0.32, 3.4, 8);
    geo.rotateX(Math.PI); // tip pointing outward along -Y before orientation
    this.perfMat = new MeshStandardMaterial({ color: '#E0873A', emissive: '#8a3a10', emissiveIntensity: 0.9, roughness: 0.5 });
    this.perfs = new InstancedMesh(geo, this.perfMat, list.length);
    this.perfs.userData.pick = { id: 'perfs', title: 'Perforations', kind: 'perf', info: '4 perforated intervals in Fm-G (illustrative depths): flow paths from the reservoir into the liner.', interval: () => [COMPLETION.perfs[0][0], COMPLETION.perfs[3][1]] };
    const m = new Matrix4(), q = new Quaternion(), p = new Vector3(), n = new Vector3(), bn = new Vector3(), dir = new Vector3(), down = new Vector3(0, -1, 0);
    list.forEach((it, i) => {
      getPosition(it.md, p); getNormal(it.md, n); getBinormal(it.md, bn);
      dir.copy(n).multiplyScalar(Math.cos(it.ang)).addScaledVector(bn, Math.sin(it.ang)).normalize();
      q.setFromUnitVectors(down, dir);
      p.addScaledVector(dir, rad(7) + 1.9);
      m.compose(p, q, new Vector3(1, 1, 1));
      this.perfs.setMatrixAt(i, m);
    });
    this.perfList = list;
    this.perfs.count = 0;
    this.perfs.frustumCulled = false;
    this.group.add(this.perfs);
  }

  update(S, dt) {
    // wireline
    if (S.wireline) this.wireline.update(S.wireline.toolMD, S.wireline.topMD); else this.wireline.hide();
    // TCP
    if (S.tcp) {
      this.tcp.update(S.tcp.bottomMD, S.tcp.topMD);
      this.gunMat.emissive.set(S.tcp.fired ? '#3a1a08' : '#000000');
    } else this.tcp.hide();
    // tubing + ESP
    if (S.tubing) {
      this.tubing.update(S.tubing.bottomMD, S.tubing.topMD);
      const cableBottom = S.tubing.bottomMD - 30;
      if (cableBottom > S.tubing.topMD) this.cable.setInterval(S.tubing.topMD, cableBottom); else this.cable.setVisible(false);
      const glow = S.flow === 'oil' ? 0.25 : 0;
      for (const m of this.espMats) { m.emissive.set('#203448'); m.emissiveIntensity = glow; }
    } else { this.tubing.hide(); this.cable.setVisible(false); }
    // perforations
    const n = Math.round(this.perfList.length * S.perf);
    this.perfs.count = n;
    this.perfs.visible = n > 0;
    this.perfMat.emissiveIntensity = 0.6 + S.perfFlash * 2.5;
    this.flash.intensity = S.perfFlash * 900;
  }
}
