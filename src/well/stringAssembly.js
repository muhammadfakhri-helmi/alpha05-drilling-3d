/**
 * StringAssembly – a downhole string described from the bottom up:
 *
 *     components (bit, motor, MWD … / shoe / ESP / logging tool)
 *     + repeating pipe body (drill pipe, casing, tubing, cable) to the string top
 *
 * Every component occupies its own MD interval and is drawn as a curved
 * TrajectoryTube, so the whole string bends with the hole. Short rigid parts
 * (bit, stabiliser blades, bands, tool joints) are placed with the local
 * trajectory frame at their MD.
 */
import { Group, RingGeometry, Mesh, CylinderGeometry } from 'three';
import { TrajectoryTube, JointInstancer } from './tubular.js';
import { placeAtMD } from '../trajectory.js';
import { surfaceTaper } from '../constants.js';

/** Place a rigid part and shrink it to true scale near surface. */
function placeTapered(obj, md) { placeAtMD(obj, md); const t = surfaceTaper(md); obj.scale.set(t, 1, t); }
import { cut } from '../utils/materials.js';

export class StringAssembly {
  /**
   * @param {object} o
   * @param {string} o.name
   * @param {Array} o.components bottom -> top: { key, name, length, radius, material, rigid?, decor?, pick? }
   * @param {object} [o.pipe] { radius, material, spacing, jointRadius, jointLength, jointMaterial, name, pick }
   */
  constructor({ name, components = [], pipe = null, maxPipeLength }) {
    this.name = name;
    this.group = new Group();
    this.group.name = name;
    this.components = [];
    let cum = 0;
    for (const c of components) {
      const comp = { ...c, offset: cum, decorObjs: [] };
      cum += c.length;
      if (c.rigid) {
        comp.object = c.rigid();
        comp.object.visible = false;
        this.group.add(comp.object);
        tagPick(comp.object, c.pick);
      } else {
        comp.tube = new TrajectoryTube({
          radius: c.radius, material: c.material, radialSegments: c.radialSegments ?? 20,
          sampleStep: 4, straightStep: Math.max(10, c.length), maxLength: c.length + 2, name: c.key,
          edgeColor: c.edgeColor ?? '#15171a', edgeOpacity: 0.5,
        });
        this.group.add(comp.tube.mesh);
        tagPick(comp.tube.mesh, c.pick);
      }
      for (const d of c.decor ?? []) {
        const obj = d.build();
        obj.visible = false;
        this.group.add(obj);
        tagPick(obj, c.pick);
        comp.decorObjs.push({ at: d.at, obj });
      }
      this.components.push(comp);
    }
    this.componentsLength = cum;

    // shoulder faces where the OD changes between adjacent tubes
    this.shoulders = [];
    for (let i = 1; i < this.components.length; i++) {
      const a = this.components[i - 1], b = this.components[i];
      if (a.rigid || b.rigid || typeof a.radius !== 'number' || typeof b.radius !== 'number') continue;
      const r0 = Math.min(a.radius, b.radius), r1 = Math.max(a.radius, b.radius);
      if (r1 - r0 < 0.05) continue;
      const g = new RingGeometry(r0, r1, 28, 1);
      g.rotateX(-Math.PI / 2);
      const m = new Mesh(g, (a.radius > b.radius ? a : b).material);
      m.visible = false;
      this.group.add(m);
      this.shoulders.push({ offset: b.offset, mesh: m });
    }

    this.pipe = null;
    if (pipe) {
      this.pipe = { ...pipe };
      this.pipe.tube = new TrajectoryTube({
        radius: pipe.radius, material: pipe.material, radialSegments: pipe.radialSegments ?? 16,
        sampleStep: 6, straightStep: 120, uvScale: pipe.uvScale ?? 31, name: pipe.name ?? `${name}-pipe`,
        maxLength: maxPipeLength, edgeColor: pipe.edgeColor === undefined ? '#15171a' : pipe.edgeColor, edgeOpacity: 0.5,
      });
      this.group.add(this.pipe.tube.mesh);
      tagPick(this.pipe.tube.mesh, pipe.pick);
      if (pipe.spacing) {
        const jg = new CylinderGeometry(pipe.jointRadius, pipe.jointRadius, pipe.jointLength ?? 1.4, pipe.radialSegments ?? 16, 1, false);
        jg.translate(0, -(pipe.jointLength ?? 1.4) / 2, 0); // joint sits just below its MD (box end up)
        const cap = Math.ceil((maxPipeLength ?? 10000) / pipe.spacing) + 4;
        this.pipe.joints = new JointInstancer({ geometry: jg, material: pipe.jointMaterial ?? pipe.material, capacity: cap, name: `${name}-joints` });
        this.group.add(this.pipe.joints.mesh);
        tagPick(this.pipe.joints.mesh, pipe.pick);
      }
    }
    this.bottomMD = NaN;
    this.topMD = NaN;
    /** Visual rotation (rad) applied about the local hole axis to rigid parts and decorations. */
    this.spin = 0;
    this.visible = false;
    this.group.visible = false;
  }

  get length() { return this.componentsLength; }

  /** Position the string: bottom at bottomMD, string top at topMD (may be above ground, MD < 0). */
  update(bottomMD, topMD) {
    this.group.visible = true;
    this.visible = true;
    this.bottomMD = bottomMD; this.topMD = topMD;
    for (const c of this.components) {
      const b = bottomMD - c.offset, a = b - c.length;
      c.mdTop = a; c.mdBot = b;
      if (c.tube) c.tube.setInterval(Math.max(a, topMD), b);
      if (c.object) { c.object.visible = b > topMD; if (c.object.visible) placeTapered(c.object, b); }
      for (const d of c.decorObjs) {
        const md = b - d.at;
        d.obj.visible = md > topMD && md <= b + 0.01;
        if (d.obj.visible) { placeTapered(d.obj, md); if (this.spin) d.obj.rotateY(this.spin); }
      }
    }
    for (const s of this.shoulders) {
      const md = bottomMD - s.offset;
      s.mesh.visible = md > topMD;
      if (s.mesh.visible) placeTapered(s.mesh, md);
    }
    if (this.pipe) {
      const pb = bottomMD - this.componentsLength;
      this.pipe.tube.setUVAnchor(bottomMD);
      this.pipe.tube.setInterval(topMD, pb);
      if (this.pipe.joints) {
        if (pb > topMD) this.pipe.joints.layout(pb, topMD, this.pipe.spacing, { includeFrom: this.pipe.jointAtBottom ?? false });
        else this.pipe.joints.hide();
      }
    }
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.group.visible = false;
  }

  /** MD interval of the component with a given key (for picking cards). */
  componentInterval(key) {
    const c = this.components.find((x) => x.key === key);
    return c ? [c.mdTop, c.mdBot] : null;
  }
}

function tagPick(obj, pick) {
  if (!pick) return;
  obj.traverse((o) => { o.userData.pick = pick; });
}

/** Builds a short ring/sleeve (couplings, bands) modelled along +Y, centred at y = 0. */
export function sleeve(radius, length, material, segments = 20) {
  const m = new Mesh(new CylinderGeometry(radius, radius, length, segments, 1, false), material);
  return m;
}

export { cut };
