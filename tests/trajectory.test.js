import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import {
  survey, EOB, KOP, TD, tvdAt, incAt, getPosition, getTangent, getNormal, getBinormal,
  getQuaternion, mdAtTvd, sampleMDs,
} from '../src/trajectory.js';
import { FORMATIONS, SECTIONS } from '../src/engineeringData.js';

test('design values are reproduced (not altered)', () => {
  assert.equal(KOP, 700);
  assert.ok(Math.abs(EOB - 2187) < 0.5, `EOB ${EOB}`);
  assert.equal(TD, 9604);
  assert.ok(Math.abs(tvdAt(TD) - 8561) < 1, `TD TVD ${tvdAt(TD)}`);
  assert.ok(Math.abs(incAt(TD) - 29.74) < 1e-9);
});

test('casing shoe TVDs match the plan', () => {
  for (const s of SECTIONS) assert.ok(Math.abs(tvdAt(s.csg.shoe) - s.csg.shoeTVD) < 1, `${s.csg.name}: ${tvdAt(s.csg.shoe)} vs ${s.csg.shoeTVD}`);
});

test('formation MD/TVD pairs are consistent with the trajectory', () => {
  for (const f of FORMATIONS) assert.ok(Math.abs(tvdAt(f.md) - f.tvd) < 1.5, `${f.name}: ${tvdAt(f.md)} vs ${f.tvd}`);
});

test('trajectory is continuous and MD is arc length', () => {
  const a = new Vector3(), b = new Vector3();
  for (let md = 0; md < TD; md += 1) {
    getPosition(md, a); getPosition(md + 1, b);
    assert.ok(Math.abs(a.distanceTo(b) - 1) < 1e-3, `step length at ${md}`);
  }
});

test('frame is orthonormal and quaternion maps +Y to uphole', () => {
  const t = new Vector3(), n = new Vector3(), bn = new Vector3(), y = new Vector3();
  for (const md of [0, 500, KOP, 1200, EOB, 5000, TD]) {
    getTangent(md, t); getNormal(md, n); getBinormal(md, bn);
    assert.ok(Math.abs(t.dot(n)) < 1e-12);
    assert.ok(new Vector3().crossVectors(t, n).distanceTo(bn) < 1e-12);
    y.set(0, 1, 0).applyQuaternion(getQuaternion(md));
    assert.ok(y.distanceTo(t.clone().negate()) < 1e-9);
  }
});

test('mdAtTvd inverts tvdAt', () => {
  for (const md of [100, 900, 1800, 4000, 9000]) assert.ok(Math.abs(mdAtTvd(tvdAt(md)) - md) < 1e-6);
});

test('adaptive sampling includes KOP/EOB and splits', () => {
  const s = sampleMDs(0, TD, { step: 10, straightStep: 200, breaks: [{ md: 2000, split: true }] });
  assert.ok(s.includes(KOP) && s.includes(EOB));
  assert.equal(s[0], 0); assert.equal(s[s.length - 1], TD);
  for (let i = 1; i < s.length; i++) assert.ok(s[i] > s[i - 1]);
  assert.ok(s.filter((m) => Math.abs(m - 2000) < 0.01).length === 2);
  assert.ok(s.length < 260, `ring count ${s.length}`);
});

test('survey above ground continues vertically', () => {
  const r = survey(-30);
  assert.equal(r.vs, 0); assert.equal(r.tvd, -30);
});
