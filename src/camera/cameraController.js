/**
 * Trajectory-aware camera.
 *
 * Tracking modes (FOLLOW_BIT, CASING_RUN, CEMENTING, COMPLETION) keep the
 * camera offset in the LOCAL trajectory frame (normal, uphole, binormal) at
 * the tracked MD:
 *
 *     target   = P(md + lookAhead)
 *     position = target + R(md) · offsetLocal
 *
 * so the view turns smoothly with the build section instead of using a fixed
 * world offset. User orbit / zoom / pan is read back into the local frame each
 * frame, so manual adjustments persist while tracking. No roll is ever applied
 * (OrbitControls keeps world-up), which avoids banking and flips.
 *
 * Discrete changes of mode are blended with a single GSAP tween; continuous
 * tracking runs in the render loop.
 */
import { Vector3, Quaternion } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { getPosition, getQuaternion, TD, EOB } from '../trajectory.js';
import { damp, clamp } from '../utils/math.js';

export const MODE_LABEL = {
  RIG: 'Rig', FLOOR: 'Rig floor', CELLAR: 'Wellhead', FOLLOW_BIT: 'Follow bit', CASING_RUN: 'Casing run',
  CEMENTING: 'Cementing', COMPLETION: 'Completion', WELL_OVERVIEW: 'Entire well',
};
const TRACKING = new Set(['FOLLOW_BIT', 'CASING_RUN', 'CEMENTING', 'COMPLETION']);

/** Default local offsets: [normal, uphole, binormal(view)], lookAhead (ft, + = downhole). */
const TRACK_CFG = {
  // distances are for a 12-1/4" hole and scale with the active hole size (S.cam.scale)
  FOLLOW_BIT: { offset: [12, 18, 105], look: -28 },
  CASING_RUN: { offset: [12, 18, 96], look: -24 },
  CEMENTING: { offset: [10, 10, 74], look: -6 },
  COMPLETION: { offset: [10, 8, 70], look: 0 },
};
const POSES = {
  RIG: { target: [-18, 58, -14], pos: [250, 120, 330] },
  FLOOR: { target: [12, 44, 0], pos: [74, 66, 104] },
  CELLAR: { target: [0, 2, 0], pos: [17, 14, 46] },
};

const _v = new Vector3(), _q = new Quaternion(), _qi = new Quaternion();

export class CameraController {
  constructor(camera, dom, { reduceMotion = false } = {}) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, dom);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, maxDistance: 40000, minDistance: 2, screenSpacePanning: true, zoomToCursor: false });
    this.controls.touches = { ONE: 0, TWO: 2 }; // ROTATE, DOLLY_PAN
    this.reduceMotion = reduceMotion;
    this.mode = null;
    this.blend = 1;
    this.from = { pos: new Vector3(), target: new Vector3() };
    this.offsetLocal = new Vector3();
    this.panLocal = new Vector3();
    this.q = new Quaternion();
    this.trackMD = 0;
    this.target = new Vector3();
    this.viewport = { width: 1, height: 1, freeWidth: 1, freeHeight: 1, baseFov: 40 };
    this.tween = null;
    this.userInteracting = false;
    this.controls.addEventListener('start', () => { this.userInteracting = true; });
    this.controls.addEventListener('end', () => { this.userInteracting = false; });
  }

  setViewport(v) { Object.assign(this.viewport, v); if (this.mode === 'WELL_OVERVIEW' && this.blend >= 1) this.setMode('WELL_OVERVIEW', { force: true, duration: 0.6 }); }

  isTracking() { return TRACKING.has(this.mode); }

  setMode(mode, { instant = false, force = false, duration = 1.4, md, scale = 1 } = {}) {
    if (mode === this.mode && !force) return;
    const prev = this.mode;
    this.mode = mode;
    this.from.pos.copy(this.camera.position);
    this.from.target.copy(this.controls.target);
    if (TRACKING.has(mode)) {
      // each mode starts from its designed framing; user adjustments persist while it stays active
      this.offsetLocal.fromArray(this._narrow(TRACK_CFG[mode].offset)).multiplyScalar(scale);
      this.lookScale = scale;
      this.panLocal.set(0, 0, 0);
      if (md !== undefined) { this.trackMD = md; getQuaternion(md, this.q); }
    }
    this.tween?.kill();
    if (instant || this.reduceMotion || prev === null) { this.blend = 1; this._snap(md); return; }
    this.blend = 0;
    this.tween = gsap.to(this, { blend: 1, duration, ease: 'power2.inOut' });
  }

  /** Portrait / narrow screens need a little more distance to keep context. */
  _narrow(arr) {
    const a = this.viewport.freeWidth / Math.max(1, this.viewport.freeHeight);
    const k = a < 0.75 ? 1.25 : 1;
    return [arr[0], arr[1], arr[2] * k];
  }

  _snap(md) {
    const p = this._desired(md ?? this.trackMD, 1 / 60, true);
    this.camera.position.copy(p.pos);
    this.controls.target.copy(p.target);
    this.camera.lookAt(p.target);
    this.controls.update();
  }

  /** Desired pose for the current mode (without user adjustments for fixed poses). */
  _desired(md, dt, snap = false) {
    const m = this.mode;
    if (POSES[m]) {
      const P = POSES[m];
      const k = this.viewport.freeWidth / Math.max(1, this.viewport.freeHeight) < 0.8 ? 1.3 : 1;
      const t = _v.fromArray(P.target).clone();
      const pos = new Vector3().fromArray(P.pos).sub(t).multiplyScalar(k).add(t);
      return { target: t, pos };
    }
    if (m === 'WELL_OVERVIEW') return this._fitWell();
    // tracking
    const cfg = TRACK_CFG[m];
    const a = snap ? 1 : damp(14, dt);
    this.trackMD += (md - this.trackMD) * a;
    getQuaternion(clamp(this.trackMD, 0, TD), _q);
    this.q.slerp(_q, snap ? 1 : damp(6, dt));
    const target = getPosition(this.trackMD + cfg.look * (this.lookScale ?? 1)).add(_v.copy(this.panLocal).applyQuaternion(this.q));
    const pos = target.clone().add(_v.copy(this.offsetLocal).applyQuaternion(this.q));
    return { target, pos };
  }

  /** Fit the whole well (rig to TD + formation context) into the unobstructed viewport. */
  _fitWell() {
    const box = { x0: -700, x1: 4700, y0: -9050, y1: 260 };
    const { height, freeWidth, freeHeight, baseFov } = this.viewport;
    const f = (height / 2) / Math.tan((baseFov * Math.PI) / 360); // focal length in px (preserved by the view offset)
    const w = box.x1 - box.x0, h = box.y1 - box.y0;
    const d = Math.max((h * f) / (freeHeight * 0.92), (w * f) / (freeWidth * 0.92));
    const target = new Vector3((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, 0);
    return { target, pos: target.clone().add(new Vector3(0, 0, d)) };
  }

  update(dt, md) {
    const c = this.controls;
    if (this.blend < 1) {
      const d = this._desired(md, dt);
      this.camera.position.lerpVectors(this.from.pos, d.pos, this.blend);
      c.target.lerpVectors(this.from.target, d.target, this.blend);
      this.camera.lookAt(c.target);
      c.update();
      return;
    }
    if (this.isTracking()) {
      const d = this._desired(md, dt);
      this.camera.position.copy(d.pos);
      c.target.copy(d.target);
      c.update(); // applies user rotate / zoom / pan deltas on top
      // read user adjustments back into the local frame
      _qi.copy(this.q).invert();
      this.offsetLocal.copy(this.camera.position).sub(c.target).applyQuaternion(_qi);
      const pan = _v.copy(c.target).sub(d.target);
      if (pan.lengthSq() > 1e-8) this.panLocal.add(pan.applyQuaternion(_qi));
      return;
    }
    c.update();
  }

  /** Is the camera underground (for background / label sets)? */
  underground() { return this.camera.position.y < -2 || (this.controls.target.y < -40 && this.camera.position.y < 40); }
}

export { TRACKING, EOB };
