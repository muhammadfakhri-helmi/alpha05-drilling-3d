/**
 * Scene labels as ONE plain DOM layer above the canvas. Positions are
 * projected from world space on every rendered frame (no per-label React
 * roots, nothing mounts or unmounts inside the canvas), and every number in
 * them is a number printed on the slides.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { CASINGS, COMPLETION, FORMATIONS, HOLES, MW_WINDOWS, rad, type SectionId } from '../data/well.ts';
import { HAZARD_MARKS } from '../data/sections.ts';
import { posAt, normalAt, mdAtTvd, KOP } from '../data/trajectory.ts';
import type { SceneState, StationId } from '../data/content.ts';
import { RULER_X, RULER_TICKS, WALL_Z } from './Earth.tsx';

export interface SceneLabel { id: string; pos: [number, number, number]; text: string; tone: 'navy' | 'orange' | 'muted'; align: 'left' | 'right'; badge?: boolean }

const SECTION_IDX: Record<SectionId, number> = { s26: 0, s17: 1, s12: 2, s8: 3 };
const SURFACE_STATIONS: StationId[] = ['rig-overview', 'location-staging', 'rig-diverter', 'surface-test', 'panel'];

export function sceneLabels(state: SceneState, station: StationId, panel: boolean): SceneLabel[] {
  if (panel) return [];
  const out: SceneLabel[] = [];
  const L = (id: string, pos: [number, number, number], text: string, tone: SceneLabel['tone'] = 'navy', align: SceneLabel['align'] = 'left') =>
    out.push({ id, pos, text, tone, align });
  const surface = SURFACE_STATIONS.includes(station);

  // surface
  if (state.focus === 'cellar' && state.equipment === 'diverter') L('diverter', [90, 70, 60], '29-1/2-in × 500 psi diverter', 'orange');
  if (state.focus === 'separator') {
    const w = (x: number, y: number, z: number): [number, number, number] => [x * 12, y * 12, z * 12];
    L('sep', w(-70, 16, 60), 'Test separator', 'orange');
    L('choke', w(-28, 5, 22), 'Choke manifold', 'navy');
    L('flare', w(-104, 4, 100), 'Cleanup to flare', 'orange', 'right');
    L('stack', w(-150, 56, 108), 'Flare', 'muted');
    L('gas', w(-74, 20, 82), 'Gas to flare', 'navy');
    L('oil', w(-91, 13, 74), 'Oil meter and tank', 'navy', 'right');
    L('water', w(-91, 13, 44), 'Water meter and tank', 'navy', 'right');
    L('illus', w(-30, 3, 70), 'Illustrative layout', 'muted');
  }
  if (state.focus === 'site') L('staging', [1500, 420, 1500], 'Offloading & staging', 'orange');
  if (surface) return out;

  // well
  const builtIdx = state.built === 'none' ? -1 : state.built === 'all' ? 3 : SECTION_IDX[state.built];
  const focusIdx = state.focus && state.focus in SECTION_IDX ? SECTION_IDX[state.focus as SectionId] : -1;
  const drilledIdx = Math.max(builtIdx, focusIdx);
  const linerShown = state.built === 'all';
  if (drilledIdx >= 0) { const [x, y] = posAt(KOP); L('kop', [x + 130, y, 0], 'KOP 700 ft MD'); }
  CASINGS.forEach((c, i) => {
    if (c.key === 'c30') return;
    const shown = c.liner ? linerShown : builtIdx >= i - 1;
    const planned = !shown && i - 1 === focusIdx;
    if (!shown && !planned) return;
    const [x, y] = posAt(c.shoe); const [nx, ny] = normalAt(c.shoe);
    const d = rad(c.hole ?? c.od) + 40;
    L(c.key, [x + nx * d, y + ny * d, 0], c.liner ? '7-in liner · 9,604 ft MD' : `${c.label} shoe · ${c.shoe.toLocaleString('en-US')} ft MD`,
      planned || state.focus === c.section ? 'orange' : 'navy');
  });
  if (state.completion) { const [x, y] = posAt(COMPLETION.intakeMd); L('esp', [x + 130, y, 0], 'ESP · Intake 6,013 ft', 'orange'); }
  if (linerShown && (state.focus === 'liner' || state.focus === 'perfs')) { const [x, y] = posAt(9108); L('tol', [x - 150, y, 0], 'Liner top (TOL)', 'navy', 'right'); }
  if (linerShown && (state.focus === 'perfs' || state.completion)) { const [x, y] = posAt(9450); L('perf', [x - 150, y, 0], 'Perforation', 'orange', 'right'); }

  // cement job detail: lead and tail of the string being cemented (report Table 4.16)
  if (state.cementDetail) {
    const c = CASINGS.find((x) => x.section === state.focus);
    const txt: Record<string, [string, string]> = {
      c20: ['Lead 12 / 13.5 ppg', 'Tail 15.8 ppg'],
      c13: ['Lead 14 ppg', 'Tail 15.8 ppg'],
      c9: ['Lead 15.8–16.2 ppg', 'Tail 16.0–16.4 ppg'],
    };
    if (c && c.tailTop && txt[c.key]) {
      const hole = HOLES.find((h) => h.id === c.section)!;
      const at = (md: number, d: number): [number, number, number] => { const [x, y] = posAt(md); const [nx, ny] = normalAt(md); return [x - nx * d, y - ny * d, 0]; };
      const d = rad(c.hole ?? c.od) + 40;
      L('lead', at(Math.max(hole.top + 150, Math.min(c.tailTop - 120, c.shoe - 650)), d), txt[c.key][0], 'navy', 'right');
      L('tail', at(Math.max(hole.top + 300, (c.tailTop + c.shoe) / 2), d), txt[c.key][1], 'orange', 'right');
    }
  }
  // mud weight window markers (PPTX Table 3.1) for the section in view
  if (focusIdx >= 0 && !state.cementDetail && !state.hazards) {
    const sec = HOLES[focusIdx];
    MW_WINDOWS.filter((w) => w.to > sec.top && w.from <= sec.bottom).forEach((w, k) => {
      const md = Math.min(Math.max((w.from + w.to) / 2, sec.top + 100), sec.bottom - 50);
      const [x, y] = posAt(md); const [nx, ny] = normalAt(md);
      const d = rad(sec.holeIn) + 60;
      L(`mw${k}`, [x - nx * d, y - ny * d, 0], `MW window ${w.text}`, 'navy', 'right');
    });
  }
  // offset-well hazard intervals near the section in view (report Tables 3.3 / 3.4)
  if (state.hazards && focusIdx >= 0) {
    const sec = HOLES[focusIdx];
    HAZARD_MARKS.filter((h) => h.to > sec.top - 400 && h.from < sec.bottom).forEach((h, k) => {
      const md = Math.min(Math.max((h.from + h.to) / 2, sec.top), Math.min(sec.bottom, 9604));
      const [x, y] = posAt(md); const [nx, ny] = normalAt(md);
      const d = rad(sec.holeIn) + 110;
      L(`hz${k}`, [x + nx * d, y + ny * d + 160 - k * 110, 0], h.short, h.kind === 'clay' ? 'navy' : 'orange');
    });
  }

  // formations (anonymised) next to the well, and the TVD ruler
  FORMATIONS.slice(1).forEach((f) => {
    const x = posAt(mdAtTvd(f.tvd))[0] - rad(30) - 140;
    L(`fm-${f.name}`, [x, -f.tvd - 70, WALL_Z], f.name === 'Fm-G' ? 'Fm-G · reservoir' : f.name, 'muted', 'right');
  });
  RULER_TICKS.forEach(([t, txt], i) => L(`tvd${t}`, [RULER_X - 90, -t + (i === 2 ? 60 : i === 3 ? -40 : 0), 0], txt, 'navy', 'right'));
  L('tvd-title', [RULER_X - 90, -160, 0], 'TVD · true scale', 'muted', 'right');
  return out;
}

/** DOM side: one absolutely positioned element per label, positioned by <LabelProjector>. */
export const labelEls = new Map<string, HTMLDivElement>();

export function LabelLayer({ labels }: { labels: SceneLabel[] }) {
  return (
    <div className="label-layer" aria-hidden="true">
      {labels.map((l) => (
        <div
          key={l.id}
          ref={(el) => { if (el) labelEls.set(l.id, el); else labelEls.delete(l.id); }}
          className={`scene-label scene-label--${l.tone} scene-label--${l.align} ${l.badge ? 'scene-label--badge' : ''}`}
          style={{ visibility: 'hidden' }}
        >
          {l.text}
        </div>
      ))}
    </div>
  );
}

/** Canvas side: projects label anchors to screen pixels on every rendered frame. */
export function LabelProjector({ labels }: { labels: SceneLabel[] }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const v = useRef(new Vector3());
  useEffect(() => { invalidate(); }, [labels, invalidate]);
  useFrame(() => {
    for (const l of labels) {
      const el = labelEls.get(l.id);
      if (!el) continue;
      v.current.set(...l.pos).project(camera);
      const visible = v.current.z < 1 && Math.abs(v.current.x) < 1.2 && Math.abs(v.current.y) < 1.2;
      el.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) continue;
      const x = (v.current.x * 0.5 + 0.5) * size.width;
      const y = (-v.current.y * 0.5 + 0.5) * size.height;
      el.style.left = `${x.toFixed(1)}px`;
      el.style.top = `${y.toFixed(1)}px`;
    }
  });
  return null;
}
