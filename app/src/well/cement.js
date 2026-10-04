/**
 * Cement visualisation.
 *
 * A cement job is drawn along its flow path:
 *     inside the casing (or running string + liner)  ↓
 *     out of the shoe                                ↺
 *     up the annulus to TOC                          ↑
 * Each slurry stage is a slug on that path; displacement fluid follows the
 * tail; bottom/top wiper plugs ride on the slug ends. Installed (cemented)
 * strings keep their annulus sheath and, until drilled out, the shoe track.
 */
import { Group, Mesh, CylinderGeometry, MeshStandardMaterial } from 'three';
import { CASINGS, SHOE_TRACK } from '../engineeringData.js';
import { rad, CELLAR_DEPTH } from '../constants.js';
import { Mat } from '../utils/materials.js';
import { TrajectoryTube } from './tubular.js';
import { placeAtMD } from '../trajectory.js';

const PREV_SHOE_9625 = 9259;

/** Annulus outer radius along MD for each string (hole, or previous casing ID inside the lap). */
function annulusRadius(c) {
  if (c.liner) return (md) => (md > PREV_SHOE_9625 ? rad(c.hole) * 0.985 : rad(9.625) * 0.93);
  return () => rad(c.hole) * 0.985;
}
/** Inside-path radius: casing ID, or drill pipe ID above the liner top. */
function insideRadius(c) {
  if (c.liner) return (md) => (md < c.top ? rad(5) * 0.8 : rad(c.od) * 0.86);
  return () => rad(c.od) * 0.86;
}

export class CementSystem {
  constructor(scene) {
    this.group = new Group();
    this.group.name = 'cement';
    scene.add(this.group);
    this.jobs = {};
    const plugGeo = new CylinderGeometry(1, 1, 1.6, 20);
    for (const c of CASINGS) {
      if (!c.stages) continue;
      const breaks = c.liner ? [{ md: c.top, split: true }, { md: PREV_SHOE_9625, split: true }] : null;
      const job = { def: c, stages: [], annR: annulusRadius(c), inR: insideRadius(c) };
      const pick = { id: `${c.key}-cement`, title: `${c.name} cement`, kind: 'cement', info: 'Cement sheath: bonds the casing to the formation and isolates zones behind pipe.', interval: () => [c.toc, c.shoe] };
      for (const st of c.stages) {
        const mat = Mat.cement(st.color);
        const inside = new TrajectoryTube({ radius: job.inR, material: mat, radialSegments: 20, sampleStep: 8, straightStep: 200, breaks, maxLength: c.shoe + 50 });
        const ann = new TrajectoryTube({ radius: job.annR, material: mat, radialSegments: 28, sampleStep: 8, straightStep: 200, breaks, maxLength: c.shoe + 50 });
        ann.mesh.userData.pick = pick; inside.mesh.userData.pick = pick;
        this.group.add(inside.mesh, ann.mesh);
        job.stages.push({ ...st, inside, ann, mat });
      }
      job.disp = new TrajectoryTube({ radius: job.inR, material: Mat.displacement(), radialSegments: 20, sampleStep: 8, straightStep: 200, breaks, maxLength: c.shoe + 50 });
      job.track = new TrajectoryTube({ radius: rad(c.od) * 0.86, material: Mat.cement(c.stages[c.stages.length - 1].color), radialSegments: 20, sampleStep: 8, straightStep: 100, maxLength: SHOE_TRACK + 5 });
      job.track.mesh.userData.pick = { id: `${c.key}-track`, title: 'Shoe track cement', kind: 'cement', info: 'Cement left between float collar and shoe; drilled out at the start of the next section.', interval: () => [c.shoe - SHOE_TRACK, c.shoe] };
      job.bottomPlug = new Mesh(plugGeo, new MeshStandardMaterial({ color: '#C0453A', roughness: 0.6 }));
      job.topPlug = new Mesh(plugGeo, new MeshStandardMaterial({ color: '#1F2124', roughness: 0.7 }));
      for (const p of [job.bottomPlug, job.topPlug]) { p.visible = false; this.group.add(p); }
      this.group.add(job.disp.mesh, job.track.mesh);
      this.jobs[c.key] = job;
    }
  }

  /** Map a path coordinate x (0 = inside top) to [domain, md]. */
  static pathMD(job, cem, x) {
    if (x <= cem.Li) return ['in', cem.insideTop + x];
    return ['ann', job.def.shoe - (x - cem.Li)];
  }

  update(S) {
    for (const key in this.jobs) {
      const job = this.jobs[key];
      const c = job.def;
      const cs = key === 'c7' ? S.liner : S.casings[key];
      const active = S.cement && S.cement.key === key;
      if (active) { this._drawJob(job, S.cement); continue; }
      this._hidePlugs(job); job.disp.setVisible(false);
      const cemented = !!(cs && cs.cemented);
      if (!cemented) { for (const st of job.stages) { st.inside.setVisible(false); st.ann.setVisible(false); } job.track.setVisible(false); continue; }
      // final annulus sheath, stages stacked from shoe (tail) up to TOC (lead)
      let top = c.toc;
      for (const st of job.stages) {
        st.ann.setInterval(top, Math.min(c.shoe, top + st.len));
        top += st.len;
        st.inside.setVisible(false);
      }
      const trackVisible = key === 'c7' ? S.holeMD <= c.shoe + 1 : cs.shoeTrack;
      if (trackVisible) job.track.setInterval(c.shoe - SHOE_TRACK, c.shoe - 3.4); else job.track.setVisible(false);
    }
  }

  _drawJob(job, cem) {
    const c = job.def;
    const total = cem.Li + cem.La;
    // stages: first pumped (front) … last (tail)
    let x1 = cem.front;
    for (const st of job.stages) {
      const x0 = x1 - st.len;
      const a = Math.max(0, x0), b = Math.min(total, x1);
      // inside portion
      const ia = a, ib = Math.min(b, cem.Li);
      if (ib > ia) st.inside.setInterval(cem.insideTop + ia, cem.insideTop + ib); else st.inside.setVisible(false);
      // annulus portion
      const aa = Math.max(a, cem.Li), ab = b;
      if (ab > aa) st.ann.setInterval(c.shoe - (ab - cem.Li), c.shoe - (aa - cem.Li)); else st.ann.setVisible(false);
      x1 = x0;
    }
    // displacement fluid behind the tail
    const fc = cem.Li - SHOE_TRACK; // float collar on the path
    if (cem.tail > 0) job.disp.setInterval(cem.insideTop, cem.insideTop + Math.min(cem.tail, fc)); else job.disp.setVisible(false);
    // plugs
    const rIn = job.inR;
    if (cem.front < cem.Li) {
      const md = cem.insideTop + cem.front;
      job.bottomPlug.visible = true; placeAtMD(job.bottomPlug, md); job.bottomPlug.scale.set(rIn(md), 1, rIn(md));
    } else job.bottomPlug.visible = false;
    if (cem.tail > 0) {
      const md = cem.insideTop + Math.min(cem.tail, cem.Li - SHOE_TRACK);
      job.topPlug.visible = true; placeAtMD(job.topPlug, md); job.topPlug.scale.set(rIn(md), 1, rIn(md));
    } else job.topPlug.visible = false;
    if (cem.done || cem.tail > fc) job.track.setInterval(c.shoe - SHOE_TRACK, c.shoe - 3.4); else job.track.setVisible(false);
  }

  _hidePlugs(job) { job.bottomPlug.visible = false; job.topPlug.visible = false; }
}

export { annulusRadius, insideRadius, CELLAR_DEPTH };
