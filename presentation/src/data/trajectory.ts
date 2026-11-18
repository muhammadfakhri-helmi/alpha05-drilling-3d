/**
 * Trajectory engine (ported from the original digital twin, app/src/trajectory.js).
 *
 * J-type plan: vertical to KOP, constant build (BUR) to the final inclination,
 * then a straight tangent to TD. Geometry is the exact minimum-curvature
 * solution of that profile, so MD is the true arc length of the drawn path.
 *
 * Pure math, no three.js import, so it runs in node tests as well.
 *
 * World frame: X = vertical section (ft, along the 222.55 deg azimuth plane),
 * Y = up (Y = -TVD), Z = towards the viewer.
 */
import { WELL } from './well.ts';

const D2R = Math.PI / 180;

export const KOP = WELL.kopMd;
export const BUR = WELL.burDegPer100ft;
export const MAX_INC = WELL.finalIncDeg;
export const TD = WELL.tdMd;

export const BUILD_RADIUS = 18000 / (Math.PI * BUR);
export const EOB = KOP + (MAX_INC / BUR) * 100;

const INC_R = MAX_INC * D2R;
const EOB_TVD = KOP + BUILD_RADIUS * Math.sin(INC_R);
const EOB_VS = BUILD_RADIUS * (1 - Math.cos(INC_R));

export interface Survey { md: number; tvd: number; vs: number; inc: number }

/** Survey at a measured depth. inc in radians. MD < 0 continues the vertical axis above ground. */
export function survey(md: number): Survey {
  if (md <= KOP) return { md, tvd: md, vs: 0, inc: 0 };
  if (md <= EOB) {
    const a = ((md - KOP) * BUR / 100) * D2R;
    return { md, tvd: KOP + BUILD_RADIUS * Math.sin(a), vs: BUILD_RADIUS * (1 - Math.cos(a)), inc: a };
  }
  const L = md - EOB;
  return { md, tvd: EOB_TVD + L * Math.cos(INC_R), vs: EOB_VS + L * Math.sin(INC_R), inc: INC_R };
}

export const tvdAt = (md: number) => survey(md).tvd;
export const vsAt = (md: number) => survey(md).vs;
export const incDegAt = (md: number) => survey(md).inc / D2R;

/** World position [x, y, z] of the well axis at an MD. */
export function posAt(md: number): [number, number, number] {
  const s = survey(md);
  return [s.vs, -s.tvd, 0];
}

/** Unit tangent pointing downhole. */
export function tangentAt(md: number): [number, number, number] {
  const a = survey(md).inc;
  return [Math.sin(a), -Math.cos(a), 0];
}

/** In-plane unit normal (perpendicular to the tangent, towards +X / high side). */
export function normalAt(md: number): [number, number, number] {
  const a = survey(md).inc;
  return [Math.cos(a), Math.sin(a), 0];
}

/** Inverse of tvdAt (monotonic for this profile). */
export function mdAtTvd(tvd: number): number {
  if (tvd <= KOP) return tvd;
  if (tvd <= EOB_TVD) return KOP + (Math.asin((tvd - KOP) / BUILD_RADIUS) / D2R) * 100 / BUR;
  return EOB + (tvd - EOB_TVD) / Math.cos(INC_R);
}

/**
 * MD samples for building geometry along [a, b]: fine in the curved build
 * section, coarse on straight sections (which need no extra rings).
 */
export function sampleMDs(a: number, b: number, step = 20, straightStep = 400): number[] {
  if (!(b > a)) return [];
  const knots = [a, b];
  if (KOP > a && KOP < b) knots.push(KOP);
  if (EOB > a && EOB < b) knots.push(EOB);
  knots.sort((x, y) => x - y);
  const out: number[] = [];
  for (let k = 0; k < knots.length - 1; k++) {
    const k0 = knots[k], k1 = knots[k + 1];
    if (k1 - k0 < 1e-6) continue;
    const curved = k1 > KOP && k0 < EOB;
    const n = Math.max(1, Math.ceil((k1 - k0) / (curved ? step : straightStep)));
    for (let i = 0; i < n; i++) out.push(k0 + ((k1 - k0) * i) / n);
  }
  out.push(b);
  return out;
}
