/**
 * 2D fallback visual: the same well, drawn as an SVG section from the same
 * trajectory engine and casing data (used when WebGL is unavailable or with V).
 */
import { useMemo } from 'react';
import { CASINGS, HOLES, FORMATIONS, COMPLETION } from '../data/well.ts';
import { posAt, normalAt, sampleMDs, KOP } from '../data/trajectory.ts';
import type { SceneState } from '../data/content.ts';
import { C } from '../theme.ts';

const K = 1.2; // extra exaggeration for the small 2D drawing
const r = (inch: number) => (inch / 24) * 72 * K;
const side = (a: number, b: number, rr: number, s: 1 | -1) =>
  sampleMDs(a, b, 40, 400).map((md) => {
    const [x, y] = posAt(md); const [nx, ny] = normalAt(md);
    return `${(x + nx * rr * s).toFixed(1)},${(-(y + ny * rr * s)).toFixed(1)}`;
  });
const band = (a: number, b: number, r1: number, r2: number) => {
  const outer = side(a, b, r2, 1), inner = side(a, b, r1, 1).reverse();
  const outer2 = side(a, b, r2, -1), inner2 = side(a, b, r1, -1).reverse();
  return [`M${outer.join(' L')} L${inner.join(' L')} Z`, `M${outer2.join(' L')} L${inner2.join(' L')} Z`];
};

export function Schematic({ state }: { state: SceneState }) {
  const idx: Record<string, number> = { s26: 0, s17: 1, s12: 2, s8: 3 };
  const builtIdx = state.built === 'none' ? -1 : state.built === 'all' ? 3 : idx[state.built];
  const focusIdx = state.focus && state.focus in idx ? idx[state.focus] : -1;
  const drilledIdx = Math.max(builtIdx, focusIdx);
  const paths = useMemo(() => ({
    holes: HOLES.map((h) => band(h.top, h.bottom, 0, r(h.holeIn))),
    casing: CASINGS.map((c) => ({ c, l: side(c.liner ? c.top : 0, c.shoe, r(c.od), 1), rr: side(c.liner ? c.top : 0, c.shoe, r(c.od), -1) })),
    axis: side(0, 9604, 0, 1),
  }), []);
  const label = (md: number, txt: string, color: string = C.navy, dx = 70) => {
    const [x, y] = posAt(md);
    return <text x={x + dx} y={-y} fill={color} fontSize={120} fontWeight={700} dominantBaseline="middle">{txt}</text>;
  };
  return (
    <svg viewBox="-1600 -300 6600 9300" role="img" aria-label="Well schematic">
      {FORMATIONS.map((f, i) => {
        const bot = i < FORMATIONS.length - 1 ? FORMATIONS[i + 1].tvd : 9000;
        return (
          <g key={f.name}>
            <rect x={-1600} y={f.tvd} width={6600} height={bot - f.tvd} fill={f.color} />
            <text x={-1550} y={f.tvd + 150} fontSize={110} fontWeight={600} fill={C.slate}>{f.name}</text>
          </g>
        );
      })}
      <line x1={-1600} x2={5000} y1={0} y2={0} stroke={C.slate} strokeWidth={14} />
      <polyline points={paths.axis.join(' ')} fill="none" stroke={C.navy} strokeWidth={10} strokeDasharray="60 45" opacity={0.5} />
      {paths.holes.map((p, i) => i <= drilledIdx && p.map((d, k) => <path key={`${i}${k}`} d={d} fill={C.rock} />))}
      {paths.casing.map(({ c, l, rr }, i) => {
        const shown = c.key === 'c30' || (c.liner ? state.built === 'all' : builtIdx >= i - 1);
        const planned = !shown && i - 1 === focusIdx;
        if (!shown && !planned) return null;
        const col = planned ? C.blue : C.navy;
        return (
          <g key={c.key} opacity={planned ? 0.5 : 1}>
            <polyline points={l.join(' ')} fill="none" stroke={col} strokeWidth={16} />
            <polyline points={rr.join(' ')} fill="none" stroke={col} strokeWidth={16} />
          </g>
        );
      })}
      {state.completion && <polyline points={side(0, COMPLETION.intakeMd, 0, 1).join(' ')} fill="none" stroke={C.blue} strokeWidth={22} />}
      {state.completion && (() => { const [x, y] = posAt(COMPLETION.intakeMd); return <rect x={x - 30} y={-y - 40} width={60} height={110} fill={C.orange} />; })()}
      {focusIdx >= 0 && band(HOLES[focusIdx].top, HOLES[focusIdx].bottom, r(HOLES[focusIdx].holeIn), r(HOLES[focusIdx].holeIn) + 30).map((d, k) => <path key={k} d={d} fill={C.orange} />)}
      {drilledIdx >= 0 && label(KOP, 'KOP 700 ft MD')}
      {CASINGS.map((c, i) => {
        if (c.key === 'c30') return null;
        const shown = c.liner ? state.built === 'all' : builtIdx >= i - 1;
        if (!shown && i - 1 !== focusIdx) return null;
        return <g key={c.key}>{label(c.shoe, c.liner ? '7-in liner · 9,604 ft MD' : `${c.label} shoe · ${c.shoe.toLocaleString('en-US')} ft MD`, i - 1 === focusIdx ? C.orange : C.navy, 140)}</g>;
      })}
      {state.completion && label(COMPLETION.intakeMd, 'ESP · Intake 6,013 ft', C.orange, 120)}
    </svg>
  );
}
