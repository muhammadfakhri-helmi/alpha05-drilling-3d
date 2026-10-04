/**
 * Formation cross-section behind the cutaway.
 *
 * The formation colours, tops, the interpreted fault and labels are the
 * original engineering information. They are evaluated PER PIXEL in a shader
 * (same undulation + fault model as the original canvas), so formation
 * boundaries stay crisp at any zoom – from the whole-well overview down to a
 * few feet around the bit. Lithology patterns are drawn in world units and
 * fade out when they would alias. Text (formation names, lithology, TVD
 * scale) comes from a transparent canvas overlay. Not tone-mapped so the
 * engineering colours stay legible.
 */
import {
  Mesh, PlaneGeometry, ShaderMaterial, CanvasTexture, SRGBColorSpace, Line, BufferGeometry,
  LineDashedMaterial, TorusGeometry, MeshStandardMaterial, Group, Color,
} from 'three';
import { FORMATIONS, WELL } from '../engineeringData.js';
import { rad } from '../constants.js';
import { vsAtTvd, getPosition, TD, KOP, BUILD_RADIUS, survey, EOB } from '../trajectory.js';
import { makeCanvas } from '../utils/textures.js';
import { fmt } from '../utils/math.js';

export const WALL = { x0: -1700, x1: 6300, depth: 9500, z: -rad(30) - 1.5 };
const faultX = (d) => 4230 + (d - 6000) * 0.09;
const PATTERN_ID = { sand: 0, clay: 1, lime: 2, inter: 3 };

export function topAt(k, vs) {
  if (k === 0) return 0;
  const base = FORMATIONS[k].tvd;
  // undulation fades to zero at the well so the drawn tops honour the plan at the wellbore
  const w = 1 - Math.exp(-Math.pow((vs - vsAtTvd(base)) / 900, 2));
  let d = base + w * (55 * Math.sin(vs / 760 + k * 1.7) + 28 * Math.sin(vs / 290 + k * 2.3));
  if (k >= 4 && vs > faultX(base)) d += 340 + (k - 4) * 40;
  return d;
}

const VERT = /* glsl */`
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}`;

const FRAG = /* glsl */`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 fmColor[7];
uniform float fmTvd[7];
uniform int fmPattern[7];
uniform sampler2D labelMap;
uniform float tone;
uniform float buildR, kop, eobTvd, eobVs, tanInc;
varying vec3 vWorld;
varying vec2 vUv;

float vsAtTvd(float tvd) {
  if (tvd <= kop) return 0.0;
  if (tvd <= eobTvd) return buildR * (1.0 - cos(asin((tvd - kop) / buildR)));
  return eobVs + (tvd - eobTvd) * tanInc;
}
float faultX(float d) { return 4230.0 + (d - 6000.0) * 0.09; }
float topAt(int k, float vs) {
  float base = fmTvd[k];
  float w = 1.0 - exp(-pow((vs - vsAtTvd(base)) / 900.0, 2.0));
  float d = base + w * (55.0 * sin(vs / 760.0 + float(k) * 1.7) + 28.0 * sin(vs / 290.0 + float(k) * 2.3));
  if (k >= 4 && vs > faultX(base)) d += 340.0 + float(k - 4) * 40.0;
  return d;
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
// anti-aliased line of half-width hw (world units) with a 1 px minimum
float aline(float dist, float hw, float fw) { float w = max(hw, fw * 0.6); return 1.0 - smoothstep(w, w + fw, abs(dist)); }

float clayPat(vec2 p, float fw) {
  float row = floor(p.y / 6.0);
  float y = mod(p.y, 6.0) - 3.0;
  float x = mod(p.x + mod(row, 2.0) * 7.0, 14.0);
  return aline(y, 0.12, fw) * step(1.5, x) * step(x, 8.0);
}
float limePat(vec2 p, float fw) {
  float row = floor(p.y / 6.0);
  float h = aline(mod(p.y + 3.0, 6.0) - 3.0, 0.1, fw);
  float v = aline(mod(p.x + mod(row, 2.0) * 7.0 + 7.0, 14.0) - 7.0, 0.1, fw);
  return max(h, v);
}
float sandPat(vec2 p, float fw) {
  float row = floor(p.y / 5.0);
  vec2 c = vec2(mod(p.x + mod(row, 2.0) * 4.0, 8.0) - 4.0, mod(p.y, 5.0) - 2.5);
  return 1.0 - smoothstep(0.5, 0.5 + fw, length(c));
}
float pattern(int id, vec2 p, float fw) {
  if (id == 0) return sandPat(p, fw);
  if (id == 1) return clayPat(p, fw);
  if (id == 2) return limePat(p, fw);
  return mod(floor(p.y / 40.0), 2.0) < 1.0 ? clayPat(p, fw) : limePat(p, fw);
}

void main() {
  #include <logdepthbuf_fragment>
  float vs = vWorld.x;
  float d = -vWorld.y;
  int k = 0; float top = 0.0;
  for (int i = 1; i < 7; i++) { float t = topAt(i, vs); if (d >= t) { k = i; top = t; } }
  vec3 col = fmColor[k];
  vec2 p = vec2(vs, d);
  float fw = max(max(fwidth(vs), fwidth(d)), 1e-3); // ft per pixel

  // grain and subtle internal stratification
  float g = vnoise(p / 2.5) * 0.55 + vnoise(p / 15.0) * 0.45;
  col *= 0.93 + 0.12 * g;
  float strat = vnoise(vec2(vs / 300.0, d / 5.0));
  col *= 0.96 + 0.07 * strat;

  // lithology symbol pattern (two scales so the overview keeps a pattern too)
  float near = 1.0 - smoothstep(0.7, 2.2, fw);
  float far = smoothstep(1.6, 4.0, fw) * (1.0 - smoothstep(14.0, 30.0, fw));
  float pat = pattern(fmPattern[k], p, fw) * near + pattern(fmPattern[k], p / 8.0, fw / 8.0) * far;
  col *= 1.0 - 0.13 * pat;

  // formation tops, TVD grid, fault
  if (k > 0) col *= 1.0 - 0.5 * aline(d - top, 0.6, fw);
  if (k < 6) col *= 1.0 - 0.5 * aline(d - topAt(k + 1, vs), 0.6, fw);
  float gd = mod(d + 500.0, 1000.0) - 500.0;
  col = mix(col, vec3(0.92), 0.16 * aline(gd, 0.4, fw));
  if (d > 5600.0) {
    float dash = step(0.32, fract(d / 64.0));
    col = mix(col, vec3(0.05, 0.04, 0.035), 0.85 * dash * aline(vs - faultX(d), 6.0, fw));
  }

  vec4 lab = texture2D(labelMap, vUv);
  col = mix(col * tone, lab.rgb, lab.a);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

function labelOverlay(width) {
  const cw = width, ch = Math.round(width * (WALL.depth / (WALL.x1 - WALL.x0)));
  const cv = makeCanvas(cw, ch), g = cv.getContext('2d');
  const sx = cw / 2400;
  const X = (vs) => ((vs - WALL.x0) / (WALL.x1 - WALL.x0)) * cw, Y = (d) => (d / WALL.depth) * ch;
  g.textBaseline = 'alphabetic';
  // TVD scale
  g.font = `500 ${30 * sx}px Barlow, sans-serif`; g.fillStyle = 'rgba(236,239,241,.8)';
  for (let d = 1000; d < WALL.depth; d += 1000) g.fillText(`${fmt(d)} ft TVD`, 12 * sx, Y(d) - 7 * sx);
  // fault label
  g.font = `600 ${38 * sx}px "Barlow Condensed", "Arial Narrow", sans-serif`; g.fillStyle = 'rgba(236,239,241,.88)';
  g.fillText('Fault (interpreted)', X(faultX(6300)) + 16 * sx, Y(6300));
  // formation names + lithology
  for (let k = 0; k < FORMATIONS.length; k++) {
    const vs = -900, d0 = topAt(k, vs), d1 = k < FORMATIONS.length - 1 ? topAt(k + 1, vs) : WALL.depth;
    const y = Y((d0 + d1) / 2) + 14 * sx;
    g.font = `700 ${60 * sx}px "Barlow Condensed", "Arial Narrow", sans-serif`;
    g.fillStyle = 'rgba(20,18,14,.55)'; g.fillText(FORMATIONS[k].name, X(vs) + 2, y + 2);
    g.fillStyle = '#F1EEE6'; g.fillText(FORMATIONS[k].name, X(vs), y);
    if (Y(d1) - Y(d0) > 110 * sx) {
      g.font = `500 ${27 * sx}px Barlow, sans-serif`; g.fillStyle = 'rgba(241,238,230,.88)';
      g.fillText(FORMATIONS[k].lith, X(vs), y + 36 * sx);
    }
  }
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export function buildFormations(scene, renderer, { width = 2048 } = {}) {
  const group = new Group();
  group.name = 'formations';
  const s = {};
  survey(EOB, s);
  const labelMap = labelOverlay(width);
  labelMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const mat = new ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, toneMapped: false,
    uniforms: {
      fmColor: { value: FORMATIONS.map((f) => new Color(f.color)) },
      fmTvd: { value: FORMATIONS.map((f) => f.tvd) },
      fmPattern: { value: FORMATIONS.map((f) => PATTERN_ID[f.pattern]) },
      labelMap: { value: labelMap },
      tone: { value: 0.8 },
      buildR: { value: BUILD_RADIUS }, kop: { value: KOP }, eobTvd: { value: s.tvd }, eobVs: { value: s.vs },
      tanInc: { value: Math.tan(s.inc) },
    },
  });
  const w = WALL.x1 - WALL.x0;
  const wall = new Mesh(new PlaneGeometry(w, WALL.depth), mat);
  wall.position.set(WALL.x0 + w / 2, -WALL.depth / 2, WALL.z);
  wall.name = 'formation-wall';
  wall.userData.pick = { id: 'formation', title: 'Formation cross-section', kind: 'hole', info: 'Anonymised formations Fm-A … Fm-G with an interpreted fault; tops honour the plan at the wellbore.' };
  group.add(wall);

  // planned trajectory trace on the section
  const pts = [];
  for (let md = 0; md <= TD; md += 40) pts.push(getPosition(md).setZ(WALL.z + 0.3));
  const line = new Line(new BufferGeometry().setFromPoints(pts), new LineDashedMaterial({ color: 0xF2C27D, dashSize: 60, gapSize: 40, toneMapped: false }));
  line.computeLineDistances();
  group.add(line);

  // target ring at the top of Fm-G
  const tgt = new Mesh(new TorusGeometry(50, 0.7, 8, 96), new MeshStandardMaterial({ color: '#F2C27D', emissive: '#6b4a17', emissiveIntensity: 0.8, transparent: true, opacity: 0.75 }));
  getPosition(WELL.target.md, tgt.position);
  tgt.rotation.x = Math.PI / 2;
  tgt.userData.pick = { id: 'target', title: 'Target: top of Fm-G', kind: 'target', info: `Reservoir target at ${fmt(WELL.target.tvd)} ft TVD (carbonate).`, interval: () => [WELL.target.md, WELL.target.md] };
  group.add(tgt);

  scene.add(group);
  return { group, wall, material: mat };
}
