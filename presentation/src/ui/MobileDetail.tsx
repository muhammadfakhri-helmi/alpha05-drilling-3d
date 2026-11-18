import { useEffect, useState } from 'react';
import { HSE_STEPS, BANDS, bandOf, CONTROL_NAMES, LIKELIHOOD, SEVERITY, type ControlKey } from '../data/hse.ts';
import { topicsFor } from '../data/sections.ts';
import { slideByN } from '../data/content.ts';
import { BlockView } from './DetailPanel.tsx';

const KEYS: ControlKey[] = ['EL', 'SB', 'EG', 'AD', 'PPE'];
const score = (x: { l: number; s: number }) => x.l * x.s;

/** Phone page with the report detail of one slide: ?view=detail&slide=n[&topic=id]. */
function MobileSlideDetail({ slide, topic }: { slide: number; topic: string | null }) {
  const sl = slideByN(slide);
  const topics = topicsFor(slide).filter((t) => t.id !== 'hse');
  useEffect(() => {
    document.title = `ALPHA-05 ${sl.title} detail`;
    if (topic) document.getElementById(`topic-${topic}`)?.scrollIntoView({ block: 'start' });
  }, [topic, sl.title]);
  return (
    <main className="m-detail">
      <header className="m-head">
        <div className="kicker">ALPHA-05 · {sl.kicker}</div>
        <h1>{sl.title}</h1>
        <nav className="m-toc">
          {topics.map((t) => <a key={t.id} href={`#topic-${t.id}`}>{t.label}</a>)}
          <a href="?view=detail&topic=hse">HSE register</a>
        </nav>
      </header>
      {topics.map((t) => (
        <section key={t.id} id={`topic-${t.id}`} className="m-topic">
          <h2>{t.title}</h2>
          <div className="note">Drilling program · {t.source}</div>
          {t.blocks.map((b, i) => <div key={i} className="m-block"><BlockView b={b} /></div>)}
        </section>
      ))}
      <footer className="m-foot">ALPHA-05 Drilling Program</footer>
    </main>
  );
}

/** Phone page opened from the QR codes: ?view=detail&topic=hse[&step=n] or &slide=n. */
export function MobileDetail() {
  const params = new URLSearchParams(location.search);
  const slideParam = Number(params.get('slide'));
  if (slideParam && topicsFor(slideParam).some((t) => t.id !== 'hse')) return <MobileSlideDetail slide={slideParam} topic={params.get('topic')} />;
  return <HseRegisterPage params={params} />;
}

function HseRegisterPage({ params }: { params: URLSearchParams }) {
  const first = Number(params.get('step')) || null;
  const [open, setOpen] = useState<number | null>(first);
  useEffect(() => {
    document.title = 'ALPHA-05 HSE detail';
    if (first) document.getElementById(`step-${first}`)?.scrollIntoView({ block: 'start' });
  }, [first]);
  const count = (pick: 'initial' | 'residual', range: string) => HSE_STEPS.filter((s) => bandOf(score(s[pick])).range === range).length;
  return (
    <main className="m-detail">
      <header className="m-head">
        <div className="kicker">ALPHA-05 · HSE detail</div>
        <h1>Risk register: before &amp; after controls</h1>
        <p>18 work steps scored likelihood × severity before and after controls. Residual risk sets the approval authority.</p>
      </header>
      <table className="m-bands">
        <thead><tr><th>Band</th><th>Before</th><th>After</th><th>Approval</th></tr></thead>
        <tbody>
          {BANDS.map((b) => (
            <tr key={b.range}>
              <td><span className={`band-count__chip t-${b.tone}`}>{b.range}</span> {b.level}</td>
              <td>{count('initial', b.range)}</td>
              <td><strong>{count('residual', b.range)}</strong></td>
              <td>{b.authority}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ol className="m-steps">
        {HSE_STEPS.map((st) => {
          const isOpen = open === st.n;
          const a = bandOf(score(st.residual));
          return (
            <li key={st.n} id={`step-${st.n}`} className={isOpen ? 'is-open' : ''}>
              <button type="button" className="m-step" onClick={() => setOpen(isOpen ? null : st.n)} aria-expanded={isOpen}>
                <span className="step-row__n">{st.n}</span>
                <span className="m-step__name">{st.name}</span>
                <span className="m-step__scores">
                  <span className={`score-chip t-${bandOf(score(st.initial)).tone}`}>{score(st.initial)}</span>
                  <span className="arrow-r" aria-hidden="true" />
                  <span className={`score-chip t-${a.tone}`}>{score(st.residual)}</span>
                </span>
              </button>
              {isOpen && (
                <div className="m-body">
                  <div className="m-ba">
                    <div><div className="label">Before</div>{st.initial.l} × {st.initial.s} = {score(st.initial)}<br /><small>{LIKELIHOOD[st.initial.l - 1]} × {SEVERITY[st.initial.s - 1]}</small></div>
                    <div><div className="label">After</div>{st.residual.l} × {st.residual.s} = {score(st.residual)}<br /><small>{LIKELIHOOD[st.residual.l - 1]} × {SEVERITY[st.residual.s - 1]}</small></div>
                  </div>
                  <p className="m-auth">{a.level} · approved by <strong>{a.authority}</strong></p>
                  <div className="label">Hazards</div>
                  <div className="chips">{st.hazards.map((h) => <span key={h} className="chip">{h}</span>)}</div>
                  <div className="label">Potential impact</div>
                  <div className="chips">{st.impacts.map((h) => <span key={h} className="chip chip--impact">{h}</span>)}</div>
                  <div className="label">Controls applied</div>
                  {KEYS.map((k) => (
                    <div key={k} className="control">
                      <span className={`control__key ck-${k}`}>{k}</span>
                      <span className="control__name">{CONTROL_NAMES[k]}</span>
                      <span className="control__text">{st.controls[k]}</span>
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <footer className="m-foot">ALPHA-05 Drilling Program · Chapter 2 HSE &amp; regulatory requirements</footer>
    </main>
  );
}
