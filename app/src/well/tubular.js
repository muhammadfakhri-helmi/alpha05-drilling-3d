/**
 * Curved tubulars that follow the master trajectory.
 *
 * TrajectoryTube owns a pre-allocated BufferGeometry whose rings are placed
 * with the trajectory engine at adaptively sampled MDs. Calling
 * setInterval(top, bottom) re-places the rings in place (no allocation), so
 * moving strings (drill pipe, BHA components, casing being run, tubing…) are
 * always exactly continuous along the curved hole – there is no rigid,
 * tangent-aligned group and therefore no kink in the build section.
 */
import {
  BufferGeometry, BufferAttribute, Mesh, InstancedMesh, Matrix4, Vector3, Quaternion, Color,
  DynamicDrawUsage, Sphere, LineSegments, LineBasicMaterial, Plane,
} from 'three';
import { survey, sampleMDs, KOP, EOB, TD, getPosition, getQuaternion } from '../trajectory.js';
import { surfaceTaper, CELLAR_DEPTH } from '../constants.js';

/** Section edges are drawn only where the cutaway actually cuts (below the cellar). */
const EDGE_CLIP = [new Plane(new Vector3(0, -1, 0), -CELLAR_DEPTH)];
const edgeMats = new Map();
function edgeMaterial(color, opacity) {
  const k = `${color}${opacity}`;
  if (!edgeMats.has(k)) edgeMats.set(k, new LineBasicMaterial({ color, transparent: opacity < 1, opacity, clippingPlanes: EDGE_CLIP, depthWrite: false }));
  return edgeMats.get(k);
}

const _s = {};
const _ring = [];

export class TrajectoryTube {
  /**
   * @param {object} o
   * @param {number|function(md):number} o.radius   world radius (ft) or radius(md)
   * @param {import('three').Material} o.material
   * @param {number} [o.radialSegments=16]
   * @param {number} [o.sampleStep=8]      ring spacing in the build section (ft)
   * @param {number} [o.straightStep=150]  ring spacing on straight sections (ft)
   * @param {Array}  [o.breaks]            extra MDs (or {md, split:true}) always sampled
   * @param {function(md, Color)} [o.colorFn] per-ring vertex colour
   * @param {number} [o.uvScale=10]        ft per texture repeat along the pipe
   * @param {number} [o.maxLength]         longest interval that will ever be requested
   */
  constructor(o) {
    this.radius = o.radius;
    this.radialSegments = o.radialSegments ?? 16;
    this.sampleStep = o.sampleStep ?? 8;
    this.straightStep = o.straightStep ?? 150;
    this.breaks = o.breaks ?? null;
    this.colorFn = o.colorFn ?? null;
    this.uvScale = o.uvScale ?? 10;
    this.uvAnchor = 0;
    /** In-plane offset of the tube axis along the trajectory normal (e.g. an ESP cable strapped to tubing). */
    this.offsetN = o.offsetN ?? 0;
    /** Taper to true scale above the cellar (see constants.surfaceTaper). */
    this.taper = o.taper ?? true;
    const maxLen = o.maxLength ?? TD + 400;
    const curved = Math.min(maxLen, EOB - KOP);
    this.capacity = Math.ceil(curved / this.sampleStep) + Math.ceil(maxLen / this.straightStep)
      + 2 * (this.breaks ? this.breaks.length : 0) + 12;
    this.geometry = new BufferGeometry();
    this._alloc(this.capacity);
    this.mesh = new Mesh(this.geometry, o.material);
    this.mesh.frustumCulled = false;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.name = o.name ?? 'tube';
    this.mesh.visible = false;
    this.top = NaN; this.bottom = NaN;
    this._mds = [];
    // optional thin outline along the two cut edges (technical-drawing look)
    this.edges = null;
    if (o.edgeColor) {
      const eg = new BufferGeometry();
      eg.setAttribute('position', new BufferAttribute(new Float32Array(this.capacity * 12), 3).setUsage(DynamicDrawUsage));
      this.edges = new LineSegments(eg, edgeMaterial(o.edgeColor, o.edgeOpacity ?? 0.55));
      this.edges.frustumCulled = false;
      this.edges.renderOrder = 1;
      this.mesh.add(this.edges);
    }
  }

  _alloc(rings) {
    const rs = this.radialSegments, verts = rings * (rs + 1);
    const g = this.geometry;
    const pos = new BufferAttribute(new Float32Array(verts * 3), 3).setUsage(DynamicDrawUsage);
    const nor = new BufferAttribute(new Float32Array(verts * 3), 3).setUsage(DynamicDrawUsage);
    const uv = new BufferAttribute(new Float32Array(verts * 2), 2).setUsage(DynamicDrawUsage);
    g.setAttribute('position', pos); g.setAttribute('normal', nor); g.setAttribute('uv', uv);
    if (this.colorFn) g.setAttribute('color', new BufferAttribute(new Float32Array(verts * 3), 3).setUsage(DynamicDrawUsage));
    const idx = new (verts > 65535 ? Uint32Array : Uint16Array)((rings - 1) * rs * 6);
    let k = 0;
    for (let i = 0; i < rings - 1; i++) {
      for (let j = 0; j < rs; j++) {
        const a = i * (rs + 1) + j, b = (i + 1) * (rs + 1) + j, c = b + 1, d = a + 1;
        idx[k++] = a; idx[k++] = b; idx[k++] = d;
        idx[k++] = b; idx[k++] = c; idx[k++] = d;
      }
    }
    g.setIndex(new BufferAttribute(idx, 1));
    g.boundingSphere = new Sphere();
    this.capacity = rings;
  }

  /** Anchor texture coordinates to a moving point (e.g. the shoe) so patterns travel with the pipe. */
  setUVAnchor(md) { this.uvAnchor = md; }

  setInterval(top, bottom, force = false) {
    if (!(bottom - top > 0.05)) { this.mesh.visible = false; this.top = this.bottom = NaN; return this; }
    this.mesh.visible = true;
    if (!force && top === this.top && bottom === this.bottom && this._anchorUsed === this.uvAnchor) return this;
    this.top = top; this.bottom = bottom; this._anchorUsed = this.uvAnchor;
    const mds = sampleMDs(top, bottom, { step: this.sampleStep, straightStep: this.straightStep, breaks: this.breaks }, this._mds);
    if (mds.length > this.capacity) this._alloc(mds.length + 16);
    const rs = this.radialSegments;
    const g = this.geometry;
    const P = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv.array;
    const C = this.colorFn ? g.attributes.color.array : null;
    if (_ring.length !== rs + 1) { _ring.length = 0; for (let j = 0; j <= rs; j++) { const v = (j / rs) * Math.PI * 2; _ring.push([Math.cos(v), Math.sin(v)]); } }
    const col = new Color();
    const rFn = typeof this.radius === 'function' ? this.radius : null;
    let v = 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, maxR = 0;
    for (let i = 0; i < mds.length; i++) {
      const md = mds[i];
      survey(md, _s);
      const nx = Math.cos(_s.inc), ny = Math.sin(_s.inc);
      const px = _s.vs + nx * this.offsetN, py = -_s.tvd + ny * this.offsetN;
      const r = (rFn ? rFn(md) : this.radius) * (this.taper ? surfaceTaper(md) : 1);
      if (C) this.colorFn(md, col);
      const u = (md - this.uvAnchor) / this.uvScale;
      for (let j = 0; j <= rs; j++) {
        const [c, s] = _ring[j];
        // radial direction = c·N + s·B  (B = +Z)
        const dx = c * nx, dy = c * ny, dz = s;
        P[v * 3] = px + r * dx; P[v * 3 + 1] = py + r * dy; P[v * 3 + 2] = r * dz;
        N[v * 3] = dx; N[v * 3 + 1] = dy; N[v * 3 + 2] = dz;
        U[v * 2] = u; U[v * 2 + 1] = j / rs;
        if (C) { C[v * 3] = col.r; C[v * 3 + 1] = col.g; C[v * 3 + 2] = col.b; }
        v++;
      }
      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (py < minY) minY = py; if (py > maxY) maxY = py;
      if (r > maxR) maxR = r;
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
    g.attributes.uv.needsUpdate = true;
    if (C) g.attributes.color.needsUpdate = true;
    g.setDrawRange(0, (mds.length - 1) * rs * 6);
    if (this.edges) this._updateEdges(mds.length);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    g.boundingSphere.center.set(cx, cy, 0);
    g.boundingSphere.radius = Math.hypot(maxX - cx, maxY - cy) + maxR;
    return this;
  }

  _updateEdges(rings) {
    const P = this.geometry.attributes.position.array;
    const rs = this.radialSegments, half = rs / 2;
    let attr = this.edges.geometry.attributes.position;
    if (attr.count < (rings - 1) * 4) { attr = new BufferAttribute(new Float32Array((rings + 16) * 12), 3).setUsage(DynamicDrawUsage); this.edges.geometry.setAttribute('position', attr); }
    const E = attr.array;
    let k = 0;
    const put = (vi) => { E[k++] = P[vi * 3]; E[k++] = P[vi * 3 + 1]; E[k++] = 0; };
    for (let i = 0; i < rings - 1; i++) {
      const a = i * (rs + 1), b = (i + 1) * (rs + 1);
      put(a); put(b); put(a + half); put(b + half);
    }
    attr.needsUpdate = true;
    this.edges.geometry.setDrawRange(0, (rings - 1) * 4);
  }

  setVisible(v) { if (!v) this.mesh.visible = false; return this; }
  dispose() { this.geometry.dispose(); }
}

/** Convenience factory matching the documented helper signature. */
export function createTubularAlongTrajectory({ mdStart, mdEnd, outerRadius, material, radialSegments = 16, sampleStep = 8, ...rest }) {
  const t = new TrajectoryTube({ radius: outerRadius, material, radialSegments, sampleStep, ...rest });
  t.setInterval(mdStart, mdEnd);
  return t;
}

/**
 * Instanced repeated features (couplings, tool joints, centralisers) placed
 * at MDs along the trajectory. One draw call per string.
 */
const _m = new Matrix4(), _p = new Vector3(), _q = new Quaternion(), _sc = new Vector3(1, 1, 1);
export class JointInstancer {
  constructor({ geometry, material, capacity, name = 'joints' }) {
    this.mesh = new InstancedMesh(geometry, material, capacity);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.name = name;
    this.capacity = capacity;
  }
  /** Place instances every `spacing` ft above `fromMD` (exclusive) while MD > topMD. */
  layout(fromMD, topMD, spacing, { includeFrom = false, bottomLimit = Infinity } = {}) {
    let n = 0;
    for (let md = includeFrom ? fromMD : fromMD - spacing; md > topMD && n < this.capacity; md -= spacing) {
      if (md > bottomLimit) continue;
      getPosition(md, _p); getQuaternion(md, _q);
      const tp = surfaceTaper(md);
      _sc.set(tp, 1, tp);
      _m.compose(_p, _q, _sc);
      this.mesh.setMatrixAt(n++, _m);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.visible = n > 0;
    if (n > 0) this.mesh.computeBoundingSphere();
    return n;
  }
  hide() { this.mesh.count = 0; this.mesh.visible = false; }
}
