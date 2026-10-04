import test from 'node:test';
import assert from 'node:assert/strict';
import { stateAt, TOTAL, PHASES, PHASE_START, stepStart } from '../app/src/stateMachine.js';
import { CASINGS } from '../app/src/engineeringData.js';

test('12 main operations are preserved', () => {
  assert.equal(PHASES.length, 12);
  assert.deepEqual(PHASES.map((p) => p.key), ['rig', 'cond', 'd26', 'c20', 'd17', 'c13', 'd12', 'c9', 'd8', 'log', 'c7', 'comp']);
  for (const p of PHASES) assert.ok(Math.abs(p.steps.reduce((a, s) => a + s[1], 0) - 1) < 1e-9, p.key);
});

test('downhole positions are continuous through the timeline', () => {
  let prev = stateAt(0);
  const dt = 0.005;
  for (let t = dt; t < TOTAL; t += dt) {
    const S = stateAt(t);
    if (S.drill && prev.drill && S.i === prev.i) assert.ok(Math.abs(S.drill.bitMD - prev.drill.bitMD) < 40, `bit jump at t=${t.toFixed(3)} ${S.step}`);
    for (const c of CASINGS) {
      const a = S.casings[c.key], b = prev.casings[c.key];
      if (a.state === 'running' && b.state === 'running') assert.ok(Math.abs(a.shoeMD - b.shoeMD) < 40, `${c.key} shoe jump at t=${t.toFixed(3)}`);
    }
    if (S.liner && prev.liner && S.liner.state === 'running' && prev.liner.state === 'running') assert.ok(Math.abs(S.liner.shoeMD - prev.liner.shoeMD) < 40, `liner jump at ${t}`);
    assert.ok(S.holeMD >= prev.holeMD - 1e-6 || S.i === 0, `hole depth decreased at ${t}`);
    prev = S;
  }
});

test('casing reaches planned shoe when landed and liner spans TOL-TD only', () => {
  for (const k of ['c20', 'c13', 'c9']) {
    const S = stateAt(stepStart(k, 'LAND_CASING') + 0.001 + PHASES.find((p) => p.key === k).dur * 0.07 * 0.9);
    const c = CASINGS.find((x) => x.key === k);
    assert.ok(Math.abs(S.casings[k].shoeMD - c.shoe) < 0.01, `${k} landed shoe ${S.casings[k].shoeMD}`);
  }
  const S = stateAt(stepStart('c7', 'CEMENT_LINER') + 1);
  assert.equal(S.liner.topMD, 9108); assert.equal(S.liner.shoeMD, 9604);
});

test('cement front goes down inside, then up the annulus', () => {
  const t0 = stepStart('c13', 'CEMENT_CASING');
  const dur = PHASES.find((p) => p.key === 'c13').dur * 0.24;
  const early = stateAt(t0 + dur * 0.2).cement, late = stateAt(t0 + dur * 0.9).cement;
  assert.ok(early.front < early.Li, 'early front inside casing');
  assert.ok(late.front > late.Li, 'late front in annulus');
});

test('phase starts are monotonic', () => {
  for (let i = 1; i < PHASE_START.length; i++) assert.ok(PHASE_START[i] > PHASE_START[i - 1]);
});
