// node --test tests/*.test.mjs  (Node 22.18+ strips TypeScript types natively)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { survey, tvdAt, incDegAt, mdAtTvd, KOP, TD } from '../src/data/trajectory.ts';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('J-type profile reproduces the PPTX depths', () => {
  near(tvdAt(KOP), 700, 0.01, 'KOP vertical');
  near(tvdAt(TD), 8561, 1, 'TD TVD (slide 2)');
  near(tvdAt(2000), 1956, 1, '20-in shoe TVD (slide 6)');
  near(tvdAt(5000), 4564, 1, '13-3/8-in shoe TVD (slide 8)');
  near(tvdAt(9259), 8261, 1, '9-5/8-in shoe TVD (slide 10)');
  near(incDegAt(TD), 29.74, 1e-9, 'final inclination (slide 2)');
});

test('vertical above KOP, monotonic below, mdAtTvd inverts tvdAt', () => {
  assert.equal(survey(500).vs, 0);
  let last = -1;
  for (let md = 0; md <= TD; md += 50) { const t = tvdAt(md); assert.ok(t > last); last = t; }
  for (const md of [300, 1200, 2187, 6013, 9604]) near(mdAtTvd(tvdAt(md)), md, 1e-6, `inverse at ${md}`);
});
