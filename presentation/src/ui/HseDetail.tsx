import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { useStore, detailSteps } from '../store.ts';
import { HSE_STEPS, BANDS, bandOf, CONTROL_NAMES, LIKELIHOOD, SEVERITY, type HseStep, type ControlKey } from '../data/hse.ts';
import { Qr } from './Qr.tsx';
import { detailUrl } from '../config.ts';

const score = (x: { l: number; s: number }) => x.l * x.s;
const KEYS: ControlKey[] = ['EL', 'SB', 'EG', 'AD', 'PPE'];

/** 5x5 matrix with each work step as a numbered dot in its cell. */
export function StepMatrix({ steps, pick, selected, title, onPick }: {
  steps: HseStep[]; pick: 'initial' | 'residual'; selected: number | null; title: string; onPick?: (n: number) => void;
}) {
  const cells: ReactNode[] = [];
  for (let l = 5; l >= 1; l--) {
    cells.push(<div key={`a${l}`} className="matrix__axis">{l}</div>);
    for (let s = 1; s <= 5; s++) {
      const here = steps.filter((st) => st[pick].l === l && st[pick].s === s);
      cells.push(
        <div key={`${l}-${s}`} className={`matrix__cell t-${bandOf(l * s).tone}`}>
          <span className="matrix__score">{l * s}</span>
          <div className="matrix__dots">
            {here.map((st) => (
              <button
                type="button"
                key={st.n}
                className={`dot-step ${selected === st.n ? 'is-sel' : ''} ${selected != null && selected !== st.n ? 'is-faded' : ''}`}
                onClick={() => onPick?.(st.n)}
              >{st.n}</button>
            ))}
          </div>
        </div>,
      );
    }
  }
  cells.push(<div key="c" />);
  for (let s = 1; s <= 5; s++) cells.push(<div key={`b${s}`} className="matrix__axis">{s}</div>);
  return (
    <figure className="hse-matrix">
      <figcaption>{title}</figcaption>
      <div className="matrix matrix--steps">{cells}</div>
      <div className="note">Rows: likelihood · Columns: severity · Numbers in circles = work steps</div>
    </figure>
  );
}

function BandCounts({ steps, pick }: { steps: HseStep[]; pick: 'initial' | 'residual' }) {
  return (
    <div className="band-counts">
      {BANDS.map((b) => {
        const k = steps.filter((st) => bandOf(score(st[pick])).range === b.range).length;
        return (
          <div key={b.range} className={`band-count ${k ? '' : 'is-zero'}`}>
            <span className={`band-count__chip t-${b.tone}`}>{b.range}</span>
            <span className="band-count__k">{k}</span>
            <span className="band-count__lvl">{b.level}</span>
          </div>
        );
      })}
    </div>
  );
}

function ScoreChip({ x, big }: { x: { l: number; s: number }; big?: boolean }) {
  const b = bandOf(score(x));
  return <span className={`score-chip t-${b.tone} ${big ? 'score-chip--big' : ''}`}>{x.l} × {x.s} = {score(x)}</span>;
}

function StepList({ steps, selected, onPick }: { steps: HseStep[]; selected: number | null; onPick: (n: number) => void }) {
  return (
    <ol className="step-list">
      {steps.map((st) => (
        <li key={st.n}>
          <button type="button" className={`step-row ${selected === st.n ? 'is-sel' : ''}`} onClick={() => onPick(st.n)}>
            <span className="step-row__n">{st.n}</span>
            <span className="step-row__name">{st.name}</span>
            <span className="step-row__scores"><ScoreChip x={st.initial} /><span className="arrow-r" aria-hidden="true" /><ScoreChip x={st.residual} /></span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function StepCard({ st }: { st: HseStep }) {
  const before = bandOf(score(st.initial));
  const after = bandOf(score(st.residual));
  return (
    <div className="step-card">
      <div className="step-card__head">
        <div>
          <div className="kicker">Work step {st.n} · {st.phase}</div>
          <h2 className="step-card__title">{st.name}</h2>
        </div>
        <div className="qr-box">
          <Qr text={detailUrl('hse', st.n)} size="7.5rem" />
          <span>Scan for this step</span>
        </div>
      </div>
      <div className="before-after">
        <div className="ba">
          <div className="label">Before controls</div>
          <ScoreChip x={st.initial} big />
          <div className="ba__scale">{LIKELIHOOD[st.initial.l - 1]} × {SEVERITY[st.initial.s - 1]}</div>
          <div className="ba__band">{before.level} · {before.authority}</div>
        </div>
        <span className="arrow-r arrow-r--big" aria-hidden="true" />
        <div className="ba ba--after">
          <div className="label">After controls (residual)</div>
          <ScoreChip x={st.residual} big />
          <div className="ba__scale">{LIKELIHOOD[st.residual.l - 1]} × {SEVERITY[st.residual.s - 1]}</div>
          <div className="ba__band"><strong>{after.level}</strong> · approved by <strong>{after.authority}</strong></div>
        </div>
      </div>
      <div className="grid2">
        <div><div className="label">Hazards</div><div className="chips">{st.hazards.map((h) => <span key={h} className="chip">{h}</span>)}</div></div>
        <div><div className="label">Potential impact</div><div className="chips">{st.impacts.map((h) => <span key={h} className="chip chip--impact">{h}</span>)}</div></div>
      </div>
      <div>
        <div className="label">Controls applied (hierarchy of controls)</div>
        <div className="controls">
          {KEYS.map((k) => (
            <div key={k} className="control">
              <span className={`control__key ck-${k}`}>{k}</span>
              <span className="control__name">{CONTROL_NAMES[k]}</span>
              <span className="control__text">{st.controls[k]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Report detail panel (D): HSE register with before/after controls for the current slide. */
export function HseDetail() {
  const open = useStore((s) => s.detail);
  const slide = useStore((s) => s.slide);
  const sel = useStore((s) => s.hseStep);
  const pick = useStore((s) => s.selectHse);
  const list = detailSteps(slide);
  const steps = HSE_STEPS.filter((s) => list.includes(s.n));
  const st = sel != null ? HSE_STEPS.find((s) => s.n === sel) ?? null : null;
  const all = slide === 5;
  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key="hse"
          className="detail"
          data-detail="hse"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="panel__head">
            <div>
              <div className="kicker">HSE detail · risk register</div>
              <h1 className="title">Before &amp; after <span className="accent">controls</span></h1>
            </div>
            <div className="detail__keys"><span className="kbd">Enter</span> next step <span className="kbd">Esc</span> {st ? 'overview' : 'close'}</div>
          </div>
          <div className="detail__body">
            <StepList steps={steps} selected={sel} onPick={pick} />
            {st ? (
              <StepCard st={st} />
            ) : (
              <div className="overview">
                <div className="overview__mats">
                  <div><StepMatrix steps={steps} pick="initial" selected={null} title="Before controls" onPick={pick} /><BandCounts steps={steps} pick="initial" /></div>
                  <span className="arrow-r arrow-r--big" aria-hidden="true" />
                  <div><StepMatrix steps={steps} pick="residual" selected={null} title="After controls (residual)" onPick={pick} /><BandCounts steps={steps} pick="residual" /></div>
                </div>
                <div className="overview__foot">
                  <div className="overview__notes">
                    <div className="label">How the controls work</div>
                    <ul className="bullets bullets--sm">
                      <li>Each step is scored likelihood × severity before and after controls.</li>
                      <li>Controls follow the hierarchy: Elimination, Substitution, Engineering, Administrative, PPE.</li>
                      <li>Controls mainly lower the likelihood; the severity of the hazard stays.</li>
                      <li>Residual risk sets who approves the work.</li>
                    </ul>
                    {!all && <div className="note">Steps for this slide. All 18 steps: slide 5 · D</div>}
                  </div>
                  <div className="qr-box">
                    <Qr text={detailUrl('hse')} size="8.5rem" />
                    <span>Scan for the full register</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="hud__footer"><span>ALPHA-05 DEVELOPMENT WELL</span><span className="role">Speaker · HSE</span><span>Drilling program, Chapter 2</span></div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
