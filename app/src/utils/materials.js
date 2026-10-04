/**
 * Reusable material families + the cutaway clipping convention.
 *
 * Cutaway: everything BELOW the cellar floor is cut by the vertical section
 * plane z = 0 (the half facing the viewer is removed) so that hole, casing,
 * cement, pipe bores and fluids can be read in section. Above the cellar,
 * equipment is rendered whole.
 */
import { MeshStandardMaterial, MeshPhysicalMaterial, Plane, Vector3, DoubleSide, Color } from 'three';
import { CELLAR_DEPTH } from '../constants.js';
import { brushedTexture, pipeBandTexture } from './textures.js';

export const CUT_PLANES = [
  new Plane(new Vector3(0, 0, -1), 0),           // keep z <= 0
  new Plane(new Vector3(0, 1, 0), CELLAR_DEPTH), // keep y >= -cellar
];

/** Apply the cutaway convention (clipped only where BOTH planes cut). */
export function cut(m, { doubleSide = true } = {}) {
  m.clippingPlanes = CUT_PLANES;
  m.clipIntersection = true;
  if (doubleSide) m.side = DoubleSide;
  return m;
}

const cache = new Map();
const once = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
let brushed = null;
const brushedMap = () => (brushed ??= brushedTexture());

export const Mat = {
  paintedSteel: (color = '#D9D3C4', o = {}) => once(`ps${color}${JSON.stringify(o)}`, () => new MeshStandardMaterial({ color, metalness: 0.25, roughness: 0.55, ...o })),
  galvanized: () => once('galv', () => new MeshStandardMaterial({ color: '#A3A8AA', metalness: 0.7, roughness: 0.42, roughnessMap: brushedMap() })),
  darkSteel: () => once('dark', () => new MeshStandardMaterial({ color: '#4A4F53', metalness: 0.6, roughness: 0.45 })),
  frameSteel: () => once('frame', () => new MeshStandardMaterial({ color: '#8E918E', metalness: 0.4, roughness: 0.6 })),
  bopPaint: () => once('bop', () => new MeshStandardMaterial({ color: '#B8352D', metalness: 0.3, roughness: 0.48 })),
  wellheadPaint: () => once('wh', () => new MeshStandardMaterial({ color: '#7FA468', metalness: 0.3, roughness: 0.5 })),
  concrete: (map) => once('conc', () => new MeshStandardMaterial({ color: '#C9C4BA', roughness: 0.95, metalness: 0, map, side: DoubleSide })),
  rubber: () => once('rub', () => new MeshStandardMaterial({ color: '#222426', roughness: 0.8, metalness: 0 })),
  safetyYellow: () => once('yel', () => new MeshStandardMaterial({ color: '#D9A93A', roughness: 0.5, metalness: 0.25 })),
  orange: () => once('ora', () => new MeshStandardMaterial({ color: '#C4532E', roughness: 0.5, metalness: 0.25 })),

  /** Drill pipe – band texture scrolled around the circumference to suggest rotation. */
  drillPipe: () => once('dp', () => {
    const map = pipeBandTexture('#97A1A8', '#626B72');
    return cut(new MeshStandardMaterial({ color: '#ffffff', map, metalness: 0.55, roughness: 0.38 }));
  }),
  toolJoint: () => once('tj', () => cut(new MeshStandardMaterial({ color: '#7E878E', metalness: 0.65, roughness: 0.32 }))),
  casingSteel: (color) => cut(new MeshStandardMaterial({ color, metalness: 0.62, roughness: 0.36, roughnessMap: brushedMap() })),
  coupling: (color) => cut(new MeshStandardMaterial({ color: new Color(color).multiplyScalar(0.6), metalness: 0.7, roughness: 0.32 })),
  tubingSteel: () => once('tbg', () => cut(new MeshStandardMaterial({ color: '#6F8CA3', metalness: 0.5, roughness: 0.38 }))),
  cement: (color) => cut(new MeshStandardMaterial({ color, roughness: 0.96, metalness: 0 })),
  displacement: () => once('disp', () => cut(new MeshStandardMaterial({ color: '#7A5A3A', roughness: 0.6, metalness: 0, transparent: true, opacity: 0.72 }))),
  mud: (color) => cut(new MeshPhysicalMaterial({ color, roughness: 0.35, metalness: 0, transparent: true, opacity: 0.42, depthWrite: false })),
  /** Open-hole wall: rough rock, tinted per formation through vertex colours. */
  holeWall: () => once('hole', () => cut(new MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 1, metalness: 0 }))),
  bhaPart: (color, metal = 0.55) => cut(new MeshStandardMaterial({ color, metalness: metal, roughness: 0.4 })),
  solidPart: (color, metal = 0.5, rough = 0.4) => new MeshStandardMaterial({ color, metalness: metal, roughness: rough }),
};

/** Materials that should brighten slightly when their equipment is the active operation. */
export function setEmphasis(material, amount, color = '#F2C27D') {
  if (!material || !material.emissive) return;
  if (!material.userData.baseEmissive) material.userData.baseEmissive = material.emissive.clone();
  material.emissive.copy(material.userData.baseEmissive).lerp(new Color(color), amount);
  material.emissiveIntensity = amount > 0 ? 0.35 : 1;
}
