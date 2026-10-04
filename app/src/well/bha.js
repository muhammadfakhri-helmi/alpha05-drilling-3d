/**
 * Drilling BHA + drill pipe for each hole section, built as curved
 * StringAssemblies from the plan's BHA tables (true MD lengths).
 */
import { Group, Mesh, CylinderGeometry, ConeGeometry, SphereGeometry, BoxGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SECTIONS, BHA_COLORS, BHA_INFO, DRILL_PIPE } from '../engineeringData.js';
import { rad, JOINT } from '../constants.js';
import { Mat } from '../utils/materials.js';
import { StringAssembly } from './stringAssembly.js';
import { TD } from '../trajectory.js';

/**
 * Bit modelled standing on its face: origin at the cutting face (bit MD), +Y uphole.
 * Radius is exaggerated like the hole; the shank tapers to the motor OD over a short
 * visual height so the bit does not read as a flat disc. The shank overlaps the
 * motor's lowest few feet (hidden inside), keeping the face exactly at bit MD.
 */
export function makeBit(type, holeIn, motorOd) {
  const g = new Group();
  const spin = new Group();
  g.add(spin);
  g.userData.spin = spin;
  const r = rad(holeIn) * 0.96;
  const rm = rad(motorOd);
  const h = Math.max(2.4, r * 0.75);
  if (type === 'mt') {
    const bodyMat = Mat.solidPart('#7C8B63', 0.35, 0.5);
    const body = new Mesh(new CylinderGeometry(rm * 1.05, r * 0.62, h * 0.7, 28), bodyMat);
    body.position.y = h * 0.62; spin.add(body);
    const coneMat = Mat.solidPart('#6E7F55', 0.3, 0.55);
    const teeth = [];
    for (let j = 0; j < 3; j++) {
      const a = (j * Math.PI * 2) / 3;
      const cone = new Mesh(new ConeGeometry(r * 0.42, r * 0.62, 18), coneMat);
      cone.position.set(Math.cos(a) * r * 0.42, r * 0.28, Math.sin(a) * r * 0.42);
      cone.rotation.set(-Math.sin(a) * 2.2, 0, Math.cos(a) * 2.2);
      spin.add(cone);
      for (let q = 0; q < 12; q++) {
        const b = (q / 12) * Math.PI * 2;
        const tooth = new BoxGeometry(0.34, 0.34, 0.34);
        tooth.translate(cone.position.x + Math.cos(b) * r * 0.32, 0.18, cone.position.z + Math.sin(b) * r * 0.32);
        teeth.push(tooth);
      }
    }
    spin.add(new Mesh(mergeGeometries(teeth), Mat.solidPart('#B5BC9C', 0.4, 0.4)));
  } else {
    const steel = Mat.solidPart('#8D9296', 0.6, 0.32);
    const body = new Mesh(new CylinderGeometry(rm * 1.05, r * 0.58, h * 0.65, 28), steel);
    body.position.y = h * 0.62; spin.add(body);
    const nose = new Mesh(new SphereGeometry(r * 0.5, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), steel);
    nose.position.y = r * 0.5; nose.scale.y = 0.75; spin.add(nose);
    const blades = [], cutters = [];
    const nb = 5;
    for (let j = 0; j < nb; j++) {
      const a = (j * Math.PI * 2) / nb;
      const bl = new BoxGeometry(r * 0.92, h * 0.55, r * 0.16);
      bl.translate(r * 0.48, h * 0.32, 0); bl.rotateY(-a);
      blades.push(bl);
      for (let q = 0; q < 6; q++) {
        const cu = new CylinderGeometry(0.16, 0.16, 0.24, 10);
        cu.rotateX(Math.PI / 2);
        cu.translate(r * (0.18 + q * 0.15), 0.12 + q * q * 0.035, r * 0.09);
        cu.rotateY(-a);
        cutters.push(cu);
      }
    }
    spin.add(new Mesh(mergeGeometries(blades), Mat.solidPart('#7A8085', 0.55, 0.35)));
    spin.add(new Mesh(mergeGeometries(cutters), Mat.solidPart('#D5B45E', 0.8, 0.22)));
  }
  return g;
}

function stabBlades(od, bladeOd, len, mat) {
  const r = rad(od), rb = rad(bladeOd);
  const parts = [];
  for (let j = 0; j < 3; j++) {
    const a = (j * Math.PI * 2) / 3;
    const b = new BoxGeometry(rb - r + 0.15, len * 0.7, 0.6);
    b.rotateZ(0.18);
    b.translate(r + (rb - r) / 2 - 0.05, len / 2, 0);
    b.rotateY(-a);
    parts.push(b);
  }
  return () => new Mesh(mergeGeometries(parts), mat);
}

const band = (radius, h, mat) => () => new Mesh(new CylinderGeometry(radius, radius, h, 20, 1, false), mat);

/**
 * Builds one StringAssembly per hole section.
 * @returns {StringAssembly[]}
 */
export function buildBHAs() {
  const dpMat = Mat.drillPipe();
  return SECTIONS.map((s, si) => {
    const motorOd = s.bha.find((r) => r[3] === 'motor')?.[1] ?? 8;
    let asm = null;
    const comps = s.bha.map(([name, od, len, type, bladeOd], ci) => {
      const key = `${s.id}-${ci}-${type}`;
      const pick = {
        id: key, title: name, kind: 'bha', type,
        info: BHA_INFO[type],
        interval: () => asm?.componentInterval(key),
      };
      if (type === 'bit') {
        return { key, name, length: len, radius: rad(od), rigid: () => makeBit(s.bitType, s.holeIn, motorOd), pick };
      }
      const material = Mat.bhaPart(BHA_COLORS[type], type === 'motor' ? 0.25 : 0.55);
      const c = { key, name, length: len, radius: rad(od), material, pick, decor: [] };
      if (type === 'stab') c.decor.push({ at: 0, build: stabBlades(od, bladeOd, len, Mat.solidPart('#C8CED3', 0.6, 0.35)) });
      if (type === 'mwd') c.decor.push({ at: len * 0.35, build: band(rad(od) * 1.05, 1.2, Mat.solidPart('#2D2F31', 0.4, 0.5)) });
      if (type === 'jar') c.decor.push({ at: len * 0.5, build: band(rad(od) * 1.04, 1.6, Mat.solidPart('#5E3E2A', 0.4, 0.5)) });
      if (type === 'motor') c.decor.push({ at: len * 0.28, build: band(rad(od) * 1.06, 1.4, Mat.solidPart('#2C4236', 0.3, 0.5)) });
      if (type === 'hw') for (let q = 1; q < len / JOINT.drillPipe; q++) c.decor.push({ at: q * JOINT.drillPipe, build: band(rad(6.5), 1.6, Mat.solidPart('#7E878E', 0.6, 0.35)) });
      return c;
    });
    asm = new StringAssembly({
      name: `BHA ${s.hole}`,
      components: comps,
      pipe: {
        name: DRILL_PIPE.name, radius: rad(DRILL_PIPE.od), material: dpMat, spacing: JOINT.drillPipe,
        jointRadius: rad(DRILL_PIPE.tjOd), jointLength: 1.5, jointMaterial: Mat.toolJoint(),
        pick: { id: 'dp', title: DRILL_PIPE.name, kind: 'pipe', info: 'Transmits rotation and torque from the top drive and carries mud down to the BHA.' },
      },
      maxPipeLength: TD + 300,
    });
    asm.section = si;
    asm.bit = asm.components[0].object;
    return asm;
  });
}
