/**
 * Casing strings: curved casing body + instanced couplings + recognisable
 * float/guide shoe + float collar. While running, the couplings and shoe are
 * laid out relative to the SHOE, so they visibly travel downhole with the
 * string (instead of the casing simply "growing" from the top).
 */
import { Group, Mesh, CylinderGeometry, SphereGeometry, MeshStandardMaterial, Color } from 'three';
import { CASINGS, SECTIONS, SHOE_TRACK } from '../engineeringData.js';
import { rad, JOINT } from '../constants.js';
import { Mat, cut } from '../utils/materials.js';
import { StringAssembly } from './stringAssembly.js';

/** Guide shoe modelled with its nose at y = 0 (shoe MD) and body extending uphole. */
function makeShoe(od, color) {
  const r = rad(od);
  const g = new Group();
  const bodyMat = cut(new MeshStandardMaterial({ color: new Color(color).multiplyScalar(0.9), metalness: 0.6, roughness: 0.35 }));
  const body = new Mesh(new CylinderGeometry(r * 1.07, r * 1.07, 2.2, 28, 1, true), bodyMat);
  body.position.y = 0.9 + 1.1;
  const noseMat = cut(new MeshStandardMaterial({ color: '#D8D0BC', roughness: 0.85, metalness: 0, emissive: '#F2C27D', emissiveIntensity: 0.12 }));
  const nose = new Mesh(new SphereGeometry(r * 1.0, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), noseMat);
  nose.scale.y = 0.9 / r;
  nose.position.y = 0.9;
  // thin highlight ring marking the shoe
  const ringMat = cut(new MeshStandardMaterial({ color: '#E0A040', roughness: 0.4, metalness: 0.4, emissive: '#C07020', emissiveIntensity: 0.35 }));
  const ring = new Mesh(new CylinderGeometry(r * 1.1, r * 1.1, 0.5, 28, 1, true), ringMat);
  ring.position.y = 3.2;
  g.add(body, nose, ring);
  return g;
}

function makeFloatCollar(od, color) {
  const r = rad(od);
  const m = new Mesh(new CylinderGeometry(r * 1.06, r * 1.06, 1.6, 24, 1, true), cut(new MeshStandardMaterial({ color: new Color(color).multiplyScalar(0.8), metalness: 0.6, roughness: 0.4 })));
  return m;
}

const INFO = {
  c30: 'Structural conductor: supports the wellhead loads and isolates unconsolidated surface sediments.',
  c20: 'Surface casing: protects shallow aquifers, isolates reactive shale and provides the base for the BOP.',
  c13: 'Intermediate casing: isolates Fm-B/Fm-C claystones and loss zones before the high-pressure section.',
  c9: 'Production casing: isolates the high pore-pressure Fm-E/Fm-F section above the reservoir.',
};

export class CasingSystem {
  constructor(scene) {
    this.group = new Group();
    this.group.name = 'casing';
    scene.add(this.group);
    this.strings = {};
    for (const c of CASINGS) {
      if (c.liner) continue;
      const pick = { id: c.key, title: c.name, kind: 'casing', info: INFO[c.key], interval: () => [this.strings[c.key].topMD, this.strings[c.key].bottomMD] };
      const shoePick = { id: `${c.key}-shoe`, title: `${c.name} shoe`, kind: 'shoe', info: 'Float / guide shoe: guides the casing past ledges and stops cement U-tubing back inside.', interval: () => [c.shoe, c.shoe] };
      const sec = SECTIONS.find((s) => s.csg.key === c.key);
      const bodyMat = Mat.casingSteel(c.color);
      const comps = [];
      if (c.key !== 'c30') {
        comps.push({ key: `${c.key}-shoe`, name: 'Shoe', length: 3.4, rigid: () => makeShoe(c.od, c.color), pick: shoePick });
        comps.push({
          key: `${c.key}-track`, name: 'Shoe track', length: SHOE_TRACK - 3.4, radius: rad(c.od), material: bodyMat, pick,
          decor: [{ at: SHOE_TRACK - 3.4, build: () => makeFloatCollar(c.od, c.color) }, { at: JOINT.casing - 3.4, build: () => new Mesh(new CylinderGeometry(rad(c.od) * 1.07, rad(c.od) * 1.07, 1.3, 24, 1, true), Mat.coupling(c.color)) }],
        });
      }
      const asm = new StringAssembly({
        name: c.name,
        components: comps,
        pipe: {
          name: c.name, radius: rad(c.od), material: bodyMat, radialSegments: 28, uvScale: JOINT.casing,
          spacing: c.key === 'c30' ? 0 : JOINT.casing, jointRadius: rad(c.od) * 1.1, jointLength: 1.8, jointMaterial: Mat.coupling(c.color),
          pick, jointAtBottom: false,
        },
        maxPipeLength: c.shoe + 120,
      });
      asm.def = c;
      asm.sec = sec;
      asm.bodyMaterial = bodyMat;
      this.group.add(asm.group);
      this.strings[c.key] = asm;
    }
  }

  update(S) {
    for (const key in this.strings) {
      const asm = this.strings[key];
      const cs = S.casings[key];
      if (!cs || cs.state === 'none' || !(cs.shoeMD > cs.topMD)) { asm.hide(); continue; }
      asm.update(cs.shoeMD, cs.topMD);
      // active string slightly emphasised, installed strings subdued
      const active = cs.state === 'running' || (S.cement && S.cement.key === key);
      const m = asm.bodyMaterial;
      m.emissive.set(active ? '#5a4a30' : '#000000');
      m.emissiveIntensity = active ? 0.35 : 0;
    }
  }

  /** Current shoe positions for labels. */
  shoeMD(key, S) { const cs = S.casings[key]; return cs && cs.state !== 'none' ? cs.shoeMD : null; }
}
