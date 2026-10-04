/**
 * MASTER TRAJECTORY ENGINE
 * ------------------------
 * Single source of truth for every downhole position in the application.
 *
 *   MD ──► survey(md) ──► position / tangent / normal / binormal / quaternion
 *
 * The plan is a J-type well: vertical to KOP, constant build (BUR) to the
 * maximum inclination, then a straight tangent to TD. The geometry is the
 * exact minimum-curvature solution for that profile (a circular arc of
 * radius 18000 / (π · BUR) ft in the vertical-section plane), so MD is the
 * true arc length of the drawn path.
 *
 * Local equipment frame (returned by getQuaternion):
 *   +X = normal   (in-plane, perpendicular to the hole axis, towards the high side of the build)
 *   +Y = uphole   (−tangent; equipment meshes are modelled "standing up" along +Y)
 *   +Z = binormal (out of the section plane, towards the cutaway viewer)
 *
 * Because the profile is planar the frame never twists, so meshes placed with
 * it cannot flip. MD < 0 is allowed and continues the vertical axis above
 * ground (used for pipe standing in the derrick).
 */
import { Vector3, Quaternion, Curve } from 'three';
import { WELL } from './engineeringData.js';
import { D2R } from './constants.js';

export const KOP = WELL.kop;
export const BUR = WELL.bur;
export const MAX_INC = WELL.maxInc;
export const TD = WELL.td;

/** Build radius (ft) for a constant build rate in deg/100 ft. */
export const BUILD_RADIUS = 18000 / (Math.PI * BUR);
/** End of build MD. */
export const EOB = KOP + (MAX_INC / BUR) * 100;

const INC_R = MAX_INC * D2R;
const EOB_TVD = KOP + BUILD_RADIUS * Math.sin(INC_R);
const EOB_VS = BUILD_RADIUS * (1 - Math.cos(INC_R));
const Z_AXIS = new Vector3(0, 0, 1);

/**
 * Survey at a measured depth.
 * @returns {{md:number, tvd:number, vs:number, inc:number}} inc in radians
 */
export function survey(md, out = {}) {
  out.md = md;
  if (md <= KOP) {
    out.tvd = md; out.vs = 0; out.inc = 0;
  } else if (md <= EOB) {
    const a = ((md - KOP) * BUR / 100) * D2R;
    out.tvd = KOP + BUILD_RADIUS * Math.sin(a);
    out.vs = BUILD_RADIUS * (1 - Math.cos(a));
    out.inc = a;
  } else {
    const L = md - EOB;
    out.tvd = EOB_TVD + L * Math.cos(INC_R);
    out.vs = EOB_VS + L * Math.sin(INC_R);
    out.inc = INC_R;
  }
  return out;
}

const _s = {};
export const tvdAt = (md) => survey(md, _s).tvd;
export const vsAt = (md) => survey(md, _s).vs;
/** Inclination in degrees. */
export const incAt = (md) => survey(md, _s).inc / D2R;

export function getPosition(md, target = new Vector3()) {
  survey(md, _s);
  return target.set(_s.vs, -_s.tvd, 0);
}

/** Unit tangent pointing DOWNHOLE (direction of increasing MD). */
export function getTangent(md, target = new Vector3()) {
  const a = survey(md, _s).inc;
  return target.set(Math.sin(a), -Math.cos(a), 0);
}

/** In-plane unit normal (perpendicular to the tangent). */
export function getNormal(md, target = new Vector3()) {
  const a = survey(md, _s).inc;
  return target.set(Math.cos(a), Math.sin(a), 0);
}

/** Out-of-plane unit binormal (= tangent × normal). Constant for a planar well. */
export function getBinormal(_md, target = new Vector3()) {
  return target.copy(Z_AXIS);
}

/** Orientation that maps local +Y to "uphole" and local +X to the normal. */
export function getQuaternion(md, target = new Quaternion()) {
  return target.setFromAxisAngle(Z_AXIS, survey(md, _s).inc);
}

/** Complete frame at a measured depth. */
export function getTrajectoryFrame(md, frame = {
  position: new Vector3(), tangent: new Vector3(), normal: new Vector3(),
  binormal: new Vector3(), quaternion: new Quaternion(),
}) {
  survey(md, _s);
  const a = _s.inc;
  frame.md = md;
  frame.inc = a;
  frame.position.set(_s.vs, -_s.tvd, 0);
  frame.tangent.set(Math.sin(a), -Math.cos(a), 0);
  frame.normal.set(Math.cos(a), Math.sin(a), 0);
  frame.binormal.copy(Z_AXIS);
  frame.quaternion.setFromAxisAngle(Z_AXIS, a);
  return frame;
}

/** Places an Object3D modelled along +Y (origin at its downhole end) at an MD. */
export function placeAtMD(object, md) {
  getPosition(md, object.position);
  getQuaternion(md, object.quaternion);
  return object;
}

/** Vertical section at a TVD (used by the formation cross-section). */
export function vsAtTvd(tvd) {
  if (tvd <= KOP) return 0;
  if (tvd <= EOB_TVD) return BUILD_RADIUS * (1 - Math.cos(Math.asin((tvd - KOP) / BUILD_RADIUS)));
  return EOB_VS + (tvd - EOB_TVD) * Math.tan(INC_R);
}

/** Inverse of tvdAt (monotonic for this profile). */
export function mdAtTvd(tvd) {
  if (tvd <= KOP) return tvd;
  if (tvd <= EOB_TVD) return KOP + (Math.asin((tvd - KOP) / BUILD_RADIUS) / D2R) * 100 / BUR;
  return EOB + (tvd - EOB_TVD) / Math.cos(INC_R);
}

/** True when [a,b] overlaps the curved build section. */
export const overlapsBuild = (a, b) => b > KOP && a < EOB;

/**
 * Adaptive ring sampling for tubulars along [a, b].
 * Fine steps in the curved build section, coarse steps on straight sections
 * (which need no extra rings to be geometrically exact). KOP/EOB and any
 * caller-supplied break MDs are always sampled; "split" breaks emit a pair of
 * rings so a radius or colour can change abruptly.
 */
export function sampleMDs(a, b, { step = 8, straightStep = 150, breaks = null, splitEps = 0.002 } = {}, out = []) {
  out.length = 0;
  if (!(b > a)) return out;
  const knots = [a, b];
  if (KOP > a && KOP < b) knots.push(KOP);
  if (EOB > a && EOB < b) knots.push(EOB);
  const splits = [];
  if (breaks) {
    for (const br of breaks) {
      const md = typeof br === 'number' ? br : br.md;
      if (md > a + splitEps && md < b - splitEps) {
        knots.push(md);
        if (typeof br !== 'number' && br.split) splits.push(md);
      }
    }
  }
  knots.sort((x, y) => x - y);
  for (let k = 0; k < knots.length - 1; k++) {
    const k0 = knots[k], k1 = knots[k + 1];
    if (k1 - k0 < 1e-6) continue;
    const curved = overlapsBuild(k0, k1);
    const n = Math.max(1, Math.ceil((k1 - k0) / (curved ? step : straightStep)));
    for (let i = 0; i < n; i++) {
      const md = k0 + ((k1 - k0) * i) / n;
      if (i === 0 && splits.includes(k0)) { out.push(k0 - splitEps / 2, k0 + splitEps / 2); }
      else out.push(md);
    }
  }
  out.push(b);
  return out;
}

/**
 * THREE.Curve over an MD interval. MD is arc length, so getPointAt == getPoint.
 * Used for lines/traces and for any code that wants a standard Curve.
 */
export class TrajectoryCurve extends Curve {
  constructor(mdStart, mdEnd) {
    super();
    this.mdStart = mdStart;
    this.mdEnd = mdEnd;
  }
  getPoint(u, target = new Vector3()) {
    return getPosition(this.mdStart + u * (this.mdEnd - this.mdStart), target);
  }
  getPointAt(u, target) { return this.getPoint(u, target); }
  getTangent(u, target = new Vector3()) {
    return getTangent(this.mdStart + u * (this.mdEnd - this.mdStart), target);
  }
  getTangentAt(u, target) { return this.getTangent(u, target); }
  getLength() { return this.mdEnd - this.mdStart; }
}

/** Closest MD on the trajectory to a world ray (used for MD-based picking). */
export function closestMDToRay(ray, mdMin = 0, mdMax = TD, step = 10) {
  const p = new Vector3();
  let best = { md: mdMin, dist: Infinity };
  for (let md = mdMin; md <= mdMax; md += step) {
    const d = ray.distanceSqToPoint(getPosition(md, p));
    if (d < best.dist) best = { md, dist: d };
  }
  // refine
  for (let md = Math.max(mdMin, best.md - step); md <= Math.min(mdMax, best.md + step); md += 0.5) {
    const d = ray.distanceSqToPoint(getPosition(md, p));
    if (d < best.dist) best = { md, dist: d };
  }
  best.dist = Math.sqrt(best.dist);
  return best;
}
