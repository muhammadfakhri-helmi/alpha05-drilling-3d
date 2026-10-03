/**
 * OPERATION STATE MACHINE
 * -----------------------
 * Pure function of timeline time: stateAt(t) -> S.
 *
 * The main timeline keeps the 12 engineering operations; each one is split
 * into internal sub-steps (POOH, prepare casing, pick up, run, land, cement…)
 * that drive the 3D scene, the camera director and the HUD. Nothing in here
 * touches Three.js – every downhole position is expressed as an MD that the
 * trajectory engine turns into geometry.
 */
import { SECTIONS, CASING_BY_KEY, COMPLETION, CASINGS, SHOE_TRACK } from './engineeringData.js';
import { CELLAR_DEPTH, FLOOR_Y, JOINT, HOOK_MIN } from './constants.js';
import { TD } from './trajectory.js';
import { clamp, lerp, easeInOut, smooth, frac, fmt, invLerp } from './utils/math.js';

const CASING_STEPS = [
  ['CONDITION_HOLE', 0.05], ['POOH_BHA', 0.12], ['PREPARE_CASING', 0.07], ['PICK_UP_CASING', 0.06],
  ['RUN_CASING', 0.31], ['LAND_CASING', 0.07], ['CEMENT_CASING', 0.24], ['COMPLETE_CEMENT_JOB', 0.04],
  ['PREPARE_NEXT_SECTION', 0.04],
];
const drillSteps = (trip) => [['TRIP_IN', trip], ['DRILL', 1 - trip]];

export const PHASES = [
  { key: 'rig', short: 'Rig', title: 'Rig ready / preparation', dur: 7, sec: -1, steps: [['RIG_READY', 1]] },
  { key: 'cond', short: '30"', title: 'Install 30" conductor', dur: 6, sec: -1, steps: [['INSTALL_CONDUCTOR', 1]] },
  { key: 'd26', short: '26"', title: 'Drill 26" hole', dur: 20, sec: 0, steps: drillSteps(0.08), drill: { sec: 0, from: 120, to: 2000 } },
  { key: 'c20', short: 'Csg 20"', title: 'Run 20" casing + cement', dur: 26, sec: 0, steps: CASING_STEPS, casing: 'c20' },
  { key: 'd17', short: '17-1/2"', title: 'Drill 17-1/2" hole', dur: 20, sec: 1, steps: drillSteps(0.12), drill: { sec: 1, from: 2000, to: 5000 } },
  { key: 'c13', short: 'Csg 13-3/8"', title: 'Run 13-3/8" casing + cement', dur: 26, sec: 1, steps: CASING_STEPS, casing: 'c13' },
  { key: 'd12', short: '12-1/4"', title: 'Drill 12-1/4" hole', dur: 26, sec: 2, steps: drillSteps(0.14), drill: { sec: 2, from: 5000, to: 9259, slow: [0.8, 8900] } },
  { key: 'c9', short: 'Csg 9-5/8"', title: 'Run 9-5/8" casing + cement', dur: 26, sec: 2, steps: CASING_STEPS, casing: 'c9' },
  { key: 'd8', short: '8-1/2"', title: 'Drill 8-1/2" hole to reservoir', dur: 16, sec: 3, steps: drillSteps(0.24), drill: { sec: 3, from: 9259, to: 9604 } },
  { key: 'log', short: 'Logging', title: 'Wireline logging', dur: 15, sec: 3, steps: [['CONDITION_HOLE', 0.07], ['POOH_BHA', 0.17], ['RIH_WIRELINE', 0.22], ['LOG_UP', 0.4], ['POOH_WIRELINE', 0.14]] },
  { key: 'c7', short: 'Liner 7"', title: 'Run 7" liner + cement', dur: 28, sec: 3, steps: [['PREPARE_LINER', 0.05], ['RUN_LINER', 0.34], ['SET_HANGER', 0.09], ['CEMENT_LINER', 0.27], ['RELEASE_TOOL', 0.08], ['POOH_RUNNING_STRING', 0.17]] },
  { key: 'comp', short: 'Completion', title: 'Completion: perforate, ESP + tubing, X-mas tree', dur: 30, sec: 4, steps: [['RUN_TCP', 0.13], ['PERFORATE', 0.08], ['POOH_TCP', 0.1], ['RUN_ESP', 0.27], ['NIPPLE_DOWN_BOP', 0.08], ['NIPPLE_UP_TREE', 0.08], ['PRODUCTION', 0.26]] },
];

export const PHASE_INDEX = Object.fromEntries(PHASES.map((p, i) => [p.key, i]));
export const TOTAL = PHASES.reduce((a, p) => a + p.dur, 0);
export const PHASE_START = [];
{ let a = 0; for (const p of PHASES) { PHASE_START.push(a); a += p.dur; } }

/** Start time of a sub-step inside a phase (used for deep links / tests). */
export function stepStart(phaseKey, stepKey) {
  const i = PHASE_INDEX[phaseKey];
  let acc = 0;
  for (const [k, w] of PHASES[i].steps) { if (k === stepKey) return PHASE_START[i] + acc * PHASES[i].dur; acc += w; }
  return PHASE_START[i];
}

export const STEP_LABEL = {
  RIG_READY: 'Rig ready', INSTALL_CONDUCTOR: 'Install conductor', TRIP_IN: 'Trip in', DRILL: 'Drill',
  CONDITION_HOLE: 'Condition hole', POOH_BHA: 'POOH BHA', PREPARE_CASING: 'Prepare casing', PICK_UP_CASING: 'Pick up casing',
  RUN_CASING: 'Run casing', LAND_CASING: 'Land casing', CEMENT_CASING: 'Cement casing', COMPLETE_CEMENT_JOB: 'Cement job complete',
  PREPARE_NEXT_SECTION: 'Wellhead / BOP', RIH_WIRELINE: 'RIH wireline', LOG_UP: 'Log up', POOH_WIRELINE: 'POOH wireline',
  PREPARE_LINER: 'Prepare liner', RUN_LINER: 'Run liner', SET_HANGER: 'Set liner hanger', CEMENT_LINER: 'Cement liner',
  RELEASE_TOOL: 'Release running tool', POOH_RUNNING_STRING: 'POOH running string', RUN_TCP: 'Run TCP guns', PERFORATE: 'Perforate',
  POOH_TCP: 'POOH TCP', RUN_ESP: 'Run ESP + tubing', NIPPLE_DOWN_BOP: 'Nipple down BOP', NIPPLE_UP_TREE: 'Nipple up X-mas tree', PRODUCTION: 'Production',
};

/** MD of the rig floor (MD < 0 is above ground on the vertical axis). */
export const FLOOR_MD = -FLOOR_Y;
const SLIPS_MD = -(FLOOR_Y + HOOK_MIN);
const TCP_BOTTOM = 9575;
const TCP_LEN = 9575 - 9325;
const WIRELINE_TOOL_LEN = 70;
const ESP_LEN = COMPLETION.espBot - COMPLETION.espTop;

/** Top-drive height cycle while handling stands/joints (h = stem height above floor). */
const hookCycle = (time, period, len, descending) => {
  const f = frac(time / period);
  return HOOK_MIN + len * (descending ? 1 - f : f);
};

function baseline(i) {
  const past = (k) => i > PHASE_INDEX[k];
  const S = {
    holeMD: past('d8') ? TD : past('d12') ? 9259 : past('d17') ? 5000 : past('d26') ? 2000 : past('rig') ? 120 : 0,
    casings: {},
    cement: null,          // active cement job
    drill: null,           // { sec, bitMD, topMD, rotating, drilling }
    liner: null,           // running / set liner
    wireline: null,        // { toolMD, topMD }
    tcp: null,             // { bottomMD, topMD, fired }
    tubing: null,          // { bottomMD, topMD }
    perf: 0,
    perfFlash: 0,
    flow: null,            // 'mud' | 'cement' | 'oil'
    handling: null,        // surface pipe handling { kind, prog, ck }
    cementHead: null,      // { md } cement head on top of landing joint / running string
    hookH: 70,             // top-drive stem height above the rig floor (ft)
    hookLoad: 'none',      // what the top drive carries: 'string' | 'elevator' | 'none'
    wh: past('c9') ? 3 : past('c13') ? 2 : past('c20') ? 1 : 0,
    bop: i <= PHASE_INDEX.cond ? 'none' : i <= PHASE_INDEX.c20 ? 'div' : i <= PHASE_INDEX.c13 ? 'b21' : 'b13',
    bopLift: 0, treeDrop: 0,
    cam: { mode: 'RIG', md: 0 },
    readMD: 0, readLabel: 'Hole',
    caption: '', hud: null, banner: null, callout: null,
  };
  for (const c of CASINGS) {
    const done = c.key === 'c30' ? i > PHASE_INDEX.cond : past(c.key);
    S.casings[c.key] = done
      ? { state: 'set', shoeMD: c.shoe, topMD: c.top, cemented: true, shoeTrack: S.holeMD <= c.shoe + 1 }
      : { state: 'none' };
  }
  if (i > PHASE_INDEX.c7) S.liner = { state: 'set', shoeMD: CASING_BY_KEY.c7.shoe, topMD: CASING_BY_KEY.c7.top, hangerSet: true, released: true, cemented: true };
  return S;
}

/** Drill string helper: bit at md, string top attached to the top drive. */
function setDrill(S, sec, bitMD, { rotating = false, drilling = false, hookH } = {}) {
  S.drill = { sec, bitMD, rotating, drilling, topMD: -(FLOOR_Y + hookH) };
  S.hookH = hookH; S.hookLoad = 'string';
}

const stepTiming = (ph, p) => {
  let acc = 0;
  for (let j = 0; j < ph.steps.length; j++) {
    const [key, w] = ph.steps[j];
    if (p < acc + w || j === ph.steps.length - 1) {
      return { j, key, sp: clamp((p - acc) / w), dur: w * ph.dur, t0: acc };
    }
    acc += w;
  }
  return null;
};

export function stateAt(t) {
  t = clamp(t, 0, TOTAL - 1e-6);
  let i = 0;
  while (i < PHASES.length - 1 && t >= PHASE_START[i + 1]) i++;
  const ph = PHASES[i];
  const p = clamp((t - PHASE_START[i]) / ph.dur);
  const st = stepTiming(ph, p);
  const S = baseline(i);
  Object.assign(S, { t, i, phase: ph, phaseKey: ph.key, p, step: st.key, stepIndex: st.j, sp: st.sp, stepTime: st.sp * st.dur, stepDur: st.dur, sec: ph.sec });

  if (ph.drill) drillPhase(S, ph.drill);
  else if (ph.casing) casingPhase(S, ph.casing);
  else if (ph.key === 'rig') rigPhase(S);
  else if (ph.key === 'cond') conductorPhase(S);
  else if (ph.key === 'log') loggingPhase(S);
  else if (ph.key === 'c7') linerPhase(S);
  else if (ph.key === 'comp') completionPhase(S);

  // camera framing scales with the hole being worked in (12-1/4" = 1)
  const holeIn = ph.sec >= 0 && ph.sec < 4 ? SECTIONS[ph.sec].holeIn : ph.sec === 4 ? 8.5 : 26;
  S.cam.scale = clamp(holeIn / 12.25, 0.62, 2.1);

  // shoe-track cement remains until the next section drills it out
  for (const c of CASINGS) {
    const cs = S.casings[c.key];
    if (cs.state === 'set') cs.shoeTrack = S.holeMD <= c.shoe + 1 && c.key !== 'c30';
  }
  return S;
}

/* ------------------------------------------------------------------ */
function rigPhase(S) {
  S.holeMD = 0;
  S.casings.c30 = { state: 'none' };
  S.caption = '1500 HP electric rig, pad and cellar ready';
  S.hud = { title: 'RIG READY', rows: [['Rig', '1500 HP, electric, top drive'], ['Well', 'Directional J-type'], ['Planned TD', '9,604 ft MD / 8,561 ft TVD']] };
  S.cam = { mode: 'RIG' };
  S.hookH = 70;
}

function conductorPhase(S) {
  const q = easeInOut(S.sp);
  S.holeMD = 120 * q;
  S.casings.c30 = { state: q < 1 ? 'running' : 'set', shoeMD: lerp(0, 120, q), topMD: CELLAR_DEPTH, cemented: q >= 1 };
  S.caption = 'Install 30" X-52 conductor to 120 ft';
  S.hud = { title: 'INSTALL 30" CONDUCTOR', rows: [['Conductor shoe', `${fmt(S.holeMD)} ft`], ['Planned', '120 ft']], progress: q };
  S.cam = { mode: 'CELLAR' };
  S.readMD = S.holeMD; S.readLabel = 'Conductor';
}

/* ------------------------------------------------------------------ */
function drillPhase(S, d) {
  const sec = SECTIONS[d.sec];
  S.bha = d.sec;
  if (S.step === 'TRIP_IN') {
    const bit = lerp(FLOOR_MD + 4, d.from, easeInOut(S.sp));
    S.holeMD = d.from;
    setDrill(S, d.sec, bit, { hookH: hookCycle(S.stepTime, 0.8, JOINT.stand, true) });
    S.caption = `Trip in ${sec.hole} BHA: ${fmt(Math.max(0, bit))} ft`;
    S.cam = { mode: bit < 60 ? 'FLOOR' : 'FOLLOW_BIT', md: Math.max(bit, 0) };
    S.hud = { title: `TRIP IN ${sec.hole} BHA`, rows: [['Bit', `${fmt(Math.max(0, bit))} ft MD`], ['Hole bottom', `${fmt(d.from)} ft MD`]], progress: S.sp };
    S.readMD = Math.max(0, bit); S.readLabel = 'Bit';
    return;
  }
  const q = S.sp;
  let bit;
  if (d.slow) { const [qs, mds] = d.slow; bit = q < qs ? lerp(d.from, mds, q / qs) : lerp(mds, d.to, (q - qs) / (1 - qs)); }
  else bit = lerp(d.from, d.to, q);
  S.holeMD = bit;
  setDrill(S, d.sec, bit, { rotating: true, drilling: true, hookH: HOOK_MIN + JOINT.stand * (1 - frac((bit - d.from) / JOINT.stand)) });
  S.flow = 'mud';
  S.cam = { mode: 'FOLLOW_BIT', md: bit };
  S.readMD = bit; S.readLabel = 'Bit';
  const drillOut = d.from > 120 && bit - d.from < 25;
  S.caption = drillOut ? `Drill out ${SECTIONS[d.sec - 1]?.csg.name ?? ''} shoe track, 10 ft new hole, LOT` : `Drilling ${sec.hole} at ${fmt(bit)} ft MD`;
  const rows = [['Bit depth', `${fmt(bit)} ft MD`], ['Section TD', `${fmt(d.to)} ft MD`], ['Mud', `${sec.mud.mw[0].toFixed(1)}–${sec.mud.mw[1].toFixed(1)} ppg`], ['Flow rate', `${fmt(sec.hyd.gpm)} gpm`]];
  if (drillOut && sec.wc.lot !== '—') rows.push(['LOT', sec.wc.lot]);
  S.hud = { title: `DRILLING ${sec.hole} HOLE`, rows, progress: invLerp(d.from, d.to, bit), flow: 'mud' };
  if (d.sec === 2 && bit > 8850) S.callout = 'approachG';
  if (d.sec === 3) S.callout = 'reservoir';
}

/* ------------------------------------------------------------------ */
function casingPhase(S, ck) {
  const c = CASING_BY_KEY[ck];
  const sec = SECTIONS[c.sec];
  const name = sec.csg.name;
  const Lj = JOINT.casing;
  const totalJoints = Math.ceil((c.shoe - c.top) / Lj);
  S.holeMD = c.shoe;
  S.bha = c.sec;
  const casingRow = (s) => [
    ['Shoe depth', `${fmt(Math.max(0, s))} ft MD`],
    ['Planned shoe', `${fmt(c.shoe)} ft MD`],
    ['Joints in hole', `${clamp(Math.ceil((s - FLOOR_MD) / Lj), 0, totalJoints + 1)} / ${totalJoints} (visual est., ${Lj} ft)`],
  ];
  const running = (shoeMD, topMD) => { S.casings[ck] = { state: 'running', shoeMD, topMD, cemented: false }; };

  switch (S.step) {
    case 'CONDITION_HOLE':
      setDrill(S, c.sec, c.shoe, { rotating: true, hookH: 40 });
      S.flow = 'mud';
      S.caption = `Circulate bottoms-up and condition mud at ${fmt(c.shoe)} ft (section TD)`;
      S.hud = { title: 'CONDITION HOLE', rows: [['Bit', `${fmt(c.shoe)} ft MD`], ['Mud', `${sec.mud.mw[1].toFixed(1)} ppg`]], flow: 'mud' };
      S.cam = { mode: 'FOLLOW_BIT', md: c.shoe };
      S.readMD = c.shoe; S.readLabel = 'Bit';
      break;
    case 'POOH_BHA': {
      const bit = lerp(c.shoe, FLOOR_MD + 4, easeInOut(S.sp));
      setDrill(S, c.sec, bit, { hookH: hookCycle(S.stepTime, 0.8, JOINT.stand, false) });
      S.caption = `POOH ${sec.hole} BHA: ${fmt(Math.max(0, bit))} ft`;
      S.hud = { title: `POOH ${sec.hole} BHA`, rows: [['Bit', `${fmt(Math.max(0, bit))} ft MD`], ['Next', `Run ${name} casing`]], progress: S.sp };
      S.cam = { mode: S.sp < 0.78 ? 'FOLLOW_BIT' : 'FLOOR', md: Math.max(bit, 0) };
      S.readMD = Math.max(0, bit); S.readLabel = 'Bit';
      break;
    }
    case 'PREPARE_CASING':
      S.handling = { kind: 'casing', ck, prog: 0 };
      S.hookH = HOOK_MIN + Lj; S.hookLoad = 'elevator';
      S.caption = `Prepare ${name} casing: drift, tally and rig up casing elevator`;
      S.hud = { title: `PREPARE ${name} CASING`, rows: [['Spec', sec.csg.spec], ['Planned shoe', `${fmt(c.shoe)} ft MD`], ['Joints (visual est.)', `${totalJoints} × ${Lj} ft`]] };
      S.cam = { mode: 'FLOOR' };
      S.readMD = 0; S.readLabel = 'Shoe';
      break;
    case 'PICK_UP_CASING':
      S.handling = { kind: 'casing', ck, prog: smooth(S.sp) };
      S.hookH = HOOK_MIN + Lj; S.hookLoad = 'elevator';
      S.caption = `Pick up ${name} shoe joint from the catwalk to well centre`;
      S.hud = { title: `PICK UP ${name} CASING`, rows: [['Joint', 'Shoe joint (float shoe)'], ['Planned shoe', `${fmt(c.shoe)} ft MD`]], progress: S.sp };
      S.cam = { mode: 'FLOOR' };
      S.readMD = 0; S.readLabel = 'Shoe';
      break;
    case 'RUN_CASING': {
      const q = S.sp, qa = 0.24, qc = 0.9;
      const sA = SLIPS_MD + 2 * Lj;            // after two explicitly handled joints
      const sC = c.shoe - Lj;                  // start of the last joint
      let shoe, top, hook;
      if (q < qa) {
        // two explicit joint-handling cycles near surface
        const k = Math.min(1, Math.floor(q / (qa / 2)));
        const cyc = clamp((q - k * (qa / 2)) / (qa / 2));
        const len = (k + 1) * Lj;
        if (cyc < 0.55) {
          hook = lerp(HOOK_MIN + Lj, HOOK_MIN, easeInOut(cyc / 0.55));
          top = -(FLOOR_Y + hook); shoe = top + len;
          S.hookLoad = 'elevator';
        } else {
          const pr = (cyc - 0.55) / 0.45;
          top = SLIPS_MD; shoe = top + len;
          hook = lerp(HOOK_MIN, HOOK_MIN + Lj, smooth(pr));
          S.handling = { kind: 'casing', ck, prog: smooth(pr), stab: true };
          S.hookLoad = 'elevator';
        }
        S.cam = { mode: 'FLOOR' };
      } else if (q < qc) {
        const u = (q - qa) / (qc - qa);
        shoe = lerp(sA, sC, easeInOut(u));
        const bDur = (qc - qa) * S.stepDur;
        const n = Math.max(1, Math.round(bDur / 0.9));
        hook = hookCycle((q - qa) * S.stepDur, bDur / n, Lj, true);
        top = -(FLOOR_Y + hook);
        S.hookLoad = 'elevator';
        S.cam = { mode: shoe < 70 ? 'FLOOR' : 'CASING_RUN', md: Math.max(0, shoe) };
      } else {
        const u = (q - qc) / (1 - qc);
        hook = lerp(HOOK_MIN + Lj, HOOK_MIN + 8, easeInOut(u));
        top = -(FLOOR_Y + hook); shoe = sC + (Lj - 8) * easeInOut(u);
        S.hookLoad = 'elevator';
        S.cam = { mode: 'CASING_RUN', md: shoe };
      }
      running(shoe, top);
      S.hookH = hook;
      S.caption = `Running ${name} casing: shoe at ${fmt(Math.max(0, shoe))} ft MD`;
      S.hud = { title: `RUNNING ${name} CASING`, rows: casingRow(shoe), progress: clamp(Math.max(0, shoe) / c.shoe) };
      S.readMD = Math.max(0, shoe); S.readLabel = 'Shoe';
      break;
    }
    case 'LAND_CASING': {
      const u = easeInOut(clamp(S.sp / 0.55));
      const hook = lerp(HOOK_MIN + 8, HOOK_MIN, u);
      const shoe = c.shoe - 8 * (1 - u);
      running(shoe, -(FLOOR_Y + hook));
      S.casings[ck].landed = u >= 1;
      S.hookH = hook; S.hookLoad = 'elevator';
      S.caption = u < 1 ? `Landing ${name} casing on the wellhead` : `${name} casing landed: shoe at ${fmt(c.shoe)} ft MD`;
      S.hud = { title: u < 1 ? `LANDING ${name} CASING` : `${name} CASING LANDED`, rows: casingRow(shoe), progress: shoe / c.shoe };
      if (S.sp > 0.5) S.banner = { id: `land-${ck}`, title: `${name} CASING LANDED`, sub: `Shoe: ${fmt(c.shoe)} ft MD / ${fmt(sec.csg.shoeTVD)} ft TVD` };
      S.cam = { mode: 'CASING_RUN', md: shoe };
      S.readMD = shoe; S.readLabel = 'Shoe';
      break;
    }
    case 'CEMENT_CASING':
    case 'COMPLETE_CEMENT_JOB': {
      const done = S.step === 'COMPLETE_CEMENT_JOB';
      S.casings[ck] = { state: 'set', shoeMD: c.shoe, topMD: SLIPS_MD + 2, cemented: done, landed: true };
      S.cementHead = { md: SLIPS_MD + 2 };
      S.hookH = HOOK_MIN + 6; S.hookLoad = 'none';
      const q = done ? 1 : S.sp;
      S.cement = cementJob(c, q, done);
      S.flow = done ? null : 'cement';
      const stageNames = c.stages.map((s) => s.name).join(' + ');
      S.caption = done ? `Plug bumped: ${name} cement job complete, WOC` : `Cementing ${name}: ${sec.cem.split(',')[0]}`;
      S.hud = {
        title: done ? `${name} CEMENT JOB COMPLETE` : `CEMENTING ${name} CASING`,
        rows: [['Slurry', stageNames], ['Cement front', S.cement.where], ['TOC (plan)', c.toc <= CELLAR_DEPTH ? 'Surface' : `${fmt(c.toc)} ft MD`], ['Excess', sec.cem.match(/(\d+% excess)/)?.[1] ?? '—']],
        progress: q, flow: 'cement',
      };
      if (done) S.banner = { id: `cem-${ck}`, title: 'PLUG BUMPED — CEMENT IN PLACE', sub: `${name} annulus cemented to ${c.toc <= CELLAR_DEPTH ? 'surface' : `${fmt(c.toc)} ft`}` };
      S.cam = { mode: 'CEMENTING', md: S.cement.focusMD };
      S.readMD = S.cement.focusMD; S.readLabel = 'Cement front';
      break;
    }
    case 'PREPARE_NEXT_SECTION': {
      S.casings[ck] = { state: 'set', shoeMD: c.shoe, topMD: c.top, cemented: true, landed: true };
      const after = S.sp > 0.5;
      if (ck === 'c20') { S.wh = 1; S.bop = after ? 'b21' : 'none'; }
      if (ck === 'c13') { S.wh = after ? 2 : 1; S.bop = after ? 'b13' : 'none'; }
      if (ck === 'c9') { S.wh = 3; S.bop = 'b13'; }
      const next = SECTIONS[c.sec + 1];
      const label = ck === 'c20' ? 'Cut 20" casing, install casing head, nipple up BOP 21-1/4"'
        : ck === 'c13' ? 'Nipple down BOP 21-1/4", install casing spool, nipple up BOP 13-5/8"'
          : 'Install tubing head spool, re-test BOP 13-5/8"';
      S.caption = label;
      S.hud = { title: 'WELLHEAD / BOP', rows: [['Operation', label], ['Next section', next ? `${next.hole} hole` : '—'], ['Well control', next ? next.wc.bop : '—']] };
      S.cam = { mode: 'CELLAR' };
      S.readMD = c.shoe; S.readLabel = 'Shoe';
      break;
    }
    default: break;
  }
}

/**
 * Cement displacement along a flow path: inside the pipe (top -> shoe), out of
 * the shoe, then up the annulus to TOC. Lengths, not volumes, are used to
 * place the fluids (a deliberate visual simplification).
 * Returns path coordinates that cement.js turns into geometry.
 */
export function cementJob(c, q, done) {
  const insideTop = CELLAR_DEPTH;
  const Li = c.shoe - insideTop;           // inside path length
  const La = c.shoe - c.toc;               // annulus path length to TOC
  const split = 0.5;                       // timeline share of the inside travel
  const front = done ? Li + La : q < split ? Li * easeInOut(q / split) : Li + La * ((q - split) / (1 - split));
  const tail = front - La;
  let where, focusMD;
  if (front < Li) { where = `${fmt(insideTop + front)} ft MD (inside ${c.liner ? 'string' : 'casing'})`; focusMD = insideTop + front; }
  else if (!done && front < Li + 1) { where = 'Exiting shoe'; focusMD = c.shoe; }
  else { const top = c.shoe - (front - Li); where = done ? `Annulus full to ${c.toc <= CELLAR_DEPTH ? 'surface' : `${fmt(c.toc)} ft`}` : `${fmt(top)} ft MD (annulus, rising)`; focusMD = c.liner ? lerp(c.shoe, c.toc, 0.5) : Math.max(top, 40); }
  if (done) focusMD = c.shoe - SHOE_TRACK;
  return { key: c.key, insideTop, Li, La, front, tail, q, done, where, focusMD };
}

/* ------------------------------------------------------------------ */
function loggingPhase(S) {
  const sec = SECTIONS[3];
  S.holeMD = TD;
  S.bha = 3;
  switch (S.step) {
    case 'CONDITION_HOLE':
      setDrill(S, 3, TD, { rotating: true, hookH: 40 });
      S.flow = 'mud';
      S.caption = 'Circulate hole clean at TD before logging';
      S.hud = { title: 'CONDITION HOLE AT TD', rows: [['Bit', `${fmt(TD)} ft MD`], ['Mud', sec.mud.type]], flow: 'mud' };
      S.cam = { mode: 'FOLLOW_BIT', md: TD }; S.readMD = TD; S.readLabel = 'Bit';
      break;
    case 'POOH_BHA': {
      const bit = lerp(TD, FLOOR_MD + 4, easeInOut(S.sp));
      setDrill(S, 3, bit, { hookH: hookCycle(S.stepTime, 0.8, JOINT.stand, false) });
      S.caption = `POOH 8-1/2" BHA for logging: ${fmt(Math.max(0, bit))} ft`;
      S.hud = { title: 'POOH 8-1/2" BHA', rows: [['Bit', `${fmt(Math.max(0, bit))} ft MD`], ['Next', 'Wireline logging']], progress: S.sp };
      S.cam = { mode: S.sp < 0.8 ? 'FOLLOW_BIT' : 'RIG', md: Math.max(0, bit) }; S.readMD = Math.max(0, bit); S.readLabel = 'Bit';
      break;
    }
    default: {
      let tool;
      if (S.step === 'RIH_WIRELINE') { tool = lerp(FLOOR_MD + 20, 9590, easeInOut(S.sp)); S.caption = 'Run in hole with wireline logging tools'; }
      else if (S.step === 'LOG_UP') { tool = lerp(9590, 9259, S.sp); S.caption = `Logging up: ${fmt(tool)} ft (quad combo, resistivity)`; }
      else { tool = lerp(9259, FLOOR_MD + 20, easeInOut(S.sp)); S.caption = 'POOH wireline tools'; }
      S.wireline = { toolMD: tool, topMD: -(FLOOR_Y + 90) };
      S.hookH = 95;
      S.hud = { title: S.step === 'LOG_UP' ? 'WIRELINE LOGGING' : S.step === 'RIH_WIRELINE' ? 'RIH WIRELINE' : 'POOH WIRELINE', rows: [['Tool depth', `${fmt(Math.max(0, tool))} ft MD`], ['Log interval', '9,259–9,604 ft MD (8-1/2" open hole)'], ['Tools', sec.eval]], progress: S.step === 'LOG_UP' ? S.sp : null };
      S.cam = { mode: tool < 60 ? 'RIG' : 'FOLLOW_BIT', md: Math.max(0, tool) };
      S.readMD = Math.max(0, tool); S.readLabel = 'Tool';
    }
  }
}

/* ------------------------------------------------------------------ */
export const LINER = (() => {
  const c = CASING_BY_KEY.c7;
  return { shoe: c.shoe, tol: c.top, len: c.shoe - c.top };
})();

function linerPhase(S) {
  const c = CASING_BY_KEY.c7;
  const { shoe: SHOE, tol: TOL, len: LEN } = LINER;
  S.holeMD = TD;
  const set = (shoeMD, extra = {}) => {
    S.liner = { state: 'running', shoeMD, topMD: shoeMD - LEN, hangerSet: false, released: false, cemented: false, ...extra };
  };
  const hud = (title, rows, progress = null) => { S.hud = { title, rows, progress }; };
  switch (S.step) {
    case 'PREPARE_LINER':
      S.caption = 'Prepare 7" liner, liner hanger and running tool on the pipe rack';
      hud('PREPARE 7" LINER', [['Liner', `7" ${SECTIONS[3].csg.spec}`], ['Top of liner', `${fmt(TOL)} ft MD`], ['Liner shoe', `${fmt(SHOE)} ft MD`]]);
      S.handling = { kind: 'liner', prog: 0 };
      S.hookH = HOOK_MIN + JOINT.casing; S.hookLoad = 'elevator';
      S.cam = { mode: 'FLOOR' }; S.readMD = 0; S.readLabel = 'Liner shoe';
      break;
    case 'RUN_LINER': {
      const q = S.sp, qm = 0.14;
      let shoeMD, hook;
      if (q < qm) {
        // make up the 496 ft liner itself, hanging from the elevator
        const u = q / qm;
        shoeMD = lerp(SLIPS_MD + JOINT.casing, SLIPS_MD + LEN, easeInOut(u));
        hook = hookCycle(q * S.stepDur, (qm * S.stepDur) / 3, JOINT.casing, true);
        set(shoeMD, { topMD: Math.max(shoeMD - LEN, -(FLOOR_Y + hook)) });
        S.cam = { mode: 'FLOOR' };
        S.caption = 'Make up 7" liner joints';
      } else {
        const u = (q - qm) / (1 - qm);
        shoeMD = lerp(SLIPS_MD + LEN, SHOE - 20, easeInOut(u));
        hook = hookCycle((q - qm) * S.stepDur, 0.8, JOINT.stand, true);
        set(shoeMD, { runString: { bottomMD: shoeMD - LEN, topMD: -(FLOOR_Y + hook) } });
        S.cam = { mode: shoeMD - LEN < 60 ? 'FLOOR' : 'CASING_RUN', md: Math.max(0, shoeMD - LEN * 0.4) };
        S.caption = `Run 7" liner on drill pipe: liner shoe ${fmt(shoeMD)} ft, hanger ${fmt(shoeMD - LEN)} ft`;
      }
      S.hookH = hook; S.hookLoad = 'elevator';
      hud('RUNNING 7" LINER', [['Liner shoe', `${fmt(Math.max(0, shoeMD))} ft MD`], ['Hanger / TOL', `${fmt(Math.max(0, shoeMD - LEN))} ft MD`], ['Planned', `TOL ${fmt(TOL)} / shoe ${fmt(SHOE)} ft MD`]], clamp(shoeMD / SHOE));
      S.readMD = Math.max(0, shoeMD); S.readLabel = 'Liner shoe';
      break;
    }
    case 'SET_HANGER': {
      const u = easeInOut(clamp(S.sp / 0.5));
      const shoeMD = SHOE - 20 * (1 - u);
      const hangerSet = S.sp > 0.6;
      set(shoeMD, { hangerSet, setProg: clamp((S.sp - 0.5) / 0.3), runString: { bottomMD: shoeMD - LEN, topMD: -(FLOOR_Y + HOOK_MIN + 30 - 20 * u) } });
      S.hookH = HOOK_MIN + 30 - 20 * u; S.hookLoad = 'string';
      S.caption = hangerSet ? 'Liner hanger set at 9,108 ft MD (slips engaged in 9-5/8" casing)' : 'Land 7" liner at TD';
      hud(hangerSet ? 'LINER HANGER SET' : 'LANDING 7" LINER', [['Liner shoe', `${fmt(shoeMD)} ft MD`], ['Top of liner', `${fmt(shoeMD - LEN)} ft MD`], ['Overlap in 9-5/8"', `${fmt(9259 - TOL)} ft`]], shoeMD / SHOE);
      if (hangerSet) S.banner = { id: 'hanger', title: 'LINER HANGER SET', sub: `Top of liner ${fmt(TOL)} ft MD · shoe ${fmt(SHOE)} ft MD` };
      S.cam = { mode: 'CASING_RUN', md: TOL + 60 };
      S.readMD = shoeMD; S.readLabel = 'Liner shoe';
      break;
    }
    case 'CEMENT_LINER': {
      set(SHOE, { hangerSet: true, setProg: 1, runString: { bottomMD: TOL, topMD: SLIPS_MD + 2 } });
      S.cementHead = { md: SLIPS_MD + 2 };
      S.hookH = HOOK_MIN + 6; S.hookLoad = 'none';
      S.cement = cementJob(c, S.sp, false);
      S.flow = 'cement';
      S.caption = 'Cementing 7" liner: 15.8 ppg, TOC at top of liner';
      hud('CEMENTING 7" LINER', [['Slurry', 'Single slurry 15.8 ppg'], ['Cement front', S.cement.where], ['TOC (plan)', `Top of liner ${fmt(TOL)} ft MD`]], S.sp);
      S.hud.flow = 'cement';
      S.cam = { mode: 'CEMENTING', md: S.cement.focusMD };
      S.readMD = S.cement.focusMD; S.readLabel = 'Cement front';
      break;
    }
    case 'RELEASE_TOOL': {
      const lift = 18 * smooth(clamp((S.sp - 0.25) / 0.6));
      set(SHOE, { hangerSet: true, setProg: 1, cemented: true, released: S.sp > 0.25, runString: { bottomMD: TOL - lift, topMD: SLIPS_MD + 2 - lift } });
      S.hookH = HOOK_MIN + 2 + lift; S.hookLoad = 'string';
      S.caption = 'Release running tool from the liner hanger, pick up and circulate out excess cement';
      hud('RELEASE RUNNING TOOL', [['Running tool', S.sp > 0.25 ? 'Released' : 'Releasing…'], ['Top of liner', `${fmt(TOL)} ft MD`]]);
      if (S.sp > 0.3) S.banner = { id: 'release', title: 'RUNNING TOOL RELEASED', sub: '7" liner hung off and cemented' };
      S.cam = { mode: 'CASING_RUN', md: TOL };
      S.readMD = TOL; S.readLabel = 'Top of liner';
      break;
    }
    case 'POOH_RUNNING_STRING': {
      const bottom = lerp(TOL - 18, FLOOR_MD + 6, easeInOut(S.sp));
      const hook = hookCycle(S.stepTime, 0.8, JOINT.stand, false);
      set(SHOE, { state: 'set', hangerSet: true, setProg: 1, cemented: true, released: true, runString: { bottomMD: bottom, topMD: -(FLOOR_Y + hook) } });
      S.hookH = hook; S.hookLoad = 'string';
      S.caption = `POOH running string: ${fmt(Math.max(0, bottom))} ft`;
      hud('POOH RUNNING STRING', [['Running tool', `${fmt(Math.max(0, bottom))} ft MD`], ['Liner', `${fmt(TOL)}–${fmt(SHOE)} ft MD, cemented`]], S.sp);
      S.cam = { mode: S.sp < 0.8 ? 'FOLLOW_BIT' : 'WELL_OVERVIEW', md: Math.max(0, bottom) };
      S.readMD = Math.max(0, bottom); S.readLabel = 'Running tool';
      break;
    }
    default: break;
  }
}

/* ------------------------------------------------------------------ */
function completionPhase(S) {
  S.holeMD = TD;
  const perfTop = COMPLETION.perfs[0][0], perfBot = COMPLETION.perfs[COMPLETION.perfs.length - 1][1];
  const hud = (title, rows, progress = null, flow = null) => { S.hud = { title, rows, progress, flow }; };
  switch (S.step) {
    case 'RUN_TCP': {
      const b = lerp(FLOOR_MD + 6, TCP_BOTTOM, easeInOut(S.sp));
      const hook = hookCycle(S.stepTime, 0.8, JOINT.stand, true);
      S.tcp = { bottomMD: b, topMD: -(FLOOR_Y + hook), len: TCP_LEN, fired: false };
      S.hookH = hook; S.hookLoad = 'string';
      S.caption = `Run TCP perforating guns on drill pipe: ${fmt(Math.max(0, b))} ft`;
      hud('RUN TCP GUNS', [['Guns bottom', `${fmt(Math.max(0, b))} ft MD`], ['Perf interval', `${fmt(perfTop)}–${fmt(perfBot)} ft MD (illustrative)`]], S.sp);
      S.cam = { mode: b < 60 ? 'FLOOR' : 'FOLLOW_BIT', md: Math.max(0, b) };
      S.readMD = Math.max(0, b); S.readLabel = 'Guns';
      break;
    }
    case 'PERFORATE': {
      S.tcp = { bottomMD: TCP_BOTTOM, topMD: SLIPS_MD - 10, len: TCP_LEN, fired: S.sp > 0.2 };
      S.hookH = HOOK_MIN + 10; S.hookLoad = 'string';
      S.perf = smooth(clamp((S.sp - 0.2) / 0.25));
      S.perfFlash = S.sp > 0.2 ? Math.max(0, 1 - (S.sp - 0.2) / 0.35) : 0;
      S.caption = 'Fire TCP guns: perforate 4 intervals in Fm-G';
      hud('PERFORATING', [['Intervals', '4 × 30 ft in Fm-G (illustrative)'], ['Depth', `${fmt(perfTop)}–${fmt(perfBot)} ft MD`]]);
      if (S.sp > 0.3) S.banner = { id: 'perf', title: 'PERFORATED', sub: `4 intervals, ${fmt(perfTop)}–${fmt(perfBot)} ft MD (illustrative)` };
      S.cam = { mode: 'COMPLETION', md: 9450 };
      S.readMD = 9450; S.readLabel = 'Guns';
      break;
    }
    case 'POOH_TCP': {
      S.perf = 1;
      const b = lerp(TCP_BOTTOM, FLOOR_MD + 6, easeInOut(S.sp));
      const hook = hookCycle(S.stepTime, 0.8, JOINT.stand, false);
      S.tcp = { bottomMD: b, topMD: -(FLOOR_Y + hook), len: TCP_LEN, fired: true };
      S.hookH = hook; S.hookLoad = 'string';
      S.caption = `POOH spent TCP guns: ${fmt(Math.max(0, b))} ft`;
      hud('POOH TCP GUNS', [['Guns', `${fmt(Math.max(0, b))} ft MD`], ['Next', 'Run ESP + tubing']], S.sp);
      S.cam = { mode: S.sp < 0.8 ? 'FOLLOW_BIT' : 'FLOOR', md: Math.max(0, b) };
      S.readMD = Math.max(0, b); S.readLabel = 'Guns';
      break;
    }
    case 'RUN_ESP': {
      S.perf = 1;
      const b = lerp(FLOOR_MD + 4, COMPLETION.espBot, easeInOut(S.sp));
      const hook = hookCycle(S.stepTime, 0.8, JOINT.stand, true);
      S.tubing = { bottomMD: b, topMD: -(FLOOR_Y + hook) };
      S.hookH = hook; S.hookLoad = 'string';
      S.caption = `Run ESP on 3-1/2" tubing: ${fmt(Math.max(0, b))} ft`;
      hud('RUN ESP + TUBING', [['ESP bottom', `${fmt(Math.max(0, b))} ft MD`], ['Setting depth', `${fmt(COMPLETION.espTop)}–${fmt(COMPLETION.espBot)} ft MD (illustrative)`], ['Tubing', COMPLETION.tubing]], S.sp);
      S.cam = { mode: b < 60 ? 'FLOOR' : 'FOLLOW_BIT', md: Math.max(0, b - ESP_LEN / 2) };
      S.readMD = Math.max(0, b); S.readLabel = 'ESP';
      break;
    }
    case 'NIPPLE_DOWN_BOP':
      S.perf = 1;
      S.tubing = { bottomMD: COMPLETION.espBot, topMD: CELLAR_DEPTH - 4 };
      S.bop = 'b13'; S.bopLift = smooth(S.sp);
      S.hookH = 70; S.hookLoad = 'none';
      S.caption = 'Land tubing hanger, set back-pressure valve, nipple down BOP 13-5/8"';
      hud('NIPPLE DOWN BOP', [['BOP', 'BOP 13-5/8" (annular + 3 rams)'], ['Barrier', 'Tubing hanger + BPV']], S.sp);
      if (S.sp > 0.6) S.banner = { id: 'nd', title: 'BOP NIPPLED DOWN', sub: 'Tubing hanger landed in tubing head spool' };
      S.cam = { mode: 'CELLAR' }; S.readMD = COMPLETION.espBot; S.readLabel = 'ESP';
      break;
    case 'NIPPLE_UP_TREE':
      S.perf = 1;
      S.tubing = { bottomMD: COMPLETION.espBot, topMD: CELLAR_DEPTH - 4 };
      S.bop = 'tree'; S.treeDrop = 1 - smooth(S.sp);
      S.hookH = 70; S.hookLoad = 'none';
      S.caption = 'Nipple up X-mas tree (API 6A) and pressure test';
      hud('NIPPLE UP X-MAS TREE', [['Tree', 'API 6A, PSL2, PR2'], ['Gate valve', '3-1/8" 5K']], S.sp);
      if (S.sp > 0.7) S.banner = { id: 'tree', title: 'X-MAS TREE INSTALLED', sub: 'Well ready for production test' };
      S.cam = { mode: 'CELLAR' }; S.readMD = COMPLETION.espBot; S.readLabel = 'ESP';
      break;
    case 'PRODUCTION':
      S.perf = 1;
      S.tubing = { bottomMD: COMPLETION.espBot, topMD: CELLAR_DEPTH - 4 };
      S.bop = 'tree';
      S.hookH = 70; S.hookLoad = 'none';
      S.flow = 'oil';
      S.caption = 'Production test: oil enters through perforations, ESP lifts it up the tubing to the tree';
      hud('PRODUCTION', [['Lift', `${COMPLETION.esp} at ${fmt(COMPLETION.espTop)}–${fmt(COMPLETION.espBot)} ft MD`], ['Tubing', COMPLETION.tubing], ['Initial target', '210 BOPD']], null, 'oil');
      // perforations (inflow) → ESP intake (lift) → whole well
      S.cam = { mode: S.sp < 0.6 ? 'COMPLETION' : 'WELL_OVERVIEW', md: S.sp < 0.3 ? 9450 : 8800 };
      S.readMD = COMPLETION.espBot; S.readLabel = 'ESP';
      break;
    default: break;
  }
}

export { TCP_LEN, WIRELINE_TOOL_LEN, ESP_LEN, SLIPS_MD, SHOE_TRACK };
