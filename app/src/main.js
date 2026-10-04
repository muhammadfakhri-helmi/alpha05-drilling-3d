/**
 * Alpha-05 Interactive Well Construction Digital Twin — bootstrap + frame loop.
 *
 *   timeline time ─► stateAt(t) ─► MD values ─► trajectory engine ─► geometry
 *                                   └► camera director, HUD, labels, panels
 */
import './styles.css';
import { Color, Vector3 } from 'three';
import { createRenderer, applyViewport } from './scene/renderer.js';
import { createEnvironment } from './scene/environment.js';
import { stateAt, TOTAL, PHASES, PHASE_INDEX, PHASE_START, stepStart } from './stateMachine.js';
import { getPosition, KOP, EOB, TD } from './trajectory.js';
import { SECTIONS, CASINGS, CASING_BY_KEY, WELL } from './engineeringData.js';
import { rad, CELLAR_DEPTH } from './constants.js';
import { fmt } from './utils/math.js';
import { Mat } from './utils/materials.js';
import { QUALITY_PRESETS, deviceClass, autoPreset, AdaptiveQuality } from './utils/performance.js';
import { Wellbore } from './well/wellbore.js';
import { CasingSystem } from './well/casing.js';
import { CementSystem } from './well/cement.js';
import { LinerSystem } from './well/liner.js';
import { CompletionSystem } from './well/completion.js';
import { buildBHAs } from './well/bha.js';
import { FluidParticles } from './well/fluids.js';
import { buildFormations } from './well/formations.js';
import { Rig, RIG_ANCHORS } from './surface/rig.js';
import { WellheadStack } from './surface/wellhead.js';
import { CameraController, MODE_LABEL, TRACKING } from './camera/cameraController.js';
import { Responsive } from './ui/responsive.js';
import { Hud } from './ui/hud.js';
import { Timeline } from './ui/timeline.js';
import { EngineeringPanel } from './ui/engineeringPanel.js';
import { LabelManager } from './ui/labels.js';
import { Selection } from './ui/selection.js';
import { DepthTrack } from './ui/depthTrack.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const params = new URLSearchParams(location.search);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const UNDERGROUND = new Color('#24231F');

const loader = {
  steps: ['traj', 'rig', 'well', 'fm', 'data'],
  done(k) {
    document.querySelector(`#ldSteps li[data-k="${k}"]`)?.classList.add('ok');
    const n = document.querySelectorAll('#ldSteps li.ok').length;
    $('ldBar').style.width = `${(n / this.steps.length) * 100}%`;
  },
  finish() { $('loader').classList.add('done'); setTimeout(() => $('loader').remove(), 800); },
  error(msg) { const e = $('ldErr'); e.hidden = false; e.textContent = msg; },
};

async function boot() {
  await Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
  const canvas = $('scene');
  let ctx;
  try { ctx = createRenderer(canvas); } catch (err) { loader.error('WebGL is not available on this device/browser.'); throw err; }
  const { renderer, scene, camera } = ctx;

  // ---------- quality ----------
  const device = deviceClass();
  const auto = autoPreset(device);
  let qualityChoice = params.get('quality') ?? 'auto';
  const presetFor = (q) => (q === 'auto' ? { ...QUALITY_PRESETS[auto.base], dprMax: auto.dprMax, particles: auto.particles } : QUALITY_PRESETS[q]);
  let preset = presetFor(qualityChoice);
  const adaptive = new AdaptiveQuality({ minDpr: 0.75, maxDpr: preset.dprMax, target: device === 'mobile' ? 36 : 52, onChange: (d) => renderer.setPixelRatio(Math.min(devicePixelRatio, d)) });
  renderer.setPixelRatio(Math.min(devicePixelRatio, preset.dprMax));

  const env = createEnvironment(renderer, scene, { env: preset.env, shadowMapSize: preset.shadowMap, shadows: preset.shadows });
  loader.done('traj'); await nextFrame();

  // ---------- surface ----------
  const rig = new Rig(scene, { shadows: true });
  const wellhead = new WellheadStack(scene);
  loader.done('rig'); await nextFrame();

  // ---------- downhole ----------
  const wellbore = new Wellbore(scene);
  const casing = new CasingSystem(scene);
  const cement = new CementSystem(scene);
  const liner = new LinerSystem(scene);
  const completion = new CompletionSystem(scene);
  const bhas = buildBHAs();
  bhas.forEach((b) => scene.add(b.group));
  const fluids = new FluidParticles(scene);
  fluids.setBudget(preset.particles);
  loader.done('well'); await nextFrame();
  buildFormations(scene, renderer, { width: preset.wall });
  loader.done('fm'); await nextFrame();

  // ---------- camera + UI ----------
  const cam = new CameraController(camera, canvas, { reduceMotion });
  const clock = { t: 0, playing: !reduceMotion && !params.has('pause'), speed: 1, scrubbing: false };
  const hud = new Hud();
  const timeline = new Timeline(clock);
  const labels = new LabelManager($('labels'), camera);
  const track = new DepthTrack($('trackCanvas'), $('trackToggle'), $('track'));
  let camChoice = params.get('cam') ?? 'auto';
  let S = stateAt(0);

  let responsive = null;
  let baseLabelPriority = 3;
  const relayout = () => { if (!responsive) return; responsive.schedule(); setTimeout(() => responsive.schedule(), 340); };
  const panel = new EngineeringPanel({ onStateChange: relayout });
  hud.onLayoutDirty = relayout;
  track.onToggle = relayout;
  responsive = new Responsive(app, {
    onChange: ({ layout, w, h, insets }) => {
      panel.setLayout(layout);
      const v = applyViewport(renderer, camera, w, h, insets);
      cam.setViewport({ width: w, height: h, ...v });
      labels.setViewport(w, h);
      baseLabelPriority = layout === 'phone' || layout === 'phone-land' ? 1 : layout === 'desktop' ? 3 : 2;
      hud.syncCardHeight();
      labels.setBlockers(responsive.blockers());
    },
  });

  const selection = new Selection({
    canvas, camera, getState: () => S,
    roots: [rig.group, wellhead.group, casing.group, cement.group, liner.group, completion.group, wellbore.group, ...bhas.map((b) => b.group), scene.getObjectByName('formations')],
    onSelect: () => relayout(),
  });

  // camera buttons
  const setCam = (c) => {
    camChoice = c;
    document.querySelectorAll('#cams button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cam === c)));
  };
  document.querySelectorAll('#cams button').forEach((b) => b.addEventListener('click', () => setCam(b.dataset.cam)));
  setCam(camChoice);

  // settings
  const settingsEl = $('settings');
  $('btnSettings').addEventListener('click', () => {
    settingsEl.hidden = !settingsEl.hidden;
    $('btnSettings').setAttribute('aria-expanded', String(!settingsEl.hidden));
    relayout();
  });
  const seg = (id, val, fn) => {
    const el = $(id);
    const sync = (v) => el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
    el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { fn(b.dataset.v); sync(b.dataset.v); }));
    sync(val);
    return sync;
  };
  const applyQuality = (q) => {
    qualityChoice = q;
    preset = presetFor(q);
    adaptive.enabled = q === 'auto';
    adaptive.setRange(0.75, preset.dprMax);
    adaptive.dpr = preset.dprMax;
    renderer.setPixelRatio(Math.min(devicePixelRatio, preset.dprMax));
    env.sun.castShadow = preset.shadows;
    fluids.setBudget(preset.particles);
    scene.environmentIntensity = preset.env ? 0.55 : 0;
    responsive.schedule();
  };
  seg('setQuality', qualityChoice, applyQuality);
  applyQuality(qualityChoice);
  seg('setMode', 'technical', (v) => { app.dataset.mode = v; relayout(); });
  seg('setLabels', 'on', (v) => { labels.enabled = v === 'on'; });
  const syncSpeed = seg('setSpeed', '1', (v) => timeline.setSpeed(+v));
  timeline.onSpeed = (v) => syncSpeed(v);
  if (params.has('speed')) timeline.setSpeed(+params.get('speed'));

  // keyboard
  addEventListener('keydown', (e) => {
    if (e.target.closest('input,select,textarea')) return;
    if (e.code === 'Space' && !e.target.closest('button')) { timeline.togglePlay(); e.preventDefault(); }
    if (e.key === 'ArrowRight' && e.target === document.body) timeline.step(1);
    if (e.key === 'ArrowLeft' && e.target === document.body) timeline.step(-1);
    const camKeys = { 1: 'auto', 2: 'rig', 3: 'follow', 4: 'well' };
    if (camKeys[e.key]) setCam(camKeys[e.key]);
    if (e.key === 'Escape') { selection.clear(); settingsEl.hidden = true; }
  });

  // deep links: ?t=seconds | ?phase=c13&step=RUN_CASING&sp=0.5 ; ?cam= ; ?pause
  if (params.has('t')) clock.t = +params.get('t');
  if (params.has('phase')) {
    const ph = params.get('phase');
    const st = params.get('step');
    const t0 = st ? stepStart(ph, st) : PHASE_START[PHASE_INDEX[ph]];
    const w = st ? PHASES[PHASE_INDEX[ph]].steps.find((s) => s[0] === st)?.[1] ?? 0 : 1;
    clock.t = t0 + (+(params.get('sp') ?? 0)) * w * PHASES[PHASE_INDEX[ph]].dur;
  }
  timeline.syncPlay();

  // ---------- labels ----------
  addLabels(labels, { rig, wellhead });

  // ---------- frame loop ----------
  const bitSpin = { a: 0 };
  const dpMap = Mat.drillPipe().map;
  const tmp = new Vector3();
  let last = performance.now();
  let blockerT = 0, pickT = 0;
  let firstFrame = true;

  const bhaRadius = (md) => {
    const b = S.drill ? bhas[S.drill.sec] : null;
    if (!b) return rad(5);
    for (const c of b.components) if (md >= c.mdTop && md <= c.mdBot) return typeof c.radius === 'number' ? c.radius : rad(8);
    return rad(5);
  };
  const fluidCtx = { bhaLength: 300, bhaRadius, bore: (md) => wellbore._bore(md) };

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (clock.playing && !clock.scrubbing) {
      clock.t += dt * clock.speed;
      if (clock.t >= TOTAL) { clock.t = TOTAL - 0.001; clock.playing = false; timeline.syncPlay(); }
    }
    S = stateAt(clock.t);

    // --- downhole scene
    wellbore.update(S);
    casing.update(S);
    cement.update(S);
    liner.update(S);
    completion.update(S, dt);
    if (S.drill?.rotating) { bitSpin.a += dt * (S.drill.drilling ? 9 : 5); dpMap.offset.y = (dpMap.offset.y + dt * 1.6) % 1; }
    bhas.forEach((b, i) => {
      if (S.drill && S.drill.sec === i) {
        b.spin = bitSpin.a * 0.35;
        b.update(S.drill.bitMD, S.drill.topMD);
        if (b.bit) b.bit.userData.spin.rotation.y = bitSpin.a;
        fluidCtx.bhaLength = b.length;
      } else b.hide();
    });
    fluids.update(S, dt, fluidCtx);

    // --- surface
    rig.update(S, dt);
    wellhead.update(S);

    // --- operation light near the active depth
    const focus = Math.max(0, S.cam.md ?? S.readMD);
    getPosition(focus, env.opLight.position).add(tmp.set(12, 6, 40));
    env.opLight.intensity = cam.isTracking() && focus > 40 ? 900 : 0;

    // --- camera director
    const mode = camChoice === 'auto' ? S.cam.mode
      : camChoice === 'rig' ? 'RIG' : camChoice === 'well' ? 'WELL_OVERVIEW'
        : TRACKING.has(S.cam.mode) ? S.cam.mode : 'FOLLOW_BIT';
    const trackMD = Math.max(0, S.cam.md ?? S.readMD);
    if (mode !== cam.mode) cam.setMode(mode, { md: trackMD, scale: S.cam.scale ?? 1, instant: firstFrame, duration: clock.scrubbing ? 0.6 : 1.4 });
    cam.update(dt, trackMD);
    const under = cam.underground();
    env.sky.visible = !under;
    scene.background = under ? UNDERGROUND : null;
    $('camMode').textContent = `Camera · ${MODE_LABEL[cam.mode]}`;

    // --- UI
    hud.update(S, dt, { playing: clock.playing });
    timeline.update(S);
    panel.render(S.phase.sec, S);
    panel.setSub(S.phase.title);
    track.draw(S);
    blockerT -= dt;
    if (blockerT <= 0) { labels.setBlockers(responsive.blockers()); blockerT = 0.25; }
    const dist = camera.position.distanceTo(cam.controls.target);
    // the whole-well view is mostly technical markers: allow one more priority level on small screens
    labels.maxPriority = Math.min(3, baseLabelPriority + (cam.mode === 'WELL_OVERVIEW' && baseLabelPriority < 2 ? 1 : 0));
    labels.update(S, {
      downhole: under || cam.mode === 'WELL_OVERVIEW' || (camera.position.y < 120 && cam.controls.target.y < -30),
      surface: !under && cam.mode !== 'WELL_OVERVIEW' && dist < 1500 && camera.position.y > 0,
      cinematic: app.dataset.mode === 'cinematic', overview: cam.mode === 'WELL_OVERVIEW',
    });
    pickT -= dt;
    if (pickT <= 0 && selection.selected) { selection.render(); pickT = 0.25; }

    adaptive.sample(dt);
    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; loader.done('data'); loader.finish(); }
    requestAnimationFrame(frame);
  }

  responsive.measure();
  requestAnimationFrame((t) => { last = t; frame(t); });
  // expose for debugging / automated screenshots
  window.__alpha05 = { clock, get state() { return S; }, cam, renderer, setCam, panel, scene };
}

/** Label catalogue: priority 1 = high (always eligible), 2 = medium, 3 = low. */
function addLabels(L, { rig, wellhead }) {
  const P = (md, v) => getPosition(Math.max(0, md), v);
  // high – active equipment
  L.add({ id: 'bit', priority: 1, context: 'down', show: (S) => !!S.drill && S.drill.bitMD > 5, text: (S) => `Bit ${SECTIONS[S.drill.sec].hole} · ${fmt(S.drill.bitMD)} ft`, anchor: (S, v) => P(S.drill.bitMD, v) });
  L.add({ id: 'bha', priority: 1, context: 'down', show: (S, c) => !!S.drill && S.drill.bitMD > 200 && !c.overview, text: (S) => `BHA ${SECTIONS[S.drill.sec].hole} (${fmt(SECTIONS[S.drill.sec].bha.reduce((a, r) => a + r[2], 0))} ft)`, anchor: (S, v) => P(S.drill.bitMD - 150, v).add(new Vector3(rad(8) + 1, 0, 0)) });
  L.add({ id: 'runshoe', priority: 1, context: 'down', show: (S) => CASINGS.some((c) => S.casings[c.key]?.state === 'running' && S.casings[c.key].shoeMD > 5 && c.key !== 'c30'), text: (S) => { const c = CASINGS.find((x) => S.casings[x.key]?.state === 'running'); return `${c.name.replace(' casing', '')} shoe · ${fmt(S.casings[c.key].shoeMD)} ft`; }, anchor: (S, v) => { const c = CASINGS.find((x) => S.casings[x.key]?.state === 'running'); return P(S.casings[c.key].shoeMD, v); } });
  L.add({ id: 'cemfront', priority: 1, context: 'down', show: (S) => !!S.cement && !S.cement.done, text: (S) => (S.cement.front < S.cement.Li ? 'Cement front ↓' : 'Cement top ↑ (annulus)'), anchor: (S, v) => P(S.cement.focusMD, v) });
  L.add({ id: 'hanger', priority: 1, context: 'down', show: (S) => !!S.liner && S.liner.shoeMD - S.liner.topMD > 400 && S.liner.topMD > 5, text: (S) => `Liner hanger · ${fmt(S.liner.topMD)} ft`, anchor: (S, v) => P(S.liner.topMD, v) });
  L.add({ id: 'lshoe', priority: 1, context: 'down', show: (S) => !!S.liner && S.liner.state === 'running' && S.liner.shoeMD > 5, text: (S) => `7" liner shoe · ${fmt(S.liner.shoeMD)} ft`, anchor: (S, v) => P(S.liner.shoeMD, v) });
  L.add({ id: 'rtool', priority: 1, context: 'down', show: (S) => !!S.liner?.runString && S.liner.released && S.liner.runString.bottomMD > 100, text: 'Running tool (released)', anchor: (S, v) => P(S.liner.runString.bottomMD, v) });
  L.add({ id: 'wl', priority: 1, context: 'down', show: (S) => !!S.wireline && S.wireline.toolMD > 5, text: (S) => `Logging tools · ${fmt(S.wireline.toolMD)} ft`, anchor: (S, v) => P(S.wireline.toolMD - 35, v) });
  L.add({ id: 'tcp', priority: 1, context: 'down', show: (S) => !!S.tcp && S.tcp.bottomMD > 5, text: (S) => (S.tcp.fired ? 'TCP guns (fired)' : 'TCP guns'), anchor: (S, v) => P(S.tcp.bottomMD - 120, v) });
  L.add({ id: 'esp', priority: 1, context: 'down', show: (S) => !!S.tubing && S.tubing.bottomMD > 5, text: 'ESP 160 HP', anchor: (S, v) => P(S.tubing.bottomMD - 45, v) });
  L.add({ id: 'perfs', priority: 1, context: 'down', show: (S) => S.perf > 0.5, text: 'Perforations (Fm-G)', anchor: (S, v) => P(9450, v).add(new Vector3(rad(7) + 4, 0, 0)) });
  L.add({ id: 'joint', priority: 1, context: 'surface', show: (S) => !!S.handling, text: (S) => (S.handling.kind === 'liner' ? '7" liner joint' : `${CASING_BY_KEY[S.handling.ck].name.replace(' casing', '')} casing joint`), anchor: (S, v) => v.copy(rig.handJoint.position) });
  L.add({ id: 'chead', priority: 1, context: 'surface', show: (S) => !!S.cementHead, text: 'Cement head', anchor: (S, v) => v.set(2, -S.cementHead.md + 4, 0) });
  // medium – technical markers and key surface equipment
  L.add({ id: 'kop', priority: 2, context: 'down', technical: true, text: 'KOP 700 ft', anchor: (S, v) => P(KOP, v) });
  L.add({ id: 'eob', priority: 2, context: 'down', technical: true, text: 'EOB 2,187 ft · 29.74°', anchor: (S, v) => P(EOB, v) });
  L.add({ id: 'tgt', priority: 2, context: 'down', technical: true, text: 'Target Fm-G · 8,261 ft TVD', anchor: (S, v) => P(WELL.target.md, v).add(new Vector3(55, 0, 0)) });
  L.add({ id: 'td', priority: 2, context: 'down', technical: true, text: 'TD 9,604 ft MD', anchor: (S, v) => P(TD, v) });
  for (const c of CASINGS.filter((x) => ['c20', 'c13', 'c9'].includes(x.key))) {
    L.add({ id: `shoe-${c.key}`, priority: 2, context: 'down', technical: true, show: (S) => S.casings[c.key].state === 'set', text: `${c.name.replace(' casing', '')} shoe · ${fmt(c.shoe)} ft`, anchor: (S, v) => P(c.shoe, v) });
  }
  L.add({ id: 'stack', priority: 2, context: 'surface', show: (S) => S.bop !== 'none' || S.wh > 0, text: (S) => ({ div: 'Diverter', b21: 'BOP 21-1/4"', b13: 'BOP 13-5/8"', tree: 'X-mas tree' }[S.bop] ?? 'Wellhead'), anchor: (S, v) => v.set(3, wellhead.anchorY(S), 0) });
  L.add({ id: 'topdrive', priority: 2, context: 'surface', text: 'Top drive', anchor: (S, v) => rig.topDriveAnchor(v) });
  L.add({ id: 'pump', priority: 2, context: 'surface', text: 'Mud pumps', anchor: (S, v) => v.copy(RIG_ANCHORS.mudPump) });
  L.add({ id: 'shaker', priority: 2, context: 'surface', text: 'Shale shakers', anchor: (S, v) => v.copy(RIG_ANCHORS.shaker) });
  // low – site context
  const low = [['Mast', 'mast'], ['Drawworks', 'drawworks'], ['Mud tanks', 'mudTank'], ['Barite silos', 'silo'], ['Pipe rack', 'pipeRack'], ['Catwalk', 'catwalk'], ['Generators', 'generator'], ['Camp', 'camp']];
  for (const [t, k] of low) L.add({ id: k, priority: 3, context: 'surface', text: t, anchor: (S, v) => v.copy(RIG_ANCHORS[k]) });
  void CELLAR_DEPTH;
}

boot().catch((err) => { console.error(err); loader.error(`Failed to start: ${err.message}`); });
