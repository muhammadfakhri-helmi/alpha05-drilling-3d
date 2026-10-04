/**
 * Alpha-05 well plan data (anonymised).
 *
 * All values are carried over unchanged from the original single-file mockup.
 * Text was translated to English; numbers were NOT altered. Any inconsistency
 * found in these values is documented in ENGINEERING_REVIEW.md instead of
 * being silently "fixed" here.
 */
import { CELLAR_DEPTH } from './constants.js';

export const WELL = {
  name: 'Alpha-05',
  type: 'Directional J-type',
  kop: 700,          // ft MD
  bur: 2,            // deg / 100 ft
  maxInc: 29.74,     // deg
  azimuth: 222.55,   // deg (not used for geometry – the well is drawn in its vertical-section plane)
  td: 9604,          // ft MD
  tdTvd: 8561,       // ft TVD (reported; reproduced by the trajectory engine)
  rig: '1500 HP electric, top drive',
  target: { formation: 'Fm-G', tvd: 8261, md: 9258.5 },
  initialRate: '210 BOPD',
};

/** Formation tops (anonymised). md / tvd are tops. */
export const FORMATIONS = [
  { name: 'Fm-A', tvd: 0, md: 0, color: '#B7A277', lith: 'Alluvium', pattern: 'sand' },
  { name: 'Fm-B', tvd: 630, md: 630, color: '#8E9A6A', lith: 'Claystone with sand interbeds', pattern: 'clay' },
  { name: 'Fm-C', tvd: 2158, md: 2229, color: '#6F8767', lith: 'Claystone with limestone interbeds', pattern: 'clay' },
  { name: 'Fm-D', tvd: 4728, md: 5189, color: '#B3AE98', lith: 'Limestone', pattern: 'lime' },
  { name: 'Fm-E', tvd: 5318, md: 5869, color: '#8B8774', lith: 'Interbedded claystone and limestone', pattern: 'inter' },
  { name: 'Fm-F', tvd: 7388, md: 8253, color: '#77806F', lith: 'Interbedded claystone, limestone, siltstone', pattern: 'inter' },
  { name: 'Fm-G', tvd: 8261, md: 9258, color: '#C6BC98', lith: 'Carbonate (reservoir)', pattern: 'lime' },
];

export function formationIndexAtMD(md) {
  let k = 0;
  for (let i = 0; i < FORMATIONS.length; i++) if (md >= FORMATIONS[i].md) k = i;
  return k;
}

/**
 * BHA rows: [name, OD (in), length (ft), type, bladeOD?]
 * Listed bottom (bit) -> top, exactly as in the plan.
 */
export const SECTIONS = [
  {
    id: 's26', hole: '26"', holeIn: 26, top: 120, bot: 2000, bit: 'Milled tooth SB115C', bitType: 'mt',
    mud: { type: 'HPWBM (inhibitive)', mw: [9.8, 12.0], win: [9.0, 15.4], note: 'Kill mud 13.0 ppg and 80 ppb LCM pill on standby at location. HiVis and HiDens sweeps at TD.' },
    hyd: { gpm: 1100, spp: 2715, tq: 3227, hl: 130, hsi: 0.8, liner: '7"', tfa: 1.4 },
    csg: { key: 'c20', name: '20"', od: 20, spec: 'K-55, 133 ppf, BTC', shoe: 2000, shoeTVD: 1956, sf: { Burst: 1.58, Collapse: 1.32, Axial: 3.15, Triaxial: 2.53 } },
    cem: 'Lead 12.5 ppg + tail 15.8 ppg, 100% excess, TOC at surface',
    wc: { bop: 'Diverter 29-1/2" x 500 psi', kt: '—', lot: '—' },
    haz: ['Reactive shale', 'Pack off', 'Tight spot'],
    bha: [['Bit 26" milled tooth', 26, 1.5, 'bit'], ['Mud motor 9-5/8"', 9.625, 30, 'motor'], ['Sub 8"', 8, 2, 'sub'], ['Drill collar 8"', 8, 31, 'dc'], ['MWD 8"', 8, 30, 'mwd'], ['Drill collar 8" x2', 8, 62, 'dc'], ['Jar 8"', 8, 31, 'jar'], ['Drill collar 8"', 8, 31, 'dc'], ['Sub 8"', 8, 2, 'sub'], ['HWDP 5"', 5, 93, 'hw']],
  },
  {
    id: 's17', hole: '17-1/2"', holeIn: 17.5, top: 2000, bot: 5000, bit: 'PDC TK59', bitType: 'pdc',
    mud: { type: 'HPWBM (inhibitive)', mw: [12.0, 14.0], win: [11.5, 15.4], note: 'Fracseal 2 ppb from 3,500 ft. Kill mud 15.0 ppg. HiDens sweep every 5 stands until MW exceeds 13 ppg.' },
    hyd: { gpm: 900, spp: 3244, tq: 8819, hl: 197, hsi: 1.6, liner: '6-1/2"', tfa: 1.2 },
    csg: { key: 'c13', name: '13-3/8"', od: 13.375, spec: 'K-55, 68 ppf, BTC', shoe: 5000, shoeTVD: 4564, sf: { Burst: 1.75, Collapse: 1.18, Axial: 2.54, Triaxial: 1.89 } },
    cem: 'Single slurry 15.8 ppg, 100% excess, TOC at surface',
    wc: { bop: 'BOP 21-1/4" x 2,000 psi', kt: '178.87 bbl @ 10.09 ppg', lot: '15.98 ppg EMW (20" shoe)' },
    haz: ['Partial loss', 'Tight spot', 'Gumbo'],
    bha: [['Bit 17-1/2" PDC', 17.5, 1.5, 'bit'], ['Mud motor 9-5/8"', 9.625, 30, 'motor'], ['Sub 8"', 8, 2, 'sub'], ['Stabilizer 17-1/2"', 8, 7, 'stab', 17.5], ['Drill collar 8"', 8, 30, 'dc'], ['MWD 8"', 8, 30, 'mwd'], ['Drill collar 8" x2', 8, 60, 'dc'], ['Jar 8"', 8, 30, 'jar'], ['Drill collar 8"', 8, 30, 'dc'], ['Sub 8"', 8, 2, 'sub'], ['HWDP 5"', 5, 93, 'hw']],
  },
  {
    id: 's12', hole: '12-1/4"', holeIn: 12.25, top: 5000, bot: 9259, bit: 'PDC MDi519', bitType: 'pdc',
    mud: { type: 'HPWBM (inhibitive)', mw: [14.0, 15.0], win: [10.7, 16.6], win2: 15.1, note: 'Kill mud 16.0 ppg. Fracseal 2 ppb maintained. HiVis sweep every 5 stands.' },
    hyd: { gpm: 850, spp: 4488, tq: 15915, hl: 291, hsi: 2.0, liner: '6"', tfa: 1.4 },
    csg: { key: 'c9', name: '9-5/8"', od: 9.625, spec: 'L-80, 47 ppf, BTC', shoe: 9259, shoeTVD: 8261, sf: { Burst: 1.81, Collapse: 1.97, Axial: 2.52, Triaxial: 1.73 } },
    cem: 'Single slurry 15.8 ppg, 50% excess, TOC at surface',
    wc: { bop: 'BOP 13-5/8" (annular + 3 rams)', kt: '51.27 bbl @ 13.9 ppg', lot: '16.2 ppg EMW (13-3/8" shoe)' },
    haz: ['Formation pressure', 'Partial loss', 'Tight spot'],
    bha: [['Bit 12-1/4" PDC', 12.25, 1.3, 'bit'], ['Mud motor 8"', 8, 30, 'motor'], ['Sub 8"', 8, 2, 'sub'], ['Stabilizer 12-1/4"', 8.25, 6, 'stab', 12.25], ['Drill collar 8"', 8, 30, 'dc'], ['MWD 8"', 8, 30, 'mwd'], ['Drill collar 8"', 8, 30, 'dc'], ['Circulating sub', 8.25, 3, 'sub'], ['Port collar / diverter sub', 8, 2, 'sub'], ['HWDP 5"', 5, 62, 'hw'], ['Jar 6-1/2"', 6.5, 30, 'jar'], ['HWDP 5"', 5, 62, 'hw']],
  },
  {
    id: 's8', hole: '8-1/2"', holeIn: 8.5, top: 9259, bot: 9604, bit: 'PDC SKFX519S', bitType: 'pdc',
    mud: { type: 'RDIF, KCl 3%', mw: [8.7, 9.0], win: [9.0, 17.7], note: 'Seepage below 30 bph: add CaCO3 M 5–10 ppb. Above 30 bph: spot 25–35 ppb LCM pill.' },
    hyd: { gpm: 600, spp: 1597, tq: 18664, hl: 321, hsi: 0.9, liner: '6"', tfa: 1.4 },
    csg: { key: 'c7', name: '7" liner', od: 7, spec: 'L-80, 26 ppf, BTC', shoe: 9604, shoeTVD: 8561, tol: 9108, sf: { Burst: 7.24, Collapse: 1.35, Axial: 4.58, Triaxial: 2.24 } },
    cem: 'Single slurry 15.8 ppg, 100% excess, TOC at top of liner',
    wc: { bop: 'BOP 13-5/8" (annular + 3 rams)', kt: '168.29 bbl @ 10.18 ppg', lot: '16.55 ppg EMW (9-5/8" shoe)' },
    haz: ['Partial loss', 'Tight spot', 'Logging'],
    eval: 'Quad combo, resistivity, advanced cement evaluation',
    bha: [['Bit 8-1/2" PDC', 8.5, 1.1, 'bit'], ['Mud motor 6-3/4"', 6.75, 30, 'motor'], ['Sub', 6.72, 2, 'sub'], ['Stabilizer 8-1/2"', 6.75, 6, 'stab', 8.5], ['Drill collar 6-3/4"', 6.75, 30, 'dc'], ['MWD 6-3/4"', 6.75, 30, 'mwd'], ['Drill collar 6-3/4"', 6.75, 30, 'dc'], ['Circulating sub', 6.75, 3, 'sub'], ['Port collar', 6.75, 2, 'sub'], ['HWDP 5"', 5, 62, 'hw'], ['Jar 6-1/2"', 6.5, 30, 'jar'], ['HWDP 5"', 5, 62, 'hw']],
  },
];

export const DRILL_PIPE = { name: 'Drill pipe 5", 19.5 ppf', od: 5, tjOd: 6.5 };

export const COMPLETION = {
  tubing: '3-1/2" L-80 EUE', tubingOd: 3.5,
  esp: 'ESP 160 HP', espTop: 8750, espBot: 8840,
  perfs: [[9330, 9360], [9400, 9430], [9470, 9500], [9540, 9570]],
  wellhead: [
    ['Casing head', '21-1/4" x 20"'],
    ['Casing spool', '21-1/4" 2K x 13-5/8" 5K'],
    ['Tubing head spool', '13-5/8" 5K x 11" 5K'],
    ['Tree', 'API 6A, PSL2, PR2'],
    ['Gate valve', '3-1/8" 5K'],
  ],
};

/**
 * ESP string, bottom -> top: [name, OD (in), length (ft), color].
 * Visual breakdown of the plan's 90 ft (8,750–8,840 ft MD) ESP interval.
 */
export const ESP_PARTS = [
  ['Sensor / motor base', 5.4, 20, '#2B3B4C'],
  ['Motor', 5.13, 9, '#4B5561'],
  ['Seal / protector', 5.13, 4, '#6D7A86'],
  ['Intake', 5.4, 28, '#3A5E82'],
  ['Pump', 5.4, 29, '#2E4B6B'],
];

export const BHA_COLORS = {
  bit: '#C9B37A', motor: '#3F5E4C', sub: '#7F8891', stab: '#5B6B7A', dc: '#6B737B',
  mwd: '#C9A13D', jar: '#8A5B3D', hw: '#98A1A9',
};

export const BHA_INFO = {
  bit: 'Cuts the formation. Mud exits the nozzles to cool the bit and lift cuttings.',
  motor: 'Positive-displacement mud motor: converts mud flow into bit rotation; bent housing steers the build section.',
  sub: 'Crossover / float sub connecting BHA components.',
  stab: 'Stabilizer: centralises the BHA and controls directional tendency.',
  dc: 'Drill collar: heavy, stiff pipe providing weight on bit.',
  mwd: 'MWD: measures inclination / azimuth while drilling and pulses data to surface.',
  jar: 'Drilling jar: delivers an impact to free stuck pipe.',
  hw: 'Heavy-weight drill pipe: transition between stiff collars and drill pipe.',
};

/**
 * Casing program. top = hanging depth. Cement stages are listed from the
 * cement FRONT (first pumped, ends highest in the annulus) to the TAIL.
 * The 20" lead/tail split at 1,500 ft is a visual assumption carried over
 * from the original mockup (the plan only states lead 12.5 + tail 15.8 ppg).
 */
export const CASINGS = [
  { key: 'c30', name: '30" conductor', od: 30, top: CELLAR_DEPTH, shoe: 120, color: '#8C8F8C' },
  {
    key: 'c20', name: '20" casing', od: 20, top: CELLAR_DEPTH, shoe: 2000, color: '#9FA9B2', hole: 26, sec: 0, toc: CELLAR_DEPTH,
    stages: [{ name: 'Lead 12.5 ppg', len: 1500 - CELLAR_DEPTH, color: '#DDD6C4' }, { name: 'Tail 15.8 ppg', len: 500, color: '#C4BCA8' }],
  },
  { key: 'c13', name: '13-3/8" casing', od: 13.375, top: CELLAR_DEPTH, shoe: 5000, color: '#B4BEC7', hole: 17.5, sec: 1, toc: CELLAR_DEPTH, stages: [{ name: 'Slurry 15.8 ppg', len: 5000 - CELLAR_DEPTH, color: '#CFC7B3' }] },
  { key: 'c9', name: '9-5/8" casing', od: 9.625, top: CELLAR_DEPTH, shoe: 9259, color: '#A3AFBB', hole: 12.25, sec: 2, toc: CELLAR_DEPTH, stages: [{ name: 'Slurry 15.8 ppg', len: 9259 - CELLAR_DEPTH, color: '#D6CEBB' }] },
  { key: 'c7', name: '7" liner', od: 7, top: 9108, shoe: 9604, color: '#C3CCD4', hole: 8.5, sec: 3, toc: 9108, liner: true, stages: [{ name: 'Slurry 15.8 ppg', len: 9604 - 9108, color: '#CBC3AE' }] },
];
export const CASING_BY_KEY = Object.fromEntries(CASINGS.map((c) => [c.key, c]));

/** Visual shoe-track length (float collar above shoe), ft. Visual assumption. */
export const SHOE_TRACK = 80;

/** Depth-triggered notes (shown as toasts while drilling). */
export const DEPTH_MARKS = [
  [630, 'Entering Fm-B: reactive claystone, polyamine inhibitor'],
  [700, 'Kick-off point 700 ft: start build at 2°/100 ft'],
  [2187, 'End of build 2,187 ft: tangent at 29.74°'],
  [2229, 'Entering Fm-C'],
  [5189, 'Entering Fm-D (limestone)'],
  [5869, 'Entering Fm-E: high pore-pressure zone, MW 14–15 ppg'],
  [8253, 'Entering Fm-F'],
  [9258, 'Top of Fm-G: carbonate reservoir'],
];

export const CALLOUTS = {
  approachG: { title: 'Approaching top of Fm-G', text: 'Control drilling at 10 ft/hr; circulate bottoms-up at every drilling break. Top scenarios: 9,034, 9,258 or 9,356 ft MD.', list: ['Drilling break', 'Milky-white carbonate cuttings', 'Formation losses'] },
  reservoir: { title: 'Reservoir Fm-G', text: 'Drill ~300 ft into the carbonate with 8.7–9.0 ppg RDIF. CaCO3 LCM ready for seepage losses.' },
};

/** Minimum design factors used for the safety-factor bars. */
export const DESIGN_FACTORS = { Burst: 1.1, Collapse: 1.1, Axial: 1.3, Triaxial: 1.25 };
