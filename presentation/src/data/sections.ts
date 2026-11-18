/**
 * Report detail per slide (panel D, layer 2). Every value is copied from the
 * drilling program report; the table / section reference is shown as `source`.
 * The main HUD cards stay PPTX-only.
 */
import type { SceneState, StationId } from './content.ts';
import bopDivImg from '../assets/img/bop-diverter.jpg';
import bop21Img from '../assets/img/bop-21.jpg';
import bop13Img from '../assets/img/bop-13-rev.jpg';

export type Block =
  | { kind: 'table'; title: string; head: string[]; rows: string[][]; note?: string }
  | { kind: 'bullets'; title: string; items: string[] }
  | { kind: 'steps'; title: string; items: string[] }
  | { kind: 'figure'; src: string; caption: string };

export type TopicId = string;

export interface Topic {
  id: TopicId;
  label: string;
  title: string;
  source: string;
  blocks: Block[];
  /** how the 3D view frames this topic */
  view?: { station?: StationId; scene?: Partial<SceneState> };
}

const HSE: Topic = { id: 'hse', label: 'HSE', title: 'Before & after controls', source: 'Drilling program, Chapter 2', blocks: [] };

const LOAD_HEAD = ['Load case', 'Load at shoe', 'Safety factor', 'Minimum design factor'];
const SLURRY_HEAD = ['Fluid', 'Density (ppg)', 'Volume (bbl)', 'Sacks', 'Yield (ft3/sk)', 'Thickening time 70 Bc', 'UCA 24 h (psi)'];
const MUD_HEAD = ['Property', 'Unit', 'Program'];
const HYD_HEAD = ['Mud weight', 'Flow rate', 'Standpipe pressure', 'ECD at TD'];
const TALLY_HEAD = ['Item', 'Quantity', 'Placement and note'];

/* ------------------------------------------------------------------ 26-in */
const S26: Topic[] = [
  HSE,
  {
    id: 'casing', label: 'Casing', title: '20-in surface casing', source: 'Section 4.3, Tables 4.2, 4.3, 4.4, 4.7',
    view: { scene: { built: 's26', focus: 's26' } },
    blocks: [
      { kind: 'table', title: 'Casing design', head: ['Item', 'Value'], rows: [
        ['Size, weight, grade', '20-in, 133 lb/ft, K-55'], ['Connection', 'BTC'], ['Shoe MD / TVD', '2,000 ft / 1,956 ft'],
        ['Hole size', '26-in'], ['Next open-hole TD', '4,564 ft TVD'], ['Mud weight at running', '12.00 ppg'],
      ] },
      { kind: 'table', title: 'Structural check at the shoe', head: LOAD_HEAD, rows: [
        ['Burst', '800.87 psi', '3.82', '1.10'], ['Collapse', '565.72 psi', '2.65', '1.125'], ['Tension', '312.49 klbf', '6.79', '1.60'], ['Triaxial', '-', '4.67', '1.25'],
      ] },
      { kind: 'bullets', title: 'Why this grade', items: ['Minimum passing: 106.5 ppf, J-55', 'Selected: 133 ppf, K-55', 'More wall thickness and capacity for wellhead support, installation loads and uncertainty'] },
      { kind: 'table', title: 'Casing tally', head: TALLY_HEAD, rows: [
        ['20-in casing, 133 ppf, K-55, BTC', '49 joints', 'Shoe at 2,000 ft MD / 1,956 ft TVD'],
        ['Reamer shoe 20-in', '1 ea', 'Bottom of the shoe track'],
        ['Float collar', '1 ea', 'About 47 ft above the shoe'],
        ['Bottom plug and top plug, non-rotating', '2 ea', 'Cementing'],
        ['Heavy-duty centralizer', '2 ea', 'On the shoe track joint'],
        ['Bow-spring centralizer', '2 ea', 'As per the casing tally program'],
        ['Slip-on set-screw stop collar', '4 ea', 'With the centralizers'],
      ] },
    ],
  },
  {
    id: 'cement', label: 'Cement', title: '20-in cement job', source: 'Section 4.5.1, Tables 4.16 to 4.19, 4.22',
    view: { station: 'shoe-s26', scene: { built: 's26', focus: 's26', cementDetail: true } },
    blocks: [
      { kind: 'table', title: 'Design basis', head: ['Item', '20-in casing'], rows: [
        ['Cement top', 'Surface'], ['Excess over open hole', '100% of caliper'], ['Plug system and shoe track', 'Bottom and top plug; 1 joint shoe track'],
        ['BHST / BHCT', '130 / 110 deg F'], ['Thin mud ahead of spacer', '12 ppg, 100 bbl'], ['Spacer', '12.2 ppg, 120 bbl'],
        ['Lead slurry', '12 ppg lightweight (lead 1), then 13.5 ppg neat (lead 2)'], ['Tail slurry', '15.8 ppg, 500 ft above the shoe'],
        ['Design note', 'Gas block system because of reactive shale'],
      ] },
      { kind: 'table', title: 'Slurries and volumes', head: SLURRY_HEAD, rows: [
        ['Lead 1, lightweight', '12.0', '192.07', '414', '2.61', '7:32', '1,711'],
        ['Lead 2, neat', '13.5', '584.98', '1,856', '1.77', '8:05', '890'],
        ['Tail', '15.8', '286.16', '1,351', '1.19', '4:58', '3,100'],
        ['Displacement (mud)', '12.0', '677.33', '-', '-', '-', '-'],
      ] },
      { kind: 'table', title: 'Pumping schedule', head: ['No.', 'Event', 'Volume (bbl)', 'Rate (bpm)', 'Density (ppg)'], rows: [
        ['1', 'Fresh water, line test 2,500 psi / 5 min', '5.0', '5', '-'], ['2', 'Thin mud (rig pump)', '100.0', '6', '12.0'],
        ['3', 'Spacer (rig pump)', '120.0', '6', '12.2'], ['4', 'Drop bottom plug', '-', '-', '-'],
        ['5', 'Lead 1, lightweight slurry (cement unit)', '192.0', '4', '12.0'], ['6', 'Lead 2, neat slurry (cement unit)', '585.0', '5', '13.5'],
        ['7', 'Tail slurry (cement unit)', '286.2', '4', '15.8'], ['8', 'Drop top plug', '-', '-', '-'],
        ['9', 'Fresh water (cement unit)', '10.0', '5', '-'], ['10', 'Displacement with mud (rig pump)', '636.9', '8', '12.0'],
        ['11', 'Displacement, reduced rate', '20.0', '2', '12.0'], ['12', 'Displacement, half shoe track', '8.4', '2', '12.0'],
        ['13', 'Mud compressibility', '2.0', '2', '12.0'],
      ] },
      { kind: 'bullets', title: 'Job notes', items: [
        'Bottom plug planned to rupture at about 1,700 psi',
        'Top plug bumped at 800 psi, 500 psi over the final circulating pressure',
        'Casing tested to 1,000 psi for 5 min; floats checked',
        'Full returns planned; cement returns monitored at the flowline',
        'Waiting on cement planned for about 12.5 hr',
      ] },
    ],
  },
  {
    id: 'mud', label: 'Mud', title: '26-in mud and hydraulics', source: 'Section 4.5.2, Tables 4.23, 4.27, 4.28',
    blocks: [
      { kind: 'table', title: 'Mud properties', head: MUD_HEAD, rows: [
        ['Mud density', 'ppg', '9.8 - 12'], ['Yield point', 'lb/100 ft2', '22 - 35'], ['Plastic viscosity (at 120 F)', 'cP', 'As low as possible (< 20)'],
        ['Gels 10 s / 10 min', 'lb/100 ft2', '6 - 10 / 10 - 20'], ['API fluid loss', 'cc', '<= 8'], ['pH', '', '9.5 - 10.5'],
        ['KCl', '%wt', '5'], ['NaCl', '%wt', '7 - 10'], ['Chloride', 'mg/l', '70,000 - 100,000'],
        ['Shale inhibitor', '%vol', '2 - 3.5'], ['MBT', 'ppb', '< 10'], ['Drill solids', 'ppb', '< 45'],
      ] },
      { kind: 'table', title: 'Hydraulics', head: HYD_HEAD, rows: [['9.8 - 12.0 ppg', '850 - 920 gpm', '2,350 - 2,900 psi', '11.31 - 12.08 ppg']] },
      { kind: 'bullets', title: 'Mud system', items: [
        'Spud mud 9.8 ppg, 5% KCl polymer with 8% salt and 2% shale inhibitor at the start',
        'Inhibitor raised to 2.5% at 500 ft and 2.8% at 1,900 ft',
        'Fluid loss kept below 8 cc; hardness below 300 mg/l with soda ash',
      ] },
      { kind: 'bullets', title: 'Reserve, pills and solids control', items: [
        '1,200 bbl spud mud; 150 bbl kill mud 13.0 ppg',
        '120 bbl LCM pill (80 ppb); 150 bbl hi-vis pill',
        '2 x 30 bbl hi-vis sweep each stand',
        '4 shale shakers with API 80 and 100 screens; mud cleaner with API 230 screens',
      ] },
    ],
  },
  {
    id: 'wellcontrol', label: 'Well control', title: 'Diverter and wellhead Section A', source: 'Chapter 8, Section 5.3',
    view: { station: 'rig-diverter', scene: { focus: 'cellar' } },
    blocks: [
      { kind: 'figure', src: bopDivImg, caption: 'Figure 8.1 · 29-1/2-in × 500 psi diverter' },
      { kind: 'bullets', title: 'Configuration', items: [
        'Surface hole drilled under a 29-1/2-in × 500 psi diverter, nippled up and function-tested before drilling',
        'Shallow gas: gas detection and a blind float valve always run in the BHA',
        'After cementing: N/D diverter, cut 20-in casing, install Wellhead Section A, casing head (20-3/4-in x 20)',
        'N/U 21-1/4-in 2K psi BOP stack; run tester plug; function and pressure test; install wear bushing',
        'Formation integrity test to about 14.2-ppg EMW confirms the shoe before the next interval',
      ] },
    ],
  },
  {
    id: 'hazards', label: 'Hazards', title: 'Offset-well and clay hazards, 26-in', source: 'Section 3.3, Tables 3.2 to 3.4',
    view: { scene: { hazards: true } },
    blocks: [
      { kind: 'table', title: 'Alpha-25 mineralogy in this interval', head: ['Depth (ft MD)', 'Smectite (%)', 'Total clay (%)', 'Interpretation'], rows: [
        ['250 - 280', '55', '63', 'Very high swelling potential; critical interval'],
        ['1,480 - 1,510', '12', '52', 'High clay content; moderate smectite potential'],
        ['1,900 - 1,930', '10', '37', 'Moderate clay reactivity'],
      ] },
      { kind: 'bullets', title: 'Lessons learned', items: [
        'Tight hole recorded in all four offset wells',
        'High smectite in the shallow section: inhibitive fluid and shale stabilization to limit swelling',
        'Gumbo and high cuttings loading managed with hi-vis sweeps, controlled rate, periodic reaming and staged circulation',
      ] },
    ],
  },
  {
    id: 'sequence', label: 'Sequence', title: 'Operational sequence, conductor and 26-in', source: 'Sections 5.2 and 5.3',
    blocks: [
      { kind: 'steps', title: '36-in hole and 30-in conductor', items: [
        'P/U and M/U 36-in drilling BHA', 'Drill 36-in hole to TD (est. 120 ft MD)', 'Circulate hole clean and pump sweeps', 'POOH 36-in BHA to surface',
        'RIH 30-in CP (X-52, 310 ppf), weld every 2 joints of casing', 'R/U cementing line; pressure test cementing line', 'Cementing job 30-in casing',
        'WOC; cut 36-in casing; install and weld bottom flange 29-1/2-in',
      ] },
      { kind: 'steps', title: '26-in hole and 20-in casing', items: [
        'N/U 29-1/2-in x 500 psi diverter; function test diverter', 'P/U and M/U 26-in steerable drilling BHA; shallow test of MWD',
        'Drill 26-in hole to TD (est. 2,000 ft MD / 1,956 ft TVD); KOP at 700 ft MD', 'Circulate hole clean and pump sweeps', 'POOH 26-in BHA to surface',
        'RIH 20-in casing (K-55, 133 ppf, BTC)', 'Circulate the hole clean and condition mud', 'R/U cementing line; pressure test cementing line',
        'Cementing job 20-in casing (low-density lead, 13.5 ppg lead, 15.8 ppg tail)', 'Bump plug; pressure test casing (est. 1,000 psi) and check floats',
        'R/D cementing line and WOC', 'N/D diverter; cut 20-in casing; install Wellhead Section A', 'N/U 21-1/4-in 2K psi BOP stack',
        'Run tester plug; function and pressure test BOP', 'Retrieve tester plug; install wear bushing',
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ 17-1/2-in */
const S17: Topic[] = [
  HSE,
  {
    id: 'casing', label: 'Casing', title: '13-3/8-in intermediate casing', source: 'Section 4.3, Tables 4.2, 4.3, 4.4, 4.8',
    view: { scene: { built: 's17', focus: 's17' } },
    blocks: [
      { kind: 'table', title: 'Casing design', head: ['Item', 'Value'], rows: [
        ['Size, weight, grade', '13-3/8-in, 68 lb/ft, K-55'], ['Connection', 'BTC'], ['Shoe MD / TVD', '5,000 ft / 4,564 ft'],
        ['Hole size', '17-1/2-in'], ['Next open-hole TD', '8,261 ft TVD'], ['Mud weight at running', '13.70 ppg'],
      ] },
      { kind: 'table', title: 'Structural check at the shoe', head: LOAD_HEAD, rows: [
        ['Burst', '1,842.47 psi', '1.87', '1.10'], ['Collapse', '421.57 psi', '4.63', '1.125'], ['Tension', '345.44 klbf', '3.09', '1.60'], ['Triaxial', '-', '2.24', '1.25'],
      ] },
      { kind: 'bullets', title: 'Why this grade', items: ['Minimum passing: 54.5 ppf, J-55', 'Selected: 68 ppf, K-55', 'More burst and axial margin before the deeper, higher mud weight section'] },
      { kind: 'table', title: 'Casing tally', head: TALLY_HEAD, rows: [
        ['13-3/8-in casing, 68 ppf, K-55, BTC', '128 joints', 'Shoe at 5,000 ft MD / 4,564 ft TVD'],
        ['Reamer shoe 13-3/8-in x 17-1/2-in', '1 ea', 'One shoe at the casing shoe, 5,000 ft MD'],
        ['Float collar', '1 ea', 'About 84 ft above the shoe'],
        ['Bottom plug and top plug, non-rotating', '1+1 ea', 'Cementing'],
        ['Heavy-duty welded centralizer', '12 ea', '2 on the shoe track; the others as per the casing tally program'],
        ['Slip-on set-screw stop collar', '24 ea', '2 per centralizer'],
      ] },
    ],
  },
  {
    id: 'cement', label: 'Cement', title: '13-3/8-in cement job', source: 'Section 4.5.1, Tables 4.16 to 4.18, 4.20, 4.22',
    view: { station: 'shoe-s17', scene: { built: 's17', focus: 's17', cementDetail: true } },
    blocks: [
      { kind: 'table', title: 'Design basis', head: ['Item', '13-3/8-in casing'], rows: [
        ['Cement top', 'Surface'], ['Excess over open hole', '60% of open hole'], ['Plug system and shoe track', 'Bottom and top plug; 2 joint shoe track'],
        ['BHST / BHCT', '197 / 155 deg F'], ['Thin mud ahead of spacer', '13.7 ppg, 200 bbl'], ['Spacer', '13.8 ppg, 100 bbl'],
        ['Lead slurry', '14 ppg neat'], ['Tail slurry', '15.8 ppg, 500 ft above the shoe'],
        ['Design note', 'Gas block system; fiber cement (0.5 lb/bbl) with 200 bbl low rheology mud, because the fracture gradient may be lower than expected'],
      ] },
      { kind: 'table', title: 'Slurries and volumes', head: SLURRY_HEAD, rows: [
        ['Lead', '14.0', '828.32', '2,802', '1.66', '9:17', '1,544'],
        ['Tail', '15.8', '117.11', '544', '1.21', '5:54', '2,257'],
        ['Displacement (mud)', '13.7', '751.03', '-', '-', '-', '-'],
      ] },
      { kind: 'table', title: 'Pumping schedule', head: ['No.', 'Event', 'Volume (bbl)', 'Rate (bpm)', 'Time (min)', 'Density (ppg)'], rows: [
        ['1', 'Mud conditioning (rig pump)', '2,175.6', '6.0', '363', '13.70'], ['2', 'Pump thin mud', '200.0', '6.0', '34', '13.70'],
        ['3', 'Pump spacer', '100.0', '6.0', '17', '13.80'], ['4', 'Drop bottom plug (cement unit)', '-', '-', '15', '-'],
        ['5', 'Lead slurry', '240.0', '5.0', '48', '14.00'], ['6', 'Lead slurry with fiber', '100.0', '5.0', '20', '14.00'],
        ['7', 'Lead slurry', '488.3', '5.0', '98', '14.00'], ['8', 'Tail slurry', '117.1', '4.0', '30', '15.80'],
        ['9', 'Drop top plug', '-', '-', '15', '-'], ['10', 'Displacement', '731.0', '5.0', '147', '13.70'],
        ['11', 'Displacement, reduced rate', '20.0', '2.0', '10', '13.70'],
      ] },
      { kind: 'bullets', title: 'Job notes', items: [
        'Full cement returns to the surface are planned',
        'Cement pumped at an ECD of 14.1 ppg against a fracture gradient of 14.2 ppg, so fiber cement (about 0.5 lb/bbl) and 200 bbl of low rheology mud will be used',
      ] },
    ],
  },
  {
    id: 'mud', label: 'Mud', title: '17-1/2-in mud and hydraulics', source: 'Section 4.5.2, Tables 4.24, 4.27, 4.28',
    blocks: [
      { kind: 'table', title: 'Mud properties', head: MUD_HEAD, rows: [
        ['Mud density', 'ppg', '12.0 - 13.7'], ['Yield point', 'lb/100 ft2', '30 - 45'], ['Plastic viscosity (at 120 F)', 'cP', 'As low as possible (< 25)'],
        ['Gels 10 s / 10 min', 'lb/100 ft2', '10 - 12 / 12 - 30'], ['API fluid loss', 'cc', '<= 5 / NC'], ['pH', '', '9.5 - 10.5'],
        ['KCl', '%wt', '5'], ['NaCl', '%wt', '7 - 10'], ['Chloride', 'mg/l', '70,000 - 100,000'],
        ['Shale inhibitor', '%vol', '2 - 3.5'], ['MBT', 'ppb', '< 10'], ['Drill solids', 'ppb', '< 45'],
      ] },
      { kind: 'table', title: 'Hydraulics', head: HYD_HEAD, rows: [['12.0 - 13.7 ppg', '790 - 910 gpm', '2,100 - 3,680 psi', '-']] },
      { kind: 'bullets', title: 'Mud system', items: [
        '350 bbl of new 12.0 ppg mud prepared to start',
        'Shale inhibitor starts at 2.5%, then held at 2.2%; KCl 5%; NaCl 7 - 8%',
        'CaCO3-M 2 ppb as bridging agent; sodium bicarbonate pretreatment before drilling out cement',
      ] },
      { kind: 'bullets', title: 'Reserve, pills and solids control', items: [
        '150 bbl kill mud 15.0 ppg; 150 bbl hi-vis pill',
        '50 bbl hi-vis sweep each stand, then every 3 stands',
        '2 tandem pills of 50 bbl hi-vis and 50 bbl hi-dens at 2,997 ft and 4,014 ft',
        'Screens API 120 on all shakers, with shaker 2 changed to API 140; centrifuge in barite recovery mode',
      ] },
    ],
  },
  {
    id: 'wellcontrol', label: 'Well control', title: '21-1/4-in BOP and wellhead Section B', source: 'Chapter 8, Section 5.4',
    view: { station: 'rig-diverter', scene: { focus: 'cellar' } },
    blocks: [
      { kind: 'figure', src: bop21Img, caption: 'Figure 8.2 · 21-1/4-in × 2,000 psi BOP group' },
      { kind: 'bullets', title: 'Configuration', items: [
        'Intermediate hole drilled under the 21-1/4-in × 2,000 psi BOP group',
        'After cementing: N/D 21-1/4-in BOP stack, cut 13-3/8-in casing, N/U Wellhead Section B',
        'Casing spool 21-1/4-in 2K FLG x 13-5/8-in 5K FLG, with a 21-1/4-in x 13-3/8-in casing sleeve hanger and 3-1/8-in 5K flanged gate valves',
        'N/U 13-5/8-in 5K psi BOP stack; run tester plug; function and pressure test; install wear bushing',
        'Shoe drilled out and tested to about 16.0-ppg EMW before the 12-1/4-in interval',
      ] },
    ],
  },
  {
    id: 'hazards', label: 'Hazards', title: 'Offset-well and clay hazards, 17-1/2-in', source: 'Section 3.3, Tables 3.2 to 3.4',
    view: { scene: { hazards: true } },
    blocks: [
      { kind: 'table', title: 'Alpha-25 mineralogy in this interval', head: ['Depth (ft MD)', 'Smectite (%)', 'Total clay (%)', 'Interpretation'], rows: [
        ['3,190 - 3,220', '10', '41', 'Moderate clay reactivity'],
        ['3,940 - 3,970', '6', '18', 'Low smectite-related swelling potential'],
      ] },
      { kind: 'bullets', title: 'Lessons learned', items: [
        'Tight hole recorded in all four offset wells (Alpha-4, Alpha-4ST, Alpha-23, Alpha-25)',
        'Alpha-23: tight-hole conditions in the upper and intermediate sections',
        'Regular hi-vis sweeps, reaming, backreaming and controlled tripping where tight-hole indications or high cuttings loading are seen',
      ] },
    ],
  },
  {
    id: 'sequence', label: 'Sequence', title: 'Operational sequence, 17-1/2-in', source: 'Section 5.4',
    blocks: [
      { kind: 'steps', title: '17-1/2-in hole and 13-3/8-in casing', items: [
        'P/U and M/U 17-1/2-in steerable drilling BHA', 'DOC; drill 10 ft new formation; FIT (est. 14.2 ppg EMW)',
        'Drill 17-1/2-in hole to TD (est. 5,000 ft MD / 4,564 ft TVD)', 'Circulate hole clean and pump sweeps', 'Backream OOH 17-1/2-in BHA to surface',
        'RIH 13-3/8-in casing (K-55, 68 ppf, BTC)', 'Circulate hole clean and condition mud', 'R/U cementing line; pressure test cementing line',
        'Cementing job 13-3/8-in casing (est. 14.0 ppg lead, 15.8 ppg tail)', 'R/D cementing line and WOC', 'N/D 21-1/4-in BOP stack; cut 13-3/8-in casing and L/D',
        'N/U Wellhead Section B', 'N/U 13-5/8-in 5K psi BOP stack', 'Run tester plug; function and pressure test BOP', 'Retrieve tester plug; install wear bushing',
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ 12-1/4-in */
const S12: Topic[] = [
  HSE,
  {
    id: 'casing', label: 'Casing', title: '9-5/8-in production casing', source: 'Section 4.3, Tables 4.2, 4.3, 4.4, 4.9',
    view: { scene: { built: 's12', focus: 's12' } },
    blocks: [
      { kind: 'table', title: 'Casing design', head: ['Item', 'Value'], rows: [
        ['Size, weight, grade', '9-5/8-in, 47 lb/ft, L-80'], ['Connection', 'BTC'], ['Shoe MD / TVD', '9,259 ft / 8,261 ft'],
        ['Hole size', '12-1/4-in'], ['Next open-hole TD', '8,561 ft TVD'], ['Mud weight at running', '15.70 ppg'],
      ] },
      { kind: 'table', title: 'Structural check at the shoe', head: LOAD_HEAD, rows: [
        ['Burst', '0 psi', '-', '1.10'], ['Collapse', '684.24 psi', '6.96', '1.125'], ['Tension', '395.20 klbf', '2.75', '1.60'], ['Triaxial', '-', '2.24', '1.25'],
      ], note: 'External pressure is higher than internal, so the burst load is 0 psi and burst does not govern. This string governs axial tension.' },
      { kind: 'bullets', title: 'Why this grade', items: ['Minimum passing: 36 ppf, J-55', 'Selected: 47 ppf, L-80', 'Higher collapse, axial and combined stress capacity in the deeper pressure interval'] },
      { kind: 'table', title: 'Casing tally', head: TALLY_HEAD, rows: [
        ['9-5/8-in casing, 47 ppf, L-80, BTC', '238 joints', 'Shoe at 9,259 ft MD / 8,261 ft TVD; 2 pup joints at the wellhead'],
        ['Shoe track', '2 joints', 'Float shoe and float collar function-tested before running'],
        ['Reamer shoe 9-5/8-in', '1 ea', 'Bottom of the shoe track'], ['Float collar', '1 ea', 'Top of the shoe track'],
        ['Top and bottom cementing plug', '1 set', 'Cementing'], ['Heavy-duty welded centralizer', '51 ea', 'As per the casing tally program'],
        ['Slip-on set-screw stop collar', '102 ea', '2 per centralizer'], ['Torque ring', '1 per joint', 'Make-up torque monitored on every connection'],
      ] },
    ],
  },
  {
    id: 'cement', label: 'Cement', title: '9-5/8-in cement job', source: 'Section 5.5; Tables 4.17, 4.18, 4.21, 4.22',
    view: { station: 'shoe-s12', scene: { built: 's12', focus: 's12', cementDetail: true } },
    blocks: [
      { kind: 'table', title: 'Design basis', head: ['Item', '9-5/8-in casing'], rows: [
        ['Cement top', 'Surface'], ['Excess over open hole', '30% open-hole excess'], ['Plug system and shoe track', 'Bottom and top plug; 2 joint shoe track'],
        ['BHST / BHCT', '273 / 215 deg F'], ['Thin mud ahead of spacer', '15.7 ppg, 200 bbl'], ['Spacer', '15.8 ppg, 60 bbl (with a spacer additive, about 13 lb/bbl)'],
        ['Lead slurry', '15.8–16.2 ppg, Class G blended with 35% silica flour (S8)'], ['Tail slurry', '16.0–16.4 ppg, Class G blended with 35% silica flour (S8)'],
        ['Design note', 'Gas block system; fiber cement (0.5 lb/bbl) with 200 bbl low rheology mud, because of the narrow window between mud weight and fracture gradient'],
      ] },
      { kind: 'table', title: 'Slurries and volumes', head: SLURRY_HEAD, rows: [
        ['Lead', '16.0', '254.36', '922', '1.55', '10:50', '2,300'],
        ['Tail', '16.2', '432.39', '1,608', '1.51', '10:35', '2,821'],
        ['Displacement (mud)', '15.7', '704.78', '-', '-', '-', '-'],
      ] },
      { kind: 'table', title: 'Pumping schedule', head: ['No.', 'Event', 'Volume (bbl)', 'Rate (bpm)', 'Time (min)', 'Density (ppg)'], rows: [
        ['1', 'Mud conditioning (rig pump)', '2,060.2', '6.0', '344', '15.70'], ['2', 'Pump thin mud', '200.0', '6.0', '34', '15.70'],
        ['3', 'Pump spacer', '60.0', '6.0', '10', '15.80'], ['4', 'Drop bottom plug (cement unit)', '-', '-', '15', '-'],
        ['5', 'Lead slurry', '254.4', '4.0', '64', '16.00'], ['6', 'Tail slurry', '432.4', '4.0', '109', '16.20'],
        ['7', 'Drop top plug', '-', '-', '15', '-'], ['8', 'Displacement, flush line with fresh water', '10.0', '2.0', '5', '8.34'],
        ['9', 'Displacement', '522.8', '4.0', '131', '15.70'], ['10', 'Displacement, reduced rate', '100.0', '3.0', '34', '15.70'],
        ['11', 'Displacement, reduced rate', '72.0', '2.0', '36', '15.70'],
      ] },
      { kind: 'bullets', title: 'Job notes', items: [
        'Full returns at surface with no downhole losses are planned',
        'ECD expected 17.0 ppg against a fracture gradient of 17.1 ppg: fiber cement (about 0.5 lb/bbl), spacer additive (about 13 lb/bbl) and 200 bbl of low rheology mud',
        'Casing tested to 1,500 psi for 10 min, with a final displacement pressure of about 480 psi',
      ] },
    ],
  },
  {
    id: 'mud', label: 'Mud', title: '12-1/4-in mud and hydraulics', source: 'Section 4.5.2, Tables 4.25, 4.27, 4.28; Section 5.5',
    blocks: [
      { kind: 'table', title: 'Mud properties', head: MUD_HEAD, rows: [
        ['Mud density', 'ppg', '14.0 - 15.7'], ['Yield point', 'lb/100 ft2', '30 - 45'], ['Plastic viscosity (at 120 F)', 'cP', 'As low as possible (< 25)'],
        ['Gels 10 s / 10 min', 'lb/100 ft2', '10 - 16 / 14 - 32'], ['API fluid loss', 'cc', '<= 5 / 10 - 14'], ['pH', '', '9.5 - 10.5'],
        ['KCl', '%wt', '5'], ['NaCl', '%wt', '7 - 10'], ['Chloride', 'mg/l', '70,000 - 100,000'],
        ['Shale inhibitor', '%vol', '3 - 3.5'], ['MBT', 'ppb', '< 10'], ['Drill solids', 'ppb', '< 35'],
      ] },
      { kind: 'table', title: 'Hydraulics', head: HYD_HEAD, rows: [['14.0 - 15.7 ppg', '800 - 1,000 gpm', '2,770 - 4,280 psi', '14.1 - 15.7 ppg']] },
      { kind: 'bullets', title: 'Mud system', items: [
        'Mud weight raised from 13.7 to 14.0 ppg, to 15.2 ppg at 5,500 ft and to 15.5 ppg, reaching 15.7 ppg at TD',
        'Shale inhibitor 2.5% to about 3% if the cuttings become sticky',
        'CaCO3 and a filtration-control additive added hourly for fluid loss and cake quality',
        'Pump rate kept below the 4,500-psi pump-release setting; WOB 5–20 klbs, 50–60 rpm',
      ] },
      { kind: 'bullets', title: 'Reserve, pills and solids control', items: [
        '130 bbl kill mud 16 ppg; hi-vis pill',
        'Tandem sweep of 20 bbl low-viscosity and 40 bbl 17.5 ppg hi-dens',
        'Shakers 1 to 3 with API 120 screens and shaker 4 with API 140; mud cleaner; centrifuge in barite recovery mode',
      ] },
    ],
  },
  {
    id: 'wellcontrol', label: 'Well control', title: '13-5/8-in BOP and wellhead Section C', source: 'Chapter 8, Section 5.5',
    view: { station: 'rig-diverter', scene: { focus: 'cellar' } },
    blocks: [
      { kind: 'figure', src: bop13Img, caption: 'Figure 8.3 · 13-5/8-in × 5,000 psi BOP group' },
      { kind: 'bullets', title: 'Configuration', items: [
        '13-5/8-in 5K psi BOP stack (Annular + VR + BSR + VR/PR) with choke manifold',
        'Minimum kick tolerance of 51.27 bbl at 13.90 ppg at the 9-5/8-in casing point',
        'After cementing: set the 9-5/8-in mandrel hanger, cut casing, N/U Wellhead Section C',
        'Tubing head spool 13-5/8-in 5K FLG x 11-in 5K FLG, with a 13-5/8-in x 9-5/8-in casing sleeve hanger and 3-1/8-in 5K gate valves',
        'Wellhead and BOP pressure-tested before drilling out the shoe track',
      ] },
    ],
  },
  {
    id: 'hazards', label: 'Hazards', title: 'Offset-well hazards, 12-1/4-in', source: 'Section 3.3, Tables 3.3 and 3.4',
    view: { station: 'hazard-deep', scene: { hazards: true } },
    blocks: [
      { kind: 'table', title: 'Drilling hazards from offset wells', head: ['Interval (ft MD)', 'Offset well', 'Observed hazard', 'Implication for Alpha-05'], rows: [
        ['7,400 - 8,400', 'Alpha-4', 'Kick', 'Potential overpressure and influx'],
        ['8,400 - 10,000', 'Alpha-4', 'Kick', 'Pressure-related well control risk'],
        ['8,100 - 9,300', 'Alpha-4ST', 'Kick, partial and total losses', 'Potentially narrow drilling window and formation heterogeneity'],
        ['8,800 - 9,200', 'Alpha-25', 'Total losses', 'High lost-circulation potential'],
      ] },
      { kind: 'table', title: 'Alpha-25 mineralogy in this interval', head: ['Depth (ft MD)', 'Smectite (%)', 'Total clay (%)', 'Interpretation'], rows: [
        ['5,860 - 5,880', '2', '6', 'Very low clay content and swelling potential'],
        ['6,500 - 6,520', '6', '45', 'High clay; relatively low smectite'],
        ['7,400 - 7,420', '3', '30', 'Low smectite-related swelling potential'],
        ['7,600 - 7,620', '4', '30', 'Low smectite-related swelling potential'],
        ['8,840 - 8,860', '0', '34', 'No detected smectite; other clay minerals remain present'],
      ] },
    ],
  },
  {
    id: 'sequence', label: 'Sequence', title: 'Operational sequence, 12-1/4-in', source: 'Section 5.5',
    blocks: [
      { kind: 'steps', title: '12-1/4-in hole and 9-5/8-in casing', items: [
        'P/U and M/U 12-1/4-in drilling BHA', 'DOC; drill 10 ft new formation; FIT (est. 16.0 ppg EMW)', 'Drill 12-1/4-in hole to TD (est. 9,259 ft MD / 8,261 ft TVD)',
        'Circulate hole clean and pump sweeps (including 2% lubricant sweeps as required)', 'Backream OOH 12-1/4-in BHA to surface', 'RIH 9-5/8-in casing (L-80, 47 ppf, BTC, R3)',
        'Circulate hole clean and condition mud', 'R/U cementing line; pressure test cementing line', 'Cementing job 9-5/8-in casing', 'R/D cementing line, R/D CDS and WOC',
        'Unbolt BOP stack, N/D RCD, hook up 13-5/8-in 5K BOP stack', 'Install and set 9-5/8-in mandrel hanger', 'Cut 9-5/8-in casing and L/D', 'N/D adapter flange',
        'Final cut 9-5/8-in casing using cold cutter', 'N/U tubing head 13-5/8-in 5K psi WP x 11-in 5K psi WP and test port', 'N/U adapter flange 11-in 5K psi WP x 13-5/8-in 5K psi WP',
        'N/U 13-5/8-in 5K psi BOP stack (Annular + VR + BSR + VR/PR) and choke manifold', 'Run tester plug; function and pressure test BOP', 'Retrieve tester plug; install wear bushing',
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ 8-1/2-in */
const S8: Topic[] = [
  HSE,
  {
    id: 'mud', label: 'Drill-in fluid', title: '8-1/2-in drill-in fluid and parameters', source: 'Section 4.5.2, Tables 4.26 to 4.28; Section 5.6',
    blocks: [
      { kind: 'table', title: 'Fluid properties', head: MUD_HEAD, rows: [
        ['Mud density', 'ppg', '8.8 - 10.8'], ['Yield point', 'lb/100 ft2', '20 - 30'], ['Plastic viscosity (at 120 F)', 'cP', 'As low as possible (< 25)'],
        ['Gels 10 s / 10 min', 'lb/100 ft2', '5 - 12 / 18 - 20'], ['API fluid loss', 'cc', '<= 10 / 10 - 14'], ['pH', '', '9.5 - 10.5'],
        ['KCl', '%wt', '3-5'], ['NaCl', '%wt', '5-7'], ['Chloride', 'mg/l', '80,000 - 100,000'], ['MBT', 'ppb', '< 10'], ['Drill solids', 'ppb', '< 20'],
      ] },
      { kind: 'table', title: 'Hydraulics', head: HYD_HEAD, rows: [['8.8 - 10.8 ppg', '550 - 700 gpm', '-', '9.10 - 11.28 ppg']] },
      { kind: 'bullets', title: 'Drilling the reservoir', items: [
        'Active system displaced to a non-damaging RDIF (Brine/CaCO3) before drilling out the 9-5/8-in shoe',
        'Mud weight raised to 10.8 ppg and later reduced to 10.5 ppg',
        '5–20 klbs WOB, 60–80 rpm; ECD above the 9.0-ppg minimum collapse threshold and well below the 17.7-ppg fracture limit',
        'BHA: 8-1/2-in directional PDC bit, 6-3/4-in PDM, near-bit stabilizer, MWD/LWD with near-bit inclination, NMDC and HWDP',
      ] },
      { kind: 'bullets', title: 'Losses readiness and solids control', items: [
        '120 bbl LCM pill (100 ppb: 60 ppb CaCO3 medium, 20 ppb fine, 20 ppb coarse); hi-vis pill',
        'Sized acid-soluble calcium carbonate bridging agents kept on location',
        'Screens API 140 and API 100',
      ] },
    ],
  },
  {
    id: 'wellcontrol', label: 'Well control', title: '13-5/8-in BOP, 8-1/2-in section', source: 'Chapter 8, Sections 5.5 and 5.6',
    blocks: [
      { kind: 'figure', src: bop13Img, caption: 'Figure 8.4 · 8-1/2-in hole section BOP configuration (13-5/8-in × 5,000 psi BOP group)' },
      { kind: 'bullets', title: 'Configuration', items: [
        '8-1/2-in hole drilled under the 13-5/8-in × 5,000 psi BOP group',
        '13-5/8-in 5K psi BOP stack (Annular + VR + BSR + VR/PR) with choke manifold',
        'Shoe drilled out and tested (FIT est. 17.7 ppg EMW) before drilling to TD',
        'After completion: 11-in tubing hanger with ESP penetrator provision and the full Christmas tree mounted at the apex',
      ] },
    ],
  },
  {
    id: 'hazards', label: 'Hazards', title: 'Offset wells and the reservoir', source: 'Section 3.3, Tables 3.2 and 3.3',
    view: { scene: { hazards: true } },
    blocks: [
      { kind: 'table', title: 'Offset well drilling history', head: ['Parameter', 'Alpha-4', 'Alpha-4ST', 'Alpha-23', 'Alpha-25'], rows: [
        ['Drilling year', '1995', '2013', '2003', '2012'], ['Inclination', '32.9°', '40.5°', '48.8°', '34.7°'], ['TD (MD)', '9,000 ft', '9,600 ft', '10,000 ft', '9,200 ft'],
        ['Tight hole', 'Yes', 'Yes', 'Yes', 'Yes'], ['Partial losses', '-', 'Yes', '-', 'Yes'], ['Total losses', '-', 'Yes', '-', 'Yes'],
        ['Kick / inflow', '7,400–10,000 ft MD', '8,100–9,300 ft MD', '-', '-'],
        ['Major hazard interval', 'Tuban–TD', 'Tuban–TD', 'Upper / intermediate sections', '8,800–9,200 ft MD'],
      ] },
      { kind: 'table', title: 'Hazards reaching the reservoir', head: ['Interval (ft MD)', 'Offset well', 'Observed hazard', 'Implication for Alpha-05'], rows: [
        ['8,400 - 10,000', 'Alpha-4', 'Kick', 'Pressure-related well control risk'],
        ['9,300 - 10,000', 'Alpha-4ST', 'Total losses', 'Potential fractured or highly permeable formations'],
      ] },
    ],
  },
  {
    id: 'sequence', label: 'Sequence', title: 'Operational sequence, 8-1/2-in', source: 'Section 5.6',
    blocks: [
      { kind: 'steps', title: '8-1/2-in hole to TD', items: [
        'Displace active mud system to 8.8–10.8 ppg RDIF (Brine/CaCO3)', 'P/U and M/U 8-1/2-in directional drilling BHA', 'DOC; drill 10 ft new formation; FIT (est. 17.7 ppg EMW)',
        'Drill 8-1/2-in hole to TD (est. 9,604 ft MD / 8,561 ft TVD)', 'Circulate hole clean and pump sweeps', 'Backream OOH 8-1/2-in BHA to surface',
        'R/U, M/U and RIH wireline logging tool (Quad Combo and VSP); perform logging job; POOH, L/D and R/D; wiper trip as the hole dictates',
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ liner & completion */
const LINER: Topic[] = [
  HSE,
  {
    id: 'liner', label: '7-in liner', title: '7-in production liner', source: 'Section 4.3, Tables 4.2 to 4.4, 4.10; Section 4.5.1',
    view: { station: 'liner', scene: { built: 'all', focus: 'liner' } },
    blocks: [
      { kind: 'table', title: 'Liner design', head: ['Item', 'Value'], rows: [
        ['Size, weight, grade', '7-in, 26 lb/ft, L-80'], ['Connection', 'BTC'], ['Shoe MD / TVD', '9,604 ft / 8,561 ft'], ['Hole size', '8-1/2-in'], ['Mud weight at running', '10.80 ppg'],
      ] },
      { kind: 'table', title: 'Structural check at the shoe', head: LOAD_HEAD, rows: [
        ['Burst', '1,000 psi', '7.24', '1.10'], ['Collapse', '3,808.98 psi', '1.42', '1.125'], ['Tension', '106.51 klbf', '5.67', '1.60'], ['Triaxial', '-', '2.08', '1.25'],
      ], note: 'The 7-in liner governs collapse and triaxial loading. Minimum passing 26 ppf J-55; selected 26 ppf L-80 for better collapse and triaxial resistance.' },
      { kind: 'table', title: 'Liner tally', head: TALLY_HEAD, rows: [
        ['7-in liner, 26 ppf, L-80, BTC', '13 joints', 'Shoe at 9,604 ft MD / 8,561 ft TVD'], ['Reamer shoe 7-in', '1 ea', 'Bottom of the shoe track'],
        ['Float collar', '1 ea', 'Above 1 joint of liner'], ['Landing collar', '1 ea', 'With a crossover on each side'], ['Crossover 7-in', '2 ea', 'Above and below the landing collar'],
        ['Pup joint, 26 ppf, L-80, BTC, 10 ft', '1 ea', 'Between the float collar and the first crossover'], ['Heavy-duty welded centralizer', '12 ea', 'As per the casing tally program'],
        ['Slip-on set-screw stop collar', '24 ea', '2 per centralizer'], ['7-in x 9-5/8-in liner hanger assembly', '1 set', 'Hanger with 9 shear screws; wiper plug with 4 shear screws'],
      ] },
      { kind: 'bullets', title: 'Cement and tests', items: [
        'Liner cemented after the hanger is set and the running tool is released',
        '20 % excess and 10 bbl above the top of liner',
        'Lap test and negative inflow test follow the cement job',
        'Advanced CBL (CBL-CCL-VDL) across the casing and liner overlap before releasing the drilling rig',
      ] },
    ],
  },
  {
    id: 'sequence', label: 'Liner sequence', title: 'Set and cement the 7-in liner', source: 'Section 5.7 A',
    view: { station: 'liner', scene: { built: 'all', focus: 'liner' } },
    blocks: [
      { kind: 'steps', title: '1,500-hp drilling rig', items: [
        'Function-test liner-hanger running tool, ball seat, hydraulic release, packer and backup running tool on surface',
        'RIH 7-in liner (L-80, 26 ppf, BTC, R2) and hydraulic liner hanger assembly to 9,604 ft MD', 'Circulate the hole clean and condition fluid',
        'R/U cementing line and pressure test line', 'Set 7-in liner hanger', 'Cement 7-in liner (20% OH excess + 10 bbl above TOL); if bumped, continue the liner pressure test',
        'Release 7-in liner R/T; set packer dog sub', 'POOH liner R/T to TOL; circulate hole clean; pressure test liner lap and liner packer, then negative inflow test',
        'POOH liner R/T to surface and release the 1,500-hp drilling rig',
      ] },
    ],
  },
  {
    id: 'completion', label: 'Completion', title: 'Cleanout, logging, perforation and ESP', source: 'Section 5.7 B to E',
    view: { station: 'esp', scene: { built: 'all', focus: 'esp', completion: true, equipment: 'tree', rig: 'workover' } },
    blocks: [
      { kind: 'bullets', title: 'Completion basis', items: [
        'Workover BOP: 11-in, 5,000-psi double-ram and annular stack with choke and kill manifolds; 250 psi low and 5,000 psi high for rams, 3,500 psi for annular',
        'Completion brine: clean, filtered 10.5-ppg CaCl2, about 1,100 bbl inventory',
        'Tubing: 191 joints of 3-1/2-in, 9.3-ppf, L-80 premium connections; end of tubing at 6,025 ft MD',
        'ESP: 165 stages, 160-hp motor, intake at 6,013 ft MD; downhole P/T sensors, 3-1/2-in bleeder valve, round power cable, flat MLE, splice connectors, cable clamps',
        '11-in tubing hanger with ESP penetrator; API 6A 5,000-psi Christmas tree; start-up at about 42 Hz',
      ] },
      { kind: 'steps', title: 'B · Wellbore cleanout (450-hp workover rig)', items: [
        'Mobilize and rig up 450-hp workover rig; N/U and pressure test 11-in 5K psi BOP stack', 'P/U and M/U 3-1/2-in work string with 7-in x 9-5/8-in WBCO (scraper and gauge-ring) assembly',
        'Scrape casing and liner across the ESP setting depth (6,013–6,025 ft MD) and perforation intervals', 'Displace wellbore fluid to clean, filtered 10.5-ppg CaCl2 completion brine (~1,100 bbl inventory)', 'POOH WBCO assembly',
      ] },
      { kind: 'steps', title: 'C · CBL-CCL-VDL', items: [
        'R/U wireline and function test', 'M/U tool string; power up and check all sensors', 'Surface check and calibration', 'RIH wireline and advanced CBL tool to proposed depth',
        'Log up from bottom to top across the liner overlap and production casing', 'POOH and disconnect the tool',
      ] },
      { kind: 'steps', title: 'D · 7-in liner perforation (TCP)', items: [
        'P/U and M/U 4-1/2-in TCP gun string on work string', 'RIH TCP assembly; correlate depth with GR/CCL against the CBL-CCL-VDL reference',
        'Set packer, confirm controlled balance and detonate TCP guns across target pay intervals', 'Monitor until the well is static; unseat packer; POOH TCP assembly',
      ] },
      { kind: 'steps', title: 'E · ESP installation and well testing', items: [
        'M/U and RIH ESP assembly with P/T sensors, flat MLE and bleeder valve on 191 joints of 3-1/2-in tubing; check electrical continuity and insulation resistance',
        'Land 11-in tubing hanger (with ESP penetrator); N/U and pressure test API 6A 5,000-psi Christmas tree', 'Hook up the surface VSD control panel; start the ESP at ~42 Hz',
        'Flow to cleanup/flare until clear of perforation debris, then through the surface test separator to measure oil, water and gas before handover',
      ] },
    ],
  },
];


/* ------------------------------------------------------------------ shared contingency (Chapter 6) */
const CONTINGENCY: Topic = {
  id: 'contingency', label: 'Contingency', title: 'Well control, losses and stuck pipe', source: 'Chapter 6',
  blocks: [
    { kind: 'steps', title: 'Shut-in on a kick (6.1)', items: [
      'Raise the Kelly / top drive until the tool joint is above the rotary table',
      'Stop the mud pump, open the choke and choke line manifold, shut in the well and close the choke',
      'When pressure is stable, record hole depth, mud weight, SIDP, SICP, pit gain, drill pipe capacity and pump capacity',
    ] },
    { kind: 'steps', title: 'Well killing (6.1)', items: [
      'Circulate out the contaminated mud at a slow pump rate, normally about 1/3–1/2 of the drilling rate',
      'Adjust the choke to keep SICP constant while circulating',
      'Keep SPP and pump rate constant until the formation fluid is out',
      'Stop the pump, close the choke, record SIDP and SICP; repeat if they are not equal',
      'Calculate kill mud weight and surface-to-bit strokes; circulate KMW at constant casing pressure until it returns to surface',
      'The well is dead when SPP and casing pressure both read zero',
    ] },
    { kind: 'bullets', title: 'Trip sheet (6.1.1)', items: [
      'Trip tank monitored for every stand, POOH and RIH; mud box on wet trips so all trips are monitored as dry',
      'Stop the trip and observe if gain/loss exceeds the maximum limit; report to Company Man and Rig Superintendent if it persists',
    ] },
    { kind: 'steps', title: 'Lost circulation response (6.2)', items: [
      'Stop drilling; follow the approved procedure to stop circulation and position the string',
      'Determine the loss rate and whether losses are dynamic or static',
      'Check the available drilling fluid volume', 'Identify the possible depth of the loss zone',
      'Prepare suitable LCM for the expected loss severity', 'Follow the approved contingency for the loss condition',
    ] },
    { kind: 'bullets', title: 'Stuck pipe and sidetrack (6.3, 6.4)', items: [
      'Pack-off and bridging raise ECD and can induce losses; freeing pipe must respect the well control margin',
      'Sidetrack only when stuck pipe cannot be freed and fishing fails',
      'Sidetrack requires MOC, a dedicated risk assessment, a verified barrier above the abandoned section and recalculated well control parameters',
      'Kick drill before kick-off; well barrier schematic updated once the plug above the fish is verified',
    ] },
  ],
};

/* ------------------------------------------------------------------ slide 2 */
const S2: Topic[] = [
  {
    id: 'basis', label: 'Planning basis', title: 'Well planning basis', source: 'Section 1.2, Table 4.1',
    view: { station: 'full-well' },
    blocks: [
      { kind: 'table', title: 'Planning basis', head: ['Item', 'Planning basis'], rows: [
        ['Well classification', 'Development well, J-type directional'], ['Target', 'Tuban carbonate reservoir'],
        ['Surface location (UTM WGS 84, Zone 49S)', 'Easting 607,617.87 / Northing 9,215,716.00'],
        ['TD location (UTM WGS 84, Zone 49S)', 'Easting 606,784.50 / Northing 9,214,794.75'],
        ['Vertical reference', 'RKB at +30 ft'], ['Planned TD', '9,604 ft MD / 8,561 ft TVD'],
        ['Final inclination / azimuth', '29.74° / 222.55°'], ['KOP / max DLS', '700 ft MD / about 0.85°/100 ft'],
        ['Drilling rig', '1,500-hp land rig; 450-hp workover rig for completion'],
        ['Completion', '3-1/2-in tubing, ESP, brine-filled; initial ESP frequency about 42 Hz; TCP perforation'],
        ['Production forecast', 'Initial 210 BOPD; P50 1.54 MMSTB; ESP planned in year 3'],
      ] },
      { kind: 'table', title: 'Trajectory', head: ['Section', 'Interval', 'Inclination', 'Hole size'], rows: [
        ['Vertical', 'Surface – 700 ft MD (KOP)', '0°', '26-in'],
        ['Build', 'From 700 ft MD', '0° to 29.74° at 222.55°', '17-1/2-in onward'],
        ['Hold', 'About 3000 – 9604 ft MD', 'About 29.74°', '-'],
        ['Reservoir', '9259 – 9604 ft MD', '29.74°', '8-1/2-in'],
      ], note: 'Minimum curvature method; steerable BHA with PDC/mill tooth bit, mud motor, MWD, NMDC, stabilizer, crossover, HWDP and jar.' },
    ],
  },
  {
    id: 'criteria', label: 'Objectives', title: 'Objectives and success criteria', source: 'Sections 1.3, 1.4, Table 12.1',
    blocks: [
      { kind: 'bullets', title: 'Objectives', items: [
        'Drill to planned TD within the design window (PPFG, trajectory, casing seats) with zero harm to people and environment',
        'Isolate and protect formations with the planned casing/liner architecture and verified cement placement',
        'Evaluate the Tuban carbonate and complete with an ESP, using reservoir drill-in fluid in the 8-1/2-in section',
        'Execute with disciplined monitoring (DDR, cost, KPIs) and controlled change (MOC)',
      ] },
      { kind: 'table', title: 'Success criteria', head: ['Criterion', 'Target'], rows: [
        ['HSSE', 'Zero-incident targets'], ['NPT', '< 1.5 % performance threshold (not planned downtime)'],
        ['Duration', 'Drilling 38 d target; project ≤ 130 d'], ['Cost', 'Base case USD 7,549,500; high case USD 10,785,000'],
        ['Well integrity', 'Casing seats and cement verified; BOP/FIT/pressure tests accepted'],
        ['Handover', 'Completion installed, tested and handed over with records'],
      ] },
      { kind: 'table', title: 'How the program meets them', head: ['Criterion', 'How it is addressed', 'Where'], rows: [
        ['HSSE', 'RA and JSA, PTW, emergency response, shallow gas and waste plans set before spud; Stop Work Authority for every crew member', 'Chapter 2; Section 6.1'],
        ['Duration', 'Timeline built section by section against the 38-day drilling target and tracked', 'Sections 4.1 and 10.1'],
        ['Cost', 'Base case tracked with the daily cost record and the AFE curve; forecast changes through MOC', 'Sections 10.3 and 11.2'],
        ['Well integrity', 'Casing seats inside the PPFG window; cement, BOP, FIT and pressure tests verified before each section', 'Sections 3.2, 4.3, 4.5; Chapters 6 and 8'],
        ['Handover', '7-in liner, completion, test and handover follow a defined sequence with records', 'Sections 5.7 and 10.4'],
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ slide 3 */
const S3: Topic[] = [
  HSE,
  {
    id: 'logistics', label: 'Logistics', title: 'Rig move and route', source: 'Sections 9.1, 9.2, Table 9.1',
    view: { station: 'location-staging' },
    blocks: [
      { kind: 'table', title: 'Logistics planning basis', head: ['Item', 'Planning basis'], rows: [
        ['Rig position', '1,500-hp rig, hot stacked at the rig base; mobilization within 14 days is targeted'],
        ['Route', 'About 69 km (68.4 km in the route assessment); 99% paved road'],
        ['Road width', 'Inter-provincial road limited to 6 m (about 19.6 ft)'],
        ['Bridges', 'Level A: 50-ton capacity; Level B: 30–40-ton capacity; escort by local police during mobilization'],
        ['Lifting at wellpad and shorebase', 'Two 50-ton crawler cranes and one forklift for loading, unloading and set-up'],
        ['Crew change', 'Light vehicles; 119 km of road from the airport'],
        ['Critical parts', 'Air freight; collected at the airport in less than 3 hours'],
        ['Demobilization', 'Area cleared within 14 days'],
      ] },
      { kind: 'bullets', title: 'Three steps', items: [
        'Pre-mobilization: plan and schedule, equipment inspection, transport units, permits and documents, manpower',
        'Transport to site: derrick and substructure, drawworks, mud pumps, power, BOP and well control equipment, tools; crew mobilized; progress monitored',
        'Offloading and staging: unload, inspect on arrival, stage by rig-up sequence',
        'Journey Management Plan prepared with the trucking company to check route access',
      ] },
    ],
  },
  {
    id: 'mobilization', label: 'Mobilization', title: 'Mobilization timeline by package', source: 'Table 9.2, Table 7.3',
    view: { station: 'location-staging' },
    blocks: [
      { kind: 'table', title: 'Rig mobilization', head: ['Activity', 'Duration (days)'], rows: [
        ['Rig equipment setup (mud tanks, mud pumps, water tank, utilities, generator set, fuel tank, portacamp, rig site)', '13'],
        ['Install A-frame', '1'], ['Install mast and drilling line', '4'], ['Rig up mast and substructure', '6'], ['Rig up floor', '2'],
        ['Rig up top drive', '2'], ['Function test', '2'], ['Technical meeting', '1'], ['Third-party inspection and closing of findings', '7'], ['Spud in', '1'],
      ] },
      { kind: 'table', title: 'Service packages', head: ['Package', 'Activity', 'Duration (days)'], rows: [
        ['Cementing', 'Mobilization of cementing equipment (13 loads)', '5'], ['Cementing', 'Rig up cementing unit', '4'],
        ['Cementing', 'Delivery of materials to location', '5'], ['Cementing', 'Cutting cement', '5'], ['Cementing', 'Function test of cementing equipment', '2'],
        ['Directional', 'Mobilization (5 loads)', '7'], ['Directional', 'Rig up', '2'], ['Barite', 'Moving equipment and rig up', '3'],
        ['Mud logging unit', 'Mobilization (1 load)', '4'], ['Mud logging unit', 'Rig up', '3'],
        ['Drilling fluid', 'Mud materials (24 loads: 13 regional base, 11 Jakarta)', '7'], ['Drilling fluid', 'Centrifuge unit from Jakarta', '4'],
        ['H2S monitoring', 'Mobilization (1 load)', '1'], ['H2S monitoring', 'Rig up', '4'], ['WWTP', 'Mobilization (2 loads)', '1'], ['WWTP', 'Rig up', '1'],
        ['Paramedic', 'Standby paramedic', '1'], ['Casing running tools (premium)', 'On call', '-'], ['Liner hanger', 'Mobilization (1 load); rig up on job', '1'],
      ], note: 'A package is complete only when its equipment is on location, rigged up and function-tested.' },
    ],
  },
  {
    id: 'materials', label: 'Long lead items', title: 'Long lead items and materials', source: 'Table 9.3, Table 10.3',
    blocks: [
      { kind: 'table', title: 'Long lead items', head: ['No', 'Item', 'Lead time (days)', 'Remark'], rows: [
        ['1', 'Casing 20-in, 133 ppf, K55, R3, BTC', '42', 'Surface casing'], ['2', 'Casing 13-3/8-in, 68 ppf, K55, R3, BTC', '35', 'Intermediate casing'],
        ['3', 'Casing 9-5/8-in, 47 ppf, L80, R3, BTC', '30', 'Production casing'], ['4', 'Tubing 3-1/2-in, 9.3 ppf, L80, R3, EUE', '20', 'Completion tubing'],
        ['5', '20-in reamer shoe, double valve, L-80, BTC', '30', '20-in casing accessory'], ['6', '13-3/8-in reamer shoe, double valve, L-80, BTC', '35', '13-3/8-in casing accessory'],
        ['7', '13-3/8-in x 17-1/2-in OH slider, 3 heavy-duty spiroglider', '35', 'Casing accessory'], ['8', '17-1/2-in PDC bit', '50', 'Longest bit lead time'],
        ['9', '12-1/4-in PDC bit', '38', '12-1/4-in hole section'], ['10', '26-in rock bit', '20', '26-in hole section'],
        ['11', '12-1/4-in PDC bit', '22', '12-1/4-in hole section'], ['12', '12-1/4-in mill tooth bit', '25', '12-1/4-in hole section'],
        ['13', '12-1/4-in insert bit', '27', '12-1/4-in hole section'], ['14', 'Wellhead and X-mas tree', '60', 'Critical item; longest lead time'],
        ['15', 'Repair and recertification of the 13-5/8-in BOP', '28', '4 weeks'], ['16', '9-5/8-in mud motor and 8-in MWD', '28', '4 weeks; main and spare on location'],
      ] },
      { kind: 'table', title: 'Material record (snapshot)', head: ['Material', 'Adopted quantity', 'Use in register'], rows: [
        ['20-in casing', '28 joints listed; 1,185.15 ft in the preparation table', 'Preparation snapshot, not the entire installed string'],
        ['13-3/8-in casing', '128 joints listed; 4,017.68 ft', 'Reconcile inspection and final tally'],
        ['9-5/8-in casing', '74 joints listed; 2,995.20 ft', 'Reconcile other stock/string length'],
        ['Class G cement', 'Program 7,363 sacks; on-location 7,432 sacks; balance 69 sacks', '-'],
      ] },
    ],
  },
  {
    id: 'rig', label: 'Rig', title: 'Rig selection and rig-up', source: 'Chapter 7, Tables 7.1, 7.2, 7.4, 7.5',
    view: { station: 'rig-overview' },
    blocks: [
      { kind: 'table', title: 'Minimum rig requirements', head: ['Item', 'Requirement'], rows: [
        ['Drilling rig class', '1,500-hp onshore rig'], ['Completion rig', '450-hp workover rig'], ['Hook load capacity', 'Minimum greater than 400 ton'],
        ['Drawworks power', '1,450 hp required (95% efficiency, maximum trip speed 56 ft/min)'],
        ['Mast / derrick rating', 'Minimum 1,000,000 lbs, with setback capacity for drill pipe, HWDP, drill collars and BHA'],
        ['Top drive', '35,000 ft-lbs continuous torque, 500 ton hoisting capacity'], ['Power generation', 'Main generators 4,000 to 5,000 hp (electric diesel system)'],
        ['Mud pumps', 'Preferred three 1,600-hp triplex pumps (alternative four 1,300-hp triplex), minimum 5,000 psi working pressure'],
        ['Shale shakers', 'Minimum 3 units, preferred 4 high G-motion units, minimum 300 gpm each (1,200 gpm total, 3 working and 1 standby)'],
        ['Auxiliary solids control', 'Mud cleaner with desander, desilter and vacuum degasser'],
        ['Well control equipment', '13-5/8-in, 5,000-psi BOP stack with annular preventer, pipe rams and blind rams'],
      ] },
      { kind: 'table', title: 'Rig-up sequence', head: ['Step', 'Activity', 'Approx. duration'], rows: [
        ['1', 'Rig equipment setup (mud tanks, mud pumps, water tank, utilities, generators, fuel tank, camp)', '13 days'], ['2', 'Install A-frame', '1 day'],
        ['3', 'Install mast and drilling line', '4 days'], ['4', 'Rig up mast and substructure', '6 days'], ['5', 'Rig up rig floor', '2 days'],
        ['6', 'Rig up top drive', '2 days'], ['7', 'Function test', '2 days'], ['8', 'Technical meeting, then spud', '1 day after function test'],
      ] },
      { kind: 'bullets', title: 'Acceptance checks', items: [
        'Height of rig sub-base above ground; function test of mud pumps no. 1, 2 and 3',
        'Cooling tower area; man-riding equipment; air hose line free of blockage',
        'Additional mud tank, coagulation tank for the waste-water plant, barite silo area and surge tank',
        'Cementing equipment inspected: cementing unit, surge tank 80 cuft, batch mixer 2 x 75 cuft, cement silos 3 x 1,200 cuft and 2 x 1,300 cuft, water and mixing tanks',
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ slide 5 */
const S5: Topic[] = [
  HSE,
  {
    id: 'ptw', label: 'Permit to work', title: 'Permit to work matrix', source: 'Section 2.2.3, Tables 2.4 and 2.5',
    blocks: [
      { kind: 'table', title: 'PTW applicability', head: ['Activity', 'Permit / control', 'Minimum prerequisites', 'PIC'], rows: [
        ['Routine drilling within approved program', 'Daily JSA + TBT + operational controls; PTW only if required', 'Well status, barriers, SIMOPS, drilling limits, crew competency', 'Driller / Company Representative / HSE'],
        ['Rig move and heavy transport', 'Journey Management Plan; critical lifting permit if critical', 'Route and bridge capacity, load restraint, escort, driver fitness, communications', 'Logistics / Lifting Supervisor'],
        ['Rig-up / derrick erection / work at height', 'Work-at-height and critical-lift permit where applicable', 'Fall protection, rescue plan, certified lifting gear, exclusion zone', 'Rig Manager / HSE / Lifting Supervisor'],
        ['Welding, cutting or grinding', 'Hot Work Permit', 'Gas test, fire watch, fire protection, ignition control, SIMOPS check', 'Performing / Area Authority'],
        ['Confined-space entry (tank, pit, cellar or vessel)', 'Confined Space Entry Permit', 'Isolation, gas test, attendant, rescue plan, entry register', 'Area Authority / Gas Tester / Rescue Team'],
        ['Electrical work or equipment maintenance', 'Electrical Work Permit and LOTO', 'Identify energy sources, isolate, lock and tag, test for dead', 'Electrical Authorized Person / Area Authority'],
        ['BOP / pressure testing and pressure-line work', 'Critical Work or Pressure-Test Permit if required', 'Approved procedure, rated equipment, weakest-component limit, exclusion zone, calibrated gauge, test record', 'Drilling Supervisor / Test Supervisor'],
        ['Breaking containment', 'Breaking Containment Permit', 'Isolation, depressurization, zero energy, drain/vent route, gas test', 'Area / Performing Authority'],
        ['Wireline logging with radioactive sources', 'Radioactive Source Permit / Radiation Work Authorization', 'Source inventory, shielding, exclusion zone, licensed personnel', 'Logging Supervisor / Radiation Safety Officer'],
        ['Rig-down and demobilization', 'Work-at-height, critical-lift and electrical-LOTO permits as applicable', 'Isolation, lift plan, SIMOPS, traffic management, safe handback', 'Rig Manager / HSE / Logistics'],
      ] },
      { kind: 'table', title: 'PTW roles', head: ['Role', 'Responsibility'], rows: [
        ['Performing Authority', 'Defines the work and boundaries, links the RA/JSA and procedure, requests the permit, signs the hand back'],
        ['Area Authority', 'Confirms area conditions, accepts the hand back and signs the closure'],
        ['Company Man / Permit Issuer', 'Authorizes the permit and assigns the permit number'],
        ['Gas Tester / Isolation Verifier', 'Records gas test results and verifies isolation and zero energy'],
      ] },
      { kind: 'bullets', title: 'Permit suspended and reassessed when', items: [
        'Scope or conditions change; a gas alarm or abnormal well condition occurs; weather becomes unsafe',
        'A SIMOPS conflict develops; a critical control fails; an emergency alarm is raised',
        'The shift expires, or Stop Work Authority is invoked',
      ] },
    ],
  },
  {
    id: 'shallowgas', label: 'Shallow gas', title: 'Shallow gas contingency', source: 'Section 2.4',
    view: { station: 'rig-diverter', scene: { focus: 'cellar' } },
    blocks: [
      { kind: 'bullets', title: 'Why it matters', items: [
        'Limited well-control options and rapid escalation if a shallow blowout reaches surface',
        'Low fracture gradients, low-density gas and thick gas intervals; extremely high flow rates possible',
        'Dynamic kill is generally unreliable; prevention is the most effective strategy',
        'Personnel evacuation starts immediately under the contingency plan set before spud',
      ] },
      { kind: 'steps', title: 'Contingency meeting checklist', items: [
        'Essential personnel nominated and assigned emergency duties', 'Shallow gas instructions posted around the rig',
        'Toolbox talks before each tour include the shallow gas plan', 'Rig gas detection system checked and fully operational',
        'Ignition sources risk-assessed; deluge system and fire hoses ready', 'Portable gas detector available', 'Hot work restricted',
        'Rig deluge / ESD systems checked', 'Black-out services, evacuation options and life support established', 'Rig communication fully operational',
        'Transport vehicles on standby at a safe distance', 'Wind monitored for diversion and evacuation', 'Sufficient kill mud for the wellbore volume plus 100 % contingency (if practical)',
        'Water supply fully operational', 'Blind float valve always run in the BHA', 'Limit ROP and circulate at high gpm to avoid cuttings build-up',
        'Monitor hole fill closely while tripping', 'Facility to fill the annulus in the event of sudden losses',
      ] },
    ],
  },
  {
    id: 'regulatory', label: 'Regulatory', title: 'Regulatory basis and environment', source: 'Sections 2.2.1, 2.5',
    blocks: [
      { kind: 'table', title: 'Regulatory basis', head: ['No.', 'Regulation', 'Subject'], rows: [
        ['1', 'Law No. 22 of 2001', 'Oil and Gas'], ['2', 'Government Regulation No. 35 of 2004, as amended', 'Upstream Oil and Gas Business Activities'],
        ['3', 'Government Regulation No. 22 of 2021', 'Environmental Protection and Management'], ['4', 'Government Regulation No. 28 of 2025', 'Risk-Based Business Licensing'],
        ['5', 'Minister of Environment and Forestry Regulation No. 4 of 2021', 'Criteria for AMDAL, UKL-UPL and SPPL'],
      ] },
      { kind: 'bullets', title: 'Environmental controls', items: [
        'B3 goods stored in bunded areas; diesel in double-skinned tanks or bunded areas',
        'Cuttings and drilling fluid contained in tanks or lined areas and managed as B3 waste',
        'Spill kits on site; spills handled under the Oil Spill Response Plan',
        'Perimeter drains and sediment traps before earthmoving; topsoil stockpiled for rehabilitation',
        'Groundwater and soil monitoring, including nearby village wells; all waste removed at completion',
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ slide 14 */
const S14: Topic[] = [
  {
    id: 'monitoring', label: 'Monitoring', title: 'Performance tracking', source: 'Section 10.1',
    blocks: [
      { kind: 'table', title: 'Daily measures', head: ['Measure', 'Daily comparison / trigger', 'Owner'], rows: [
        ['Activity and depth', 'Actual cumulative day/MD against the baseline; explain milestone variance', 'Company Man / Drilling'],
        ['Drilling performance', 'On-bottom ROP, trips/connections and planned flat time by section', 'Drilling / contractor'],
        ['NPT and ILT', 'Actual event, cause, duration and action, outside the planned sequence', 'Company Man / leads'],
        ['Material/service readiness', 'Next 7/14-day requirement against usable stock and confirmed arrival', 'Logistics'],
        ['Cost and EAC', 'Daily incurred cost, accrual/commitment reconciliation and forecast against AFE', 'Cost Controller'],
        ['HSE and barriers', 'Incidents/observations, induction/drills, open findings and test status', 'HSE / Company Man'],
      ] },
      { kind: 'bullets', title: 'Performance reviews', items: [
        'Schedule and depth variance: actual depth and milestones against the baseline',
        'Cost variance: actual and forecast against the cost profile and approved AFE',
        'Variance drivers: drilling performance, formation, downtime, extra services, scope changes',
        'Corrective action: owner, action and target date; schedule and forecast updated',
      ] },
    ],
  },
  {
    id: 'reporting', label: 'DDR & communication', title: 'DDR flow and communication', source: 'Section 10.2, Tables 10.1 and 10.2',
    blocks: [
      { kind: 'bullets', title: 'DDR flow', items: [
        'Service representatives and the Toolpusher send activity, survey, fluid, formation, material, HSE and ticket data to the Company Man',
        'Discipline representatives reconcile their own fields; the Company Man issues the DDR to the Drilling Superintendent / PM',
        'Proposed reporting cutoff 06:00 WIB, covering the preceding 24 hours',
        'Emergency escalation is reported at once, not held for the DDR',
      ] },
      { kind: 'table', title: 'Communication path', head: ['Path', 'Purpose'], rows: [
        ['Driller to Toolpusher / Company Man', 'Immediate operating condition, well-control or equipment issue'],
        ['Company Man to Drilling Superintendent', 'Technical decision, barrier/pressure excursion and next-activity coordination'],
        ['Drilling Superintendent / discipline leads to PM', 'Integrated time/cost/risk recommendation and decision authority'],
        ['Site incident controller to operator emergency organization', 'Emergency escalation and external support under ERP'],
        ['PM / designated function to management, partners or regulator', 'Controlled approvals and required notifications'],
      ] },
      { kind: 'table', title: 'Reporting cadence', head: ['Cadence', 'Forum', 'Output'], rows: [
        ['Daily', 'DDR and morning call', 'Previous 24-hour record; next 24 hours and look-ahead'],
        ['Weekly', 'Coordination meeting', 'Review of cost, logistics, HSE, service quality and MOC'],
      ] },
    ],
  },
  {
    id: 'cost', label: 'Cost control', title: 'AFE tracking and invoices', source: 'Section 10.3',
    blocks: [
      { kind: 'bullets', title: 'Cost tracking', items: [
        'Base about USD 7.55 million and high case about USD 10.79 million are budget references, not approved expenditure',
        'Daily cost record links date, activity/WBS, contract/PO, service ticket, quantity, rate, incurred amount and owner',
        'EAC = recognized incurred cost to date plus a non-overlapping forecast to complete',
        'A forecast overrun is escalated through the delegated approval/MOC route; it is not spending approval',
        'A lower spend than planned is not automatically a saving; it may reflect delayed activities',
      ] },
      { kind: 'steps', title: 'Invoice verification', items: [
        'Vendor creates and uploads the e-invoice on the operator vendor site; prints the cover sheet with the WAN number',
        'Hard copy to the routing engineer; engineer and Company Man verify scope, dates and quantities against the DDR',
        'Engineer and Company Man sign; documents go to the invoice receiving counter',
        'Internal team retrieves the e-invoice by WAN number, verifies documents and records the receipt date',
        'Validation (invoice analysis, tax code) and internal approval',
        'Payment term starts: NET 30 days from final internal approval',
        'SAP posting and payment processing',
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ slide 15 */
const S15: Topic[] = [
  {
    id: 'moctriggers', label: 'Triggers & rules', title: 'When MOC is required', source: 'Section 11.1',
    blocks: [
      { kind: 'bullets', title: 'Typical triggers', items: [
        'Casing point, TD or trajectory changes', 'Mud weight / ECD outside the released window', 'Liner, cement or barrier changes', 'Logging / coring scope',
        'Equipment, material or vendor substitutions', 'Sequence changes', 'Material time / cost exposure',
      ] },
      { kind: 'bullets', title: 'Rules for every MOC', items: [
        'Authority: approval level scales with risk and cost impact',
        'Urgent MOC: PM verbal approval when the full written process would itself raise risk; documented within 24 hours',
        'No change before approval: the Company Man does not infer permission from an unsigned request',
        'Close-out: program, AFE and risk register updated before the MOC is closed',
        'Variations inside the released window, sequence and scope are recorded in the DDR without MOC; unclear cases go to the Drilling Superintendent',
      ] },
    ],
  },
  {
    id: 'mocprocess', label: 'Process', title: 'Six-step MOC process', source: 'Tables 11.1 and 11.2',
    blocks: [
      { kind: 'table', title: 'Steps and responsibility', head: ['Step', 'Action', 'Responsible'], rows: [
        ['1. Request', 'Current basis, proposed change, reason, urgency, activity, affected program revision and hold point', 'Initiator and Company Man'],
        ['2. Risk assessment', 'Hazards, barrier implications, exposure, alternatives, temporary controls, contractor interfaces', 'Drilling Superintendent (coordinates)'],
        ['3. Technical review', 'PPFG, trajectory, loads, cement/barriers, data objectives; HSE, Logistics and Cost confirm interfaces', 'Drilling Superintendent with specialists, HSE, Logistics, Cost'],
        ['4. Approval', 'PM routes to the delegated authority for its risk and expenditure', 'Project Manager; delegated operator authority'],
        ['5. Implement and communicate', 'Approved instruction and revised section sheet issued; crews briefed; readiness verified', 'Company Man; Rig Manager or Toolpusher'],
        ['6. Close out', 'Record implementation, reconcile cost/time/material, update data sheet, risk register, DDR, look-ahead', 'Company Man and discipline leads; PM records closure'],
      ] },
      { kind: 'table', title: 'Information recorded', head: ['Step', 'Information recorded'], rows: [
        ['Request', 'Originator and date; activity and hold point; program revision; description; reason and urgency'],
        ['Risk assessment', 'Hazards; barrier implications; personnel and environmental exposure; alternatives; temporary controls'],
        ['Technical review', 'Reviewers; PPFG, trajectory, loads, cement and barriers, data objectives; conclusion'],
        ['Approval', 'Approver and authority level; signature and date; conditions; urgent MOC verbal approval with written record within 24 hours'],
        ['Implementation', 'Revised instruction issued; crews briefed; materials, equipment and permits confirmed'],
        ['Close-out', 'Actual implementation; time, cost and material impact; updated program, AFE, risk register, DDR; approval trail'],
      ] },
    ],
  },
  {
    id: 'decisions', label: 'Key decisions', title: 'Key decisions during execution', source: 'Table 11.4',
    blocks: [
      { kind: 'table', title: 'Trigger, owner and fallback', head: ['Decision', 'Trigger / data', 'Decided by', 'If the trigger is not met'], rows: [
        ['Spud', 'Permits, documents, rig acceptance', 'PM at the pre-spud meeting', 'Delay the spud and close the gaps'],
        ['Casing point', 'Formation tops, pore pressure indicators, losses', 'Drilling Superintendent with Subsurface', 'Set casing early or use a contingency string'],
        ['Well control response', 'Kick, losses, gas readings', 'Company Man on site', 'Kill, cure the losses and escalate'],
        ['TD call', 'Target reached, shows, mud log', 'Subsurface with PM', 'Drill deeper through MOC or stop short'],
        ['Logging and coring', 'Shows and hole condition', 'Subsurface', 'Reduced suite or LWD only'],
        ['Well status', 'Log and test results against the success criteria', 'Management', 'Complete, suspend or abandon'],
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ slide 16 */
const S16: Topic[] = [
  {
    id: 'readiness', label: 'Pre-spud readiness', title: 'Move-in, rig-up and spud authorization', source: 'Section 5.1, Executive summary',
    blocks: [
      { kind: 'steps', title: 'Operational sequence', items: [
        'Confirm location readiness (cellar, access, foundations, mud pits, drainage, cuttings area)', 'Mobilize the 1,500-hp drilling spread and service-company packages',
        'Rig up primary systems (derrick, substructure, drawworks, rotary, power and mud systems)', 'Integrate service equipment (directional drilling, cementing, logging, solids control, bulk system)',
        'Inspect safety-critical equipment (hoisting, lifting, OCTG, pressure vessels, well-control equipment)', 'Prepare drilling fluids (about 9.8-ppg spud mud and 13.0-ppg contingency kill mud)',
        'Conduct readiness tests (function tests, pressure tests, alarms, communications, emergency drills)', 'Authorize spud after the integrated rig, service and material readiness review',
      ] },
      { kind: 'bullets', title: 'Confirmed before spud', items: [
        '30-in conductor, 20-in surface casing, drilling BHA, wellhead components and diverter equipment available',
        'Initial drilling fluid, kill mud and cementing materials available',
        'Readiness demonstrated through function tests, communication checks, H2S and emergency-response drills and a final integrated readiness review',
        'A section may proceed only when its hold points and critical inputs have been closed',
      ] },
    ],
  },
];

/* ------------------------------------------------------------------ slide 17 */
const S17G: Topic[] = [
  {
    id: 'authority', label: 'Decision authority', title: 'Who recommends and who authorizes', source: 'Section 11.3, Table 11.3',
    blocks: [
      { kind: 'table', title: 'Decision authority', head: ['Decision', 'Recommendation / coordination', 'Authorization record'], rows: [
        ['Pre-spud Go/No-Go', 'Company Man and all discipline leads', 'PM / delegated operator authority'],
        ['Casing point or TD change', 'Drilling Superintendent and Subsurface', 'MOC with technical and delegated approval'],
        ['Logging/coring scope', 'Subsurface with Drilling, vendor and Cost', 'Recorded decision; MOC if baseline changes'],
        ['Substitution or sequence deviation', 'Responsible discipline plus HSE/Logistics/Cost', 'MOC and accepted readiness'],
        ['Completion / suspension / sidetrack', 'Integrated PMT recommendation', 'Operator management/delegated authority'],
        ['AFE or spending change', 'Cost / Contracts with PMT impact review', 'Financial authority under actual delegation'],
      ], note: 'Monetary and technical approval limits follow the operator delegation of authority; the program does not set them.' },
      { kind: 'bullets', title: 'Before operational release', items: [
        'Reconcile the survey/datum and KOP', 'Validate the PPFG-based operating window and kick tolerance', 'Approve cement and liner job details',
        'Confirm the logging/coring decision and completion design', 'Close rig, emergency, material, permit and commercial verification items',
        'The DWOP confirms the owner and release gate for each open action',
      ] },
    ],
  },
];

const BY_SLIDE: Record<number, Topic[]> = {
  2: S2, 3: S3, 5: S5, 6: S26, 8: S17, 10: [...S12, CONTINGENCY], 12: [...S8, CONTINGENCY], 13: LINER, 14: S14, 15: S15, 16: S16, 17: S17G,
};

export const topicsFor = (slide: number): Topic[] => BY_SLIDE[slide] ?? [];

/** Hazard intervals drawn beside the well (Tables 3.3 and 3.4). */
export const HAZARD_MARKS: { from: number; to: number; kind: 'clay' | 'kick' | 'loss'; label: string; short: string }[] = [
  { from: 250, to: 280, kind: 'clay', label: 'Smectite 55 % · 250 - 280 ft MD', short: 'Smectite 55 %' },
  { from: 1480, to: 1510, kind: 'clay', label: 'Total clay 52 % · 1,480 - 1,510 ft MD', short: 'Total clay 52 %' },
  { from: 1900, to: 1930, kind: 'clay', label: 'Total clay 37 % · 1,900 - 1,930 ft MD', short: 'Total clay 37 %' },
  { from: 3190, to: 3220, kind: 'clay', label: 'Total clay 41 % · 3,190 - 3,220 ft MD', short: 'Total clay 41 %' },
  { from: 6500, to: 6520, kind: 'clay', label: 'Total clay 45 % · 6,500 - 6,520 ft MD', short: 'Total clay 45 %' },
  { from: 7400, to: 10000, kind: 'kick', label: 'Kicks, Alpha-4 · 7,400 - 10,000 ft MD', short: 'Kicks · Alpha-4' },
  { from: 8100, to: 9300, kind: 'kick', label: 'Kick and losses, Alpha-4ST · 8,100 - 9,300 ft MD', short: 'Kick + losses · Alpha-4ST' },
  { from: 8800, to: 9200, kind: 'loss', label: 'Total losses, Alpha-25 · 8,800 - 9,200 ft MD', short: 'Total losses · Alpha-25' },
  { from: 9300, to: 10000, kind: 'loss', label: 'Total losses, Alpha-4ST · 9,300 - 10,000 ft MD', short: 'Total losses · Alpha-4ST' },
];

/** Tab that opens first on D: the one matching who is speaking (and, on 13, the step). */
export function defaultTopic(slide: number, step: number, role: string): TopicId | null {
  const ids = topicsFor(slide).map((t) => t.id);
  if (!ids.length) return null;
  const want: Record<number, Record<string, string>> = {
    3: { log: 'logistics' }, 5: { hse: 'hse' },
    6: { sub: 'hazards', drl: 'casing', hse: 'hse', log: 'mud' },
    8: { sub: 'hazards', drl: 'casing', hse: 'hse', log: 'mud' },
    10: { sub: 'hazards', drl: 'casing', hse: 'hse', log: 'mud' },
    12: { sub: 'hazards' }, 14: { eco: 'cost', pm: 'reporting' },
  };
  const bySlide13 = ['liner', 'completion', 'completion', 'completion'];
  const id = slide === 13 ? bySlide13[step] : want[slide]?.[role];
  return id && ids.includes(id) ? id : ids[0];
}
