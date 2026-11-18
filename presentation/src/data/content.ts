/**
 * Slide content. Every string here is copied from the PPTX v4
 * (content/slides_text.md). No numbers are added: scripts/check-numbers.mjs
 * compares every number rendered in the HUD with the PPTX text per slide.
 *
 * Personnel names appear only in the cover team list (slide 1), as in the PPTX.
 * Company logos from the PPTX are intentionally not used (no operator/vendor names).
 */
import type { SectionId } from './well.ts';

export type RoleId = 'pm' | 'sub' | 'drl' | 'hse' | 'log' | 'eco';

export const ROLES: Record<RoleId, { name: string; short: string; minutes: number }> = {
  pm: { name: 'Project Manager', short: 'PM', minutes: 5 },
  hse: { name: 'HSE', short: 'HSE', minutes: 3.75 },
  log: { name: 'Logistic', short: 'Logistic', minutes: 3.75 },
  sub: { name: 'Subsurface', short: 'Subsurface', minutes: 3.25 },
  drl: { name: 'Drilling', short: 'Drilling', minutes: 3.25 },
  eco: { name: 'Contract & Economist', short: 'Economist', minutes: 1 },
};
export const ROLE_ORDER: RoleId[] = ['pm', 'sub', 'drl', 'hse', 'log', 'eco'];
export const PRESENTATION_MINUTES = 20;
export const QA_MINUTES = 10;

export type StationId =
  | 'rig-overview' | 'full-well' | 'location-staging' | 'rig-diverter'
  | 'surface-section' | 'intermediate-section' | 'production-section' | 'reservoir-td'
  | 'liner' | 'liner-lap' | 'esp' | 'surface-test' | 'panel' | 'hazard-deep';

export type Equipment = 'none' | 'diverter' | 'bop21' | 'bop13' | 'tree';
export type Focus = SectionId | 'liner' | 'lap' | 'perfs' | 'esp' | 'separator' | 'cellar' | 'site' | 'rig' | null;

export interface SceneState {
  /** deepest section whose casing is run and cemented; 'all' = complete plan.
   *  A section in `focus` is shown being drilled: drill string + BHA on bottom, its casing as planned (ghost). */
  built: SectionId | 'none' | 'all';
  equipment: Equipment;
  rig: 'drilling' | 'workover';
  focus: Focus;
  completion?: boolean;
  /** report detail overlays */
  cementDetail?: boolean;
  hazards?: boolean;
}

export interface Step {
  role: RoleId;
  station: StationId;
  /** block highlighted in the HUD (role block id or completion step number) */
  focusBlock?: string;
  scene?: Partial<SceneState>;
}

interface Base {
  n: number;
  kind: '3d' | 'backup' | '2d';
  kicker: string;
  title: string;
  /** part of the title rendered in orange (as in the PPTX) */
  accent?: string;
  footer: string;
  steps: Step[];
  scene: SceneState;
  /** light panel (Go/No-Go, Q&A) */
  light?: boolean;
  /** HUD card width for 3d slides */
  width?: 'md' | 'lg' | 'xl';
}

export type Row = string[];
export interface Table { title?: string; head: Row; rows: Row[] }
export interface Figure { src: string; caption: string; alt: string }

export type Slide =
  | (Base & { layout: 'cover'; eyebrow: string; title2: string; subtitle: string; team: string[]; date: string })
  | (Base & { layout: 'summary'; mission: string; key: { label: string; value: string }; facts: { label: string; value: string }[]; casingProgram: { label: string; value: string }; criteria: string[]; figure: Figure })
  | (Base & { layout: 'logistics'; banner: string; flow: string[]; checksTitle: string; checks: string[]; key: { value: string; label: string }; table: Table })
  | (Base & { layout: 'image'; figure: Figure })
  | (Base & { layout: 'hse'; key: { value: string; label: string }; matrixTitle: string; bandsTitle: string; bands: { range: string; count: string; level: string; authority: string; tone: 'green' | 'yellow' | 'orange' | 'red' }[]; circles: { l: number; s: number; count: string }[]; ptwTitle: string; ptw: string[]; gate: { label: string; text: string }; matrixNotes: string[] })
  | (Base & { layout: 'section'; specs: { label: string; value: string }[]; key: { value: string; label: string }; blocks: { id: RoleId; num: string; title: string; points: string[] }[]; order: string })
  | (Base & { layout: 'sectionData'; casing: Table; cement: Table; figure: Figure })
  | (Base & { layout: 'reservoir'; key: { value: string; label: string }; lead: string; points: string[]; table: Table; tiles: { label: string; value: string }[]; figure: Figure })
  | (Base & { layout: 'completion'; steps5: { num: string; title: string; sub: string; points: string[] }[]; trajectory: { label: string; text: string }; figure: Figure })
  | (Base & { layout: 'days'; kpis: { value: string; label: string }[]; figure: Figure; cadenceTitle: string; cadence: Table; pathTitle: string; path: string[] })
  | (Base & { layout: 'moc'; flow: { title: string; text: string }[]; requiredTitle: string; required: string[]; urgent: string; table: Table })
  | (Base & { layout: 'gonogo'; go: { tag: string; lead: string; points: string[]; result: string }; nogo: { tag: string; lead: string; points: string[]; result: string }; strip: { strong: string; text: string }[] })
  | (Base & { layout: 'gates'; listTitle: string; gates: string[]; table: Table })
  | (Base & { layout: 'qa'; eyebrow: string; big: string; minutes: string; thanks: string; photo: string });

import rigImg from '../assets/img/rig.jpg';
import rigQaImg from '../assets/img/rig-qa.jpg';
import casingImg from '../assets/img/casing-program.jpg';
import lliImg from '../assets/img/lli-schedule.png';
import bopDivImg from '../assets/img/bop-diverter.jpg';
import bop21Img from '../assets/img/bop-21.jpg';
import bop13Img from '../assets/img/bop-13.jpg';
import ppfgImg from '../assets/img/ppfg.jpg';
import trajImg from '../assets/img/trajectory.jpg';
import dvcImg from '../assets/img/days-depth-cost.jpg';

export const IMAGES = { rigImg, rigQaImg };

const SECTION_ORDER = 'Speaking order · Subsurface · Drilling · HSE · Logistic';
const sectionSteps = (station: StationId): Step[] => [
  { role: 'sub', station, focusBlock: 'sub' },
  { role: 'drl', station, focusBlock: 'drl' },
  { role: 'hse', station, focusBlock: 'hse' },
  { role: 'log', station, focusBlock: 'log' },
];
const PANEL: SceneState = { built: 'all', equipment: 'tree', rig: 'workover', focus: null, completion: true };

export const SLIDES: Slide[] = [
  {
    n: 1, kind: '3d', layout: 'cover', kicker: '', title: 'Drilling Well', title2: 'on Paper',
    eyebrow: 'DRILLING PROGRAM MANAGEMENT · GROUP 5',
    subtitle: 'ALPHA-05 · Phase 3 Drilling Program',
    team: [
      'Muhammad Fakhri Helmi', 'Grandy Danakusumah', 'Febriyan Dwi Chantika', 'Zahra Nurdiwa Widyadhana',
      'Delpa Triwanti', 'Fajar Dewantoro', 'Ghea Moresta', 'Dinar Arubi', 'Josua Gregory Silaen',
      'Putri Dewi', 'Rivanya Ayuningtyas',
    ],
    date: 'NOVEMBER 2026',
    footer: 'Project Manager',
    steps: [{ role: 'pm', station: 'rig-overview' }],
    scene: { built: 'none', equipment: 'none', rig: 'drilling', focus: 'rig' },
  },
  {
    n: 2, kind: '3d', layout: 'summary', kicker: 'OPENING', title: 'WELL SUMMARY & MISSION', accent: '& MISSION',
    mission: 'Drill ALPHA-05 to 9,604 ft MD, log the Tuban carbonate, run and cement the 7-in liner, and complete the well with an ESP.',
    key: { label: 'PLANNED TD', value: '9,604 ft MD / 8,561 ft TVD' },
    facts: [
      { label: 'TARGET', value: 'Tuban carbonate reservoir' },
      { label: 'PROFILE', value: 'J-type, KOP 700 ft MD' },
      { label: 'INCL. / AZIMUTH', value: '29.74° / 222.55°' },
      { label: 'RIGS', value: '1,500-hp drilling · 450-hp workover' },
      { label: 'COMPLETION', value: '3-1/2-in tubing with ESP' },
    ],
    casingProgram: { label: 'Planned casing program', value: '30-in · 20-in · 13-3/8-in · 9-5/8-in · 7-in liner' },
    criteria: [
      'Drill to TD within the design window',
      'Casing seats and cement verified',
      'BOP, FIT and pressure tests accepted',
      'Completion installed and tested',
    ],
    figure: { src: casingImg, caption: 'Planned casing program', alt: 'Planned casing program' },
    footer: 'Speaker · Project Manager',
    steps: [{ role: 'pm', station: 'full-well' }],
    scene: { built: 'all', equipment: 'tree', rig: 'drilling', focus: null, completion: true },
    width: 'lg',
  },
  {
    n: 3, kind: '3d', layout: 'logistics', kicker: 'PRE-SPUD', title: 'LOGISTICS & MATERIALS', accent: '& MATERIALS',
    banner: 'Long lead items are completed before rig mobilization.',
    flow: ['Pre-mobilization', 'Transport to site', 'Offloading & staging'],
    checksTitle: 'Pre-mobilization checks',
    checks: [
      'Mobilization plan and schedule confirmed',
      'Rig equipment inspected',
      'Heavy-haul trucks, trailers, barges ready',
      'Permits and transport documents ready',
      'Manpower and logistics ready',
    ],
    key: { value: '60 days', label: 'Wellhead and X-mas tree · Longest lead time' },
    table: {
      title: 'Long lead items (Table 9.3)',
      head: ['Item', 'Lead time', 'Remark'],
      rows: [
        ['Casing 20-in · 13-3/8-in · 9-5/8-in', '42 · 35 · 30 days', 'Surface to production'],
        ['Tubing 3-1/2-in', '20 days', 'Completion'],
        ['Reamer shoes and OH slider', '30 – 35 days', 'Casing accessories'],
        ['Bits, six types', '20 – 50 days', 'Per hole section'],
        ['Wellhead and X-mas tree', '60 days', 'Longest lead time'],
        ['13-5/8-in BOP recertification', '4 weeks', 'Before mobilization'],
        ['9-5/8-in mud motor, 8-in MWD', '4 weeks', 'Main and spare'],
      ],
    },
    footer: 'Speaker · Logistic',
    steps: [{ role: 'log', station: 'location-staging' }],
    scene: { built: 'none', equipment: 'none', rig: 'drilling', focus: 'site' },
    width: 'xl',
  },
  {
    n: 4, kind: 'backup', layout: 'image', kicker: 'PRE-SPUD', title: 'LONG LEAD ITEMS SCHEDULE', accent: 'SCHEDULE',
    figure: { src: lliImg, caption: 'Long lead items schedule (Table 9.3)', alt: 'Long lead items schedule' },
    footer: 'Speaker · Logistic',
    steps: [{ role: 'log', station: 'panel' }],
    scene: PANEL,
  },
  {
    n: 5, kind: '3d', layout: 'hse', kicker: 'PRE-SPUD', title: 'HSE & REGULATORY READINESS', accent: '& REGULATORY READINESS',
    key: { value: '18 in total', label: 'Activities in the matrix after controls' },
    matrixTitle: 'Risk matrix · likelihood × severity',
    bandsTitle: 'Residual risk band and approval authority',
    bands: [
      { range: '1 – 4', count: '5 of 18', level: 'Low to Moderate', authority: 'Company Man (Drilling Supervisor)', tone: 'green' },
      { range: '5 – 9', count: '10 of 18', level: 'Moderate', authority: 'Rig Superintendent', tone: 'yellow' },
      { range: '10 – 12', count: '3 of 18', level: 'Moderate to High', authority: 'Drilling Manager', tone: 'orange' },
      { range: '15 – 25', count: '', level: 'High', authority: 'Asset General Manager', tone: 'red' },
    ],
    circles: [{ l: 2, s: 4, count: '10' }, { l: 2, s: 5, count: '3' }, { l: 1, s: 4, count: '5' }],
    ptwTitle: 'Permit to Work',
    ptw: ['Request', 'Hazard ID & JSA', 'Isolation & gas test', 'Authorize', 'Execute & monitor', 'Close-out'],
    gate: { label: 'Pre-spud gate', text: 'Permit, document or rig acceptance gap: delay the spud and close it.' },
    matrixNotes: ['Rows: likelihood (1 to 5)  ·  Columns: severity (1 to 5)', 'Circle = activities in that cell after controls (18 in total)'],
    footer: 'Speaker · HSE',
    steps: [{ role: 'hse', station: 'rig-diverter' }],
    scene: { built: 'none', equipment: 'diverter', rig: 'drilling', focus: 'cellar' },
    width: 'xl',
  },
  {
    n: 6, kind: '3d', layout: 'section', kicker: 'SECTION WALK-THROUGH', title: 'SURFACE HOLE · 26-IN', accent: '· 26-IN',
    specs: [
      { label: 'HOLE', value: '26-in' },
      { label: 'DEPTH', value: '2,000 ft MD / 1,956 ft TVD' },
      { label: 'MUD', value: 'KCl/polymer 9.8 – 12.0 ppg' },
      { label: 'CASING', value: '20-in, 133 ppf, K-55' },
      { label: 'WELL CONTROL', value: '29-1/2-in × 500 psi diverter' },
    ],
    key: { value: '2,000 ft MD / 1,956 ft TVD', label: 'Section depth' },
    blocks: [
      { id: 'sub', num: '1', title: 'Subsurface', points: ['Smectite 55 %, total clay 63 % at 250 – 280 ft MD', 'Gumbo and reactive shale are the hazards', 'Window below shoe: 9 – 15.4 ppg', 'Shoe FIT ~14.2 ppg EMW'] },
      { id: 'drl', num: '2', title: 'Drilling Engineer', points: ['Steerable BHA: mill-tooth bit, motor, MWD', 'Kickoff at 700 ft MD', 'Hi-vis sweeps and controlled rate', 'Circulate clean, confirm static before casing'] },
      { id: 'hse', num: '3', title: 'HSE', points: ['Diverter N/U and function test', 'Shallow gas: detection and blind float valve', '26-in drilling: residual 4, Company Man', '20-in casing and cement: residual 8, Rig Superintendent'] },
      { id: 'log', num: '4', title: 'Logistic', points: ['20-in casing 42 days; 26-in bit 20 days', 'Spud mud 9.8 ppg, 5 % KCl polymer', 'Reserve: 1,200 bbl spud mud', 'Kill mud 150 bbl at 13.0 ppg; LCM pill 120 bbl'] },
    ],
    order: SECTION_ORDER,
    footer: SECTION_ORDER,
    steps: sectionSteps('surface-section'),
    scene: { built: 'none', equipment: 'diverter', rig: 'drilling', focus: 's26' },
    width: 'xl',
  },
  {
    n: 7, kind: 'backup', layout: 'sectionData', kicker: 'SECTION DATA', title: 'SURFACE HOLE DATA', accent: 'DATA',
    casing: {
      head: ['20-in surface casing', 'Value'],
      rows: [
        ['Weight / grade', '133 lb/ft, K-55, BTC'],
        ['Shoe MD / TVD', '2,000 ft / 1,956 ft'],
        ['Mud weight at running', '12.00 ppg'],
        ['Burst / collapse SF', '3.82 / 2.65'],
        ['Tension / triaxial SF', '6.79 / 4.67'],
      ],
    },
    cement: {
      head: ['Cementing (20-in)', 'Design'],
      rows: [
        ['Cement top / excess', 'Surface / 100 % of caliper'],
        ['Plugs and shoe track', 'Bottom and top plug; 1 joint'],
        ['Thin mud / spacer', '12 ppg, 100 bbl / 12.2 ppg, 120 bbl'],
        ['Lead', '12 ppg lightweight, then 13.5 ppg neat'],
        ['Tail', '15.8 ppg, 500 ft above the shoe'],
        ['Note', 'Gas block system (reactive shale)'],
      ],
    },
    figure: { src: bopDivImg, caption: 'Figure 8.1 · 29-1/2-in × 500 psi diverter', alt: 'Diverter arrangement' },
    footer: 'Speaker · Drilling Engineer',
    steps: [{ role: 'drl', station: 'panel' }],
    scene: PANEL,
  },
  {
    n: 8, kind: '3d', layout: 'section', kicker: 'SECTION WALK-THROUGH', title: 'INTERMEDIATE HOLE · 17-1/2-IN', accent: '· 17-1/2-IN',
    specs: [
      { label: 'HOLE', value: '17-1/2-in' },
      { label: 'DEPTH', value: '5,000 ft MD / 4,564 ft TVD' },
      { label: 'MUD', value: 'KCl/polymer 12.0 – 13.7 ppg' },
      { label: 'CASING', value: '13-3/8-in, 68 ppf, K-55' },
      { label: 'WELL CONTROL', value: '21-1/4-in × 2,000 psi BOP' },
    ],
    key: { value: '5,000 ft MD / 4,564 ft TVD', label: 'Section depth' },
    blocks: [
      { id: 'sub', num: '1', title: 'Subsurface', points: ['Tight hole in all four offset wells', 'Window 2,827 – 5,000 ft: 11.5 – 15.4 ppg', 'Casing point from tops, pore pressure and losses', 'Shoe test ~16.0 ppg EMW'] },
      { id: 'drl', num: '2', title: 'Drilling Engineer', points: ['Steerable BHA on the J-type profile', 'Flow 790 – 910 gpm', 'Standpipe 2,100 – 3,680 psi', 'Sweeps and reaming where hole is tight', 'Run 13-3/8-in, cement, Wellhead Section B'] },
      { id: 'hse', num: '3', title: 'HSE', points: ['N/D 21-1/4-in BOP, N/U 13-5/8-in × 5,000 psi', 'Function and pressure test', '17-1/2-in drilling: residual 8, Rig Superintendent', 'BOP test and shoe FIT: residual 4, Company Man'] },
      { id: 'log', num: '4', title: 'Logistic', points: ['13-3/8-in casing 35 days; 17-1/2-in bit 50 days', 'BOP recertification: 4 weeks', 'Kill mud 150 bbl at 15.0 ppg', 'Hi-vis pill 150 bbl; sweeps each stand'] },
    ],
    order: SECTION_ORDER,
    footer: SECTION_ORDER,
    steps: sectionSteps('intermediate-section'),
    scene: { built: 's26', equipment: 'bop21', rig: 'drilling', focus: 's17' },
    width: 'xl',
  },
  {
    n: 9, kind: 'backup', layout: 'sectionData', kicker: 'SECTION DATA', title: 'INTERMEDIATE HOLE DATA', accent: 'DATA',
    casing: {
      head: ['13-3/8-in intermediate casing', 'Value'],
      rows: [
        ['Weight / grade', '68 lb/ft, K-55, BTC'],
        ['Shoe MD / TVD', '5,000 ft / 4,564 ft'],
        ['Mud weight at running', '13.70 ppg'],
        ['Burst / collapse SF', '1.87 / 4.63'],
        ['Tension / triaxial SF', '3.09 / 2.24'],
      ],
    },
    cement: {
      head: ['Cementing (13-3/8-in)', 'Design'],
      rows: [
        ['Cement top / excess', 'Surface / 60 % of open hole'],
        ['Plugs and shoe track', 'Bottom and top plug; 2 joints'],
        ['Thin mud / spacer', '13.7 ppg, 200 bbl / 13.8 ppg, 100 bbl'],
        ['Lead', '14 ppg neat'],
        ['Tail', '15.8 ppg, 500 ft above the shoe'],
        ['Note', 'Gas block system; fiber cement with 200 bbl low rheology mud'],
      ],
    },
    figure: { src: bop21Img, caption: 'Figure 8.2 · 21-1/4-in × 2,000 psi BOP group', alt: '21-1/4-in BOP group' },
    footer: 'Speaker · Drilling Engineer',
    steps: [{ role: 'drl', station: 'panel' }],
    scene: PANEL,
  },
  {
    n: 10, kind: '3d', layout: 'section', kicker: 'SECTION WALK-THROUGH', title: 'PRODUCTION HOLE · 12-1/4-IN', accent: '· 12-1/4-IN',
    specs: [
      { label: 'HOLE', value: '12-1/4-in' },
      { label: 'DEPTH', value: '9,259 ft MD / 8,261 ft TVD' },
      { label: 'MUD', value: 'HPWBM 13.7 to 15.7 ppg' },
      { label: 'CASING', value: '9-5/8-in, 47 ppf, L-80' },
      { label: 'WELL CONTROL', value: '13-5/8-in × 5,000 psi BOP' },
    ],
    key: { value: '9,259 ft MD / 8,261 ft TVD', label: 'Section depth' },
    blocks: [
      { id: 'sub', num: '1', title: 'Subsurface', points: ['Critical interval 6,000 – 8,000 ft TVD', 'Pore pressure 12 – 13.5 ppg, window narrows', 'Safe window 15.1 – 16.6 ppg', 'Kicks 7,400 – 10,000 ft, losses 8,800 – 9,200 ft MD', 'Top of Tuban at 9,259 ft MD'] },
      { id: 'drl', num: '2', title: 'Drilling Engineer', points: ['Tangent-packed steerable BHA holds 29.74° / 222.55°', 'ECD 14.1 – 15.7 ppg', 'Flow 800 – 1,000 gpm', 'WOB 5 – 20 klbs, 50 – 60 rpm', 'Kick tolerance 51.27 bbl at 13.90 ppg'] },
      { id: 'hse', num: '3', title: 'HSE', points: ['Controlling pressure-window section', 'Residual 10, Drilling Manager', '13-5/8-in × 5,000 psi BOP tested before drilling out', 'Kill mud 130 bbl at 16 ppg'] },
      { id: 'log', num: '4', title: 'Logistic', points: ['Mud motor and 8-in MWD: 4 weeks, main and spare', '9-5/8-in casing 30 days; 12-1/4-in bits 22 – 38 days', 'Hi-vis and tandem sweeps ready', 'Barite recovery centrifuge'] },
    ],
    order: SECTION_ORDER,
    footer: SECTION_ORDER,
    steps: sectionSteps('production-section'),
    scene: { built: 's17', equipment: 'bop13', rig: 'drilling', focus: 's12' },
    width: 'xl',
  },
  {
    n: 11, kind: 'backup', layout: 'sectionData', kicker: 'SECTION DATA', title: 'PRODUCTION HOLE DATA', accent: 'DATA',
    casing: {
      head: ['9-5/8-in production casing', 'Value'],
      rows: [
        ['Weight / grade', '47 lb/ft, L-80, BTC'],
        ['Shoe MD / TVD', '9,259 ft / 8,261 ft'],
        ['Mud weight at running', '15.70 ppg'],
        ['Burst / collapse SF', 'Burst load 0 psi (N/A) / 6.96'],
        ['Tension / triaxial SF', '2.75 / 2.24'],
      ],
    },
    cement: {
      head: ['Cementing (9-5/8-in)', 'Design'],
      rows: [
        ['Cement top', 'Surface'],
        ['Plugs and shoe track', 'Bottom and top plug; 2 joints'],
        ['Thin mud / spacer', '15.7 ppg, 200 bbl / 15.8 ppg, 60 bbl'],
        ['Slurry', 'Class G with 35 % silica flour'],
        ['Note', 'Gas block system; fiber cement with 200 bbl low rheology mud'],
      ],
    },
    figure: { src: bop13Img, caption: 'Figure 8.3 · 13-5/8-in × 5,000 psi BOP group', alt: '13-5/8-in BOP group' },
    footer: 'Speaker · Drilling Engineer',
    steps: [{ role: 'drl', station: 'panel' }],
    scene: PANEL,
  },
  {
    n: 12, kind: '3d', layout: 'reservoir', kicker: 'TD & EVALUATION', title: 'RESERVOIR SECTION', accent: 'SECTION',
    key: { value: 'TD 9,604 ft MD / 8,561 ft TVD', label: '8-1/2-in section to TD' },
    lead: '8-1/2-in section to TD',
    points: [
      'Tuban carbonate below the shale caprock, ~8,261 ft TVD',
      'Reservoir drill-in fluid 8.8 – 10.8 ppg',
      'ECD 9.10 – 11.28 ppg, fracture limit 17.7 ppg',
    ],
    table: {
      title: 'Mud weight window (Table 3.1)',
      head: ['Depth (ft)', 'Min MW (ppg)', 'Max MW / ECD (ppg)'],
      rows: [
        ['2,000 – 2,827', '9', '15.4'],
        ['2,827 – 5,000', '11.5', '15.4'],
        ['5,000 – 6,200', '10.7', '16.6'],
        ['6,200 – 9,259', '15.1', '16.6'],
        ['9,259 – 9,604', '9', '17.7'],
      ],
    },
    tiles: [
      { label: 'AT TD', value: 'Wireline: Quad Combo and VSP' },
      { label: 'TD CALL', value: 'Subsurface with PM' },
      { label: 'LOGGING, CORING', value: 'Subsurface' },
    ],
    figure: { src: ppfgImg, caption: 'Pore pressure and mud weight window', alt: 'Pore pressure and mud weight window' },
    footer: 'Speaker · Subsurface',
    steps: [{ role: 'sub', station: 'reservoir-td' }],
    scene: { built: 's12', equipment: 'bop13', rig: 'drilling', focus: 's8' },
    width: 'lg',
  },
  {
    n: 13, kind: '3d', layout: 'completion', kicker: 'TD & EVALUATION', title: '7-IN LINER & COMPLETION', accent: '& COMPLETION',
    steps5: [
      { num: '1', title: '7-in liner', sub: 'Set at 9,604 ft MD', points: ['7-in, 26 ppf, L-80, BTC', 'Hydraulic liner hanger', 'Cement: 20 % excess, 10 bbl above TOL', 'Lap test and negative inflow test'] },
      { num: '2', title: 'Cleanout & logging', sub: '450-hp workover rig', points: ['Cleanout 7-in × 9-5/8-in', 'CBL across liner lap and casing'] },
      { num: '3', title: 'Perforation', sub: 'Controlled balance', points: ['4-1/2-in TCP guns', 'Depth correlated with GR/CCL', 'Well static before retrieval'] },
      { num: '4', title: 'ESP installation', sub: 'Permanent completion', points: ['ESP, 165 stages, 160-hp', '191 joints of 3-1/2-in tubing', 'Intake 6,013 ft, EOT 6,025 ft MD', '5,000 psi Christmas tree'] },
      { num: '5', title: 'Test & handover', sub: 'Start-up ~42 Hz', points: ['Cleanup to flare', 'Surface test separator: oil, water, gas', 'Handover to production'] },
    ],
    trajectory: { label: 'WELL TRAJECTORY', text: 'J-type: vertical to the 700 ft MD kickoff, build to 29.74° on 222.55° azimuth, final 9,604 ft MD / 8,561 ft TVD.' },
    figure: { src: trajImg, caption: 'Well trajectory', alt: 'Well trajectory' },
    footer: 'Speaker · Drilling · Subsurface · PM',
    steps: [
      { role: 'drl', station: 'liner', focusBlock: '1', scene: { focus: 'liner', equipment: 'bop13', rig: 'drilling' } },
      { role: 'sub', station: 'liner-lap', focusBlock: '2,3', scene: { focus: 'perfs', equipment: 'bop13', rig: 'workover' } },
      { role: 'drl', station: 'esp', focusBlock: '4', scene: { focus: 'esp', equipment: 'tree', rig: 'workover', completion: true } },
      { role: 'pm', station: 'surface-test', focusBlock: '5', scene: { focus: 'separator', equipment: 'tree', rig: 'workover', completion: true } },
    ],
    scene: { built: 'all', equipment: 'bop13', rig: 'drilling', focus: 'liner' },
    width: 'lg',
  },
  {
    n: 14, kind: '2d', layout: 'days', kicker: 'PROJECT CONTROLS', title: 'DAYS, DEPTH & COST', accent: '& COST',
    kpis: [
      { value: '38 days', label: 'Drilling target' },
      { value: 'About USD 7.55 M', label: 'Base case; high case about USD 10.79 M' },
      { value: 'Max 130 days', label: 'Project duration' },
    ],
    figure: { src: dvcImg, caption: 'Day vs depth vs cost', alt: 'Day vs depth vs cost' },
    cadenceTitle: 'Reporting cadence',
    cadence: { head: ['Cadence', 'Forum'], rows: [['Daily', 'DDR and morning call'], ['Weekly', 'Coordination meeting']] },
    pathTitle: 'Communication path',
    path: ['Driller', 'Toolpusher / Company Man', 'Drilling Superintendent', 'PM'],
    footer: 'Speaker · Economist (chart, KPIs) · Project Manager (DDR, communication)',
    steps: [
      { role: 'eco', station: 'panel', focusBlock: 'kpi' },
      { role: 'pm', station: 'panel', focusBlock: 'report' },
    ],
    scene: PANEL,
  },
  {
    n: 15, kind: '2d', layout: 'moc', kicker: 'PROJECT CONTROLS', title: 'MANAGEMENT OF CHANGE', accent: 'OF CHANGE',
    flow: [
      { title: 'Request', text: 'Activity, hold point, reason' },
      { title: 'Risk assessment', text: 'Hazards, barriers, controls' },
      { title: 'Technical review', text: 'Drilling, Subsurface, HSE, Logistics, Cost' },
      { title: 'Approval', text: 'Authority level, signature, date' },
      { title: 'Implement', text: 'Instruction issued, crews briefed' },
      { title: 'Close-out', text: 'Impact verified, records updated' },
    ],
    requiredTitle: 'MOC is required when a change affects',
    required: ['The technical baseline or operating envelope', 'Sequence, service or equipment selection', 'Time or cost authority'],
    urgent: 'Urgent MOC: verbal approval by the PM, written record within 24 hours.',
    table: {
      title: 'Key decisions (Table 11.4)',
      head: ['Decision', 'Decided by'],
      rows: [
        ['Spud', 'PM at the pre-spud meeting'],
        ['Casing point', 'Drilling Superintendent with Subsurface'],
        ['Well control response', 'Company Man on site'],
        ['TD call', 'Subsurface with PM'],
        ['Logging and coring', 'Subsurface'],
      ],
    },
    footer: 'Speaker · Project Manager',
    steps: [{ role: 'pm', station: 'panel' }],
    scene: PANEL,
  },
  {
    n: 16, kind: '2d', layout: 'gonogo', kicker: 'CLOSING', title: 'GO / NO-GO', accent: 'NO-GO', light: true,
    go: {
      tag: 'GO', lead: 'Spud is GO only if all of these are true:',
      points: [
        'Rig, services, contracts and materials are ready',
        'Permits, HSE and well-control bridging are closed',
        'Emergency arrangements and reporting templates are in place',
        'Function, pressure and alarm tests are accepted',
        'Communication checks and H2S and emergency drills are done',
      ],
      result: 'The spud is authorized.',
    },
    nogo: {
      tag: 'NO-GO', lead: 'Spud is NO-GO if any of these is open:',
      points: [
        'A permit, document or rig acceptance gap',
        'Any readiness area that is not closed (rig, services, contracts, materials, permits, HSE and well-control bridging, emergency arrangements, reporting templates)',
        'A function, pressure or alarm test that is not accepted',
        'A communication check or H2S and emergency drill not completed',
      ],
      result: 'Delay the spud, close the gap, review again.',
    },
    strip: [
      { strong: 'Company Man and all discipline leads', text: 'recommend.' },
      { strong: 'PM or delegated operator authority', text: 'authorizes.' },
      { strong: '', text: 'A section proceeds only when its hold points and critical inputs are closed.' },
    ],
    footer: 'Speaker · Project Manager',
    steps: [{ role: 'pm', station: 'panel' }],
    scene: PANEL,
  },
  {
    n: 17, kind: '2d', layout: 'gates', kicker: 'CLOSING', title: 'RELEASE GATES & DECISION AUTHORITY', accent: '& DECISION AUTHORITY',
    listTitle: 'Before operational release the PMT must',
    gates: [
      'Reconcile survey, datum and KOP',
      'Validate PPFG window and kick tolerance',
      'Approve cement and liner job details',
      'Confirm logging, coring and completion design',
      'Close rig, emergency, material, permit and commercial items',
    ],
    table: {
      title: 'Who decides (Table 11.3)',
      head: ['Decision', 'Recommends', 'Authorizes'],
      rows: [
        ['Pre-spud Go / No-Go', 'Company Man and discipline leads', 'PM / delegated operator authority'],
        ['Casing point or TD change', 'Drilling Superintendent and Subsurface', 'MOC with technical approval'],
        ['Logging / coring scope', 'Subsurface with Drilling and Cost', 'Recorded decision; MOC if baseline changes'],
        ['Sequence deviation', 'Responsible discipline, HSE, Logistics, Cost', 'MOC and accepted readiness'],
        ['Completion, suspension or sidetrack', 'Integrated PMT', 'Operator management'],
      ],
    },
    footer: 'Speaker · Project Manager',
    steps: [{ role: 'pm', station: 'panel' }],
    scene: PANEL,
  },
  {
    n: 18, kind: '2d', layout: 'qa', kicker: '', title: 'Q&A', light: true,
    eyebrow: 'PANEL', big: 'Q&A', minutes: '10 minutes', thanks: 'Thank you', photo: rigQaImg,
    footer: 'Project Manager',
    steps: [{ role: 'pm', station: 'panel' }],
    scene: PANEL,
  },
];

/** Main sequence (backups are reached with B only). */
export const MAIN_SEQUENCE = SLIDES.filter((s) => s.kind !== 'backup').map((s) => s.n);
export const BACKUPS = SLIDES.filter((s) => s.kind === 'backup').map((s) => s.n);
/** Which backup B opens directly from a main slide. */
export const BACKUP_FOR: Record<number, number> = { 3: 4, 6: 7, 8: 9, 10: 11 };
export const slideByN = (n: number) => SLIDES[n - 1];
