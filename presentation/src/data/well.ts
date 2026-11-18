/**
 * Geometry data for the 3D scene.
 *
 * Every value that is SHOWN as a number comes from the PPTX v4 and is used as
 * text in content.ts. Values marked "repo" come from the existing digital twin
 * (app/src/engineeringData.js) and are used ONLY to place geometry; they are
 * never printed on screen.
 */

export const WELL = {
  kopMd: 700, //            PPTX slide 2
  finalIncDeg: 29.74, //     PPTX slide 2
  azimuthDeg: 222.55, //     PPTX slide 2 (well is drawn in its vertical-section plane)
  tdMd: 9604, //             PPTX slide 2
  tdTvd: 8561, //            PPTX slide 2 (reproduced by the trajectory engine)
  burDegPer100ft: 2, //      repo (build rate; reproduces 8,561 ft TVD at TD)
} as const;

/** Visual scale factors (not data). */
export const SCALE = {
  /** Every hole / tubular diameter is drawn this many times larger than true (depth is true scale). */
  radial: 72,
  /** Surface equipment (rig, BOP stack, separator) is a schematic model at this multiple of true size. */
  surface: 12,
} as const;

/** Cellar floor in world units (schematic surface model: 6 ft real x surface scale). Casing heads land here. */
export const CELLAR_Y = -6 * 12;

/** Diameter in inches to exaggerated world radius (ft units). */
export const rad = (inch: number) => (inch / 24) * SCALE.radial;

export type SectionId = 's26' | 's17' | 's12' | 's8';

/** Hole sections. top/bottom MD from PPTX (slides 6, 8, 10, 12); 26-in top = conductor shoe (repo). */
export const HOLES: { id: SectionId; holeIn: number; top: number; bottom: number; label: string }[] = [
  { id: 's26', holeIn: 26, top: 120, bottom: 2000, label: '26-in' },
  { id: 's17', holeIn: 17.5, top: 2000, bottom: 5000, label: '17-1/2-in' },
  { id: 's12', holeIn: 12.25, top: 5000, bottom: 9259, label: '12-1/4-in' },
  { id: 's8', holeIn: 8.5, top: 9259, bottom: 9604, label: '8-1/2-in' },
];

export interface CasingDef {
  key: string;
  label: string;
  od: number;
  top: number;
  shoe: number;
  /** hole (in) the string is cemented in, or outer string OD above previous shoe */
  hole?: number;
  liner?: boolean;
  section?: SectionId;
}

/** Casing program (PPTX slide 2). Conductor shoe and liner top are repo values (geometry only). */
export const CASINGS: CasingDef[] = [
  { key: 'c30', label: '30-in', od: 30, top: 0, shoe: 120 },
  { key: 'c20', label: '20-in', od: 20, top: 0, shoe: 2000, hole: 26, section: 's26' },
  { key: 'c13', label: '13-3/8-in', od: 13.375, top: 0, shoe: 5000, hole: 17.5, section: 's17' },
  { key: 'c9', label: '9-5/8-in', od: 9.625, top: 0, shoe: 9259, hole: 12.25, section: 's12' },
  { key: 'c7', label: '7-in liner', od: 7, top: 9108, shoe: 9604, hole: 8.5, liner: true, section: 's8' },
];

/** Completion (PPTX slide 13): 3-1/2-in tubing, ESP intake 6,013 ft, EOT 6,025 ft MD. */
export const COMPLETION = {
  tubingOd: 3.5,
  intakeMd: 6013,
  eotMd: 6025,
  /** visual pump length above the intake (not data) */
  pumpVisualLength: 70,
  /** perforation intervals inside the reservoir (repo, geometry only) */
  perfs: [[9330, 9360], [9400, 9430], [9470, 9500], [9540, 9570]] as [number, number][],
};

/** Anonymised formation tops (repo). tvd = top. Colours tuned for the light theme. */
export const FORMATIONS = [
  { name: 'Fm-A', tvd: 0, color: '#E3D3AE' },
  { name: 'Fm-B', tvd: 630, color: '#D3C9A6' },
  { name: 'Fm-C', tvd: 2158, color: '#C4C6A7' },
  { name: 'Fm-D', tvd: 4728, color: '#DAD5C3' },
  { name: 'Fm-E', tvd: 5318, color: '#CBC3AA' },
  { name: 'Fm-F', tvd: 7388, color: '#BDBBA4' },
  { name: 'Fm-G', tvd: 8261, color: '#E8D7A4' },
];
export const EARTH_BOTTOM_TVD = 9900;
