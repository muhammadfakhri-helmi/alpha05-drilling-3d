/**
 * Global visual / unit constants.
 *
 * World units are FEET. +Y is up, ground level is y = 0, the well is drawn in
 * the X–Y vertical-section plane (X = vertical section, -Y = TVD) and +Z points
 * towards the viewer of the cutaway.
 */

/** Radial exaggeration applied to every hole / tubular diameter (axial MD is true scale). */
export const RADIAL_EXAGGERATION = 5;

/** Diameter in inches -> exaggerated world radius in feet. */
export const rad = (inch) => (inch / 24) * RADIAL_EXAGGERATION;

/** Cellar floor depth below ground (ft). Casing heads sit here. */
export const CELLAR_DEPTH = 10;

/** Rig floor elevation above ground (ft). */
export const FLOOR_Y = 27.6;

/** Crown block elevation (ft) – limits travelling block height. */
export const CROWN_Y = 168;

/**
 * Visual joint lengths (ft). These are typical API ranges used ONLY to space
 * couplings / tool joints and to estimate a visual joint count; they are not
 * part of the well plan.
 */
export const JOINT = {
  casing: 40,   // Range 3 casing
  drillPipe: 31, // Range 2 drill pipe
  tubing: 31.5,
  stand: 93,    // 3-joint stand handled by the top drive
};

/** Minimum top-drive stem height above the rig floor while connected (ft). */
export const HOOK_MIN = 6;

/** Small epsilon used to create a step change in a tubular's radius at a break MD. */
export const MD_EPS = 0.002;

export const D2R = Math.PI / 180;

/**
 * The full 5× radial exaggeration applies downhole only. At surface, strings
 * are drawn at a mild 2× (true scale would make a 9-5/8" joint ~0.8 ft wide
 * next to a 140 ft mast, too thin to read), tapering to the downhole value a
 * few feet below the cellar floor. Returns the multiplier applied to an
 * already-exaggerated radius.
 */
export const SURFACE_EXAGGERATION = 2;
const TAPER_TOP = -4;
const TAPER_BOT = CELLAR_DEPTH + 18;
export function surfaceTaper(md) {
  if (md >= TAPER_BOT) return 1;
  const t = Math.min(1, Math.max(0, (md - TAPER_TOP) / (TAPER_BOT - TAPER_TOP)));
  const s = t * t * (3 - 2 * t);
  const k = SURFACE_EXAGGERATION / RADIAL_EXAGGERATION;
  return k + (1 - k) * s;
}
