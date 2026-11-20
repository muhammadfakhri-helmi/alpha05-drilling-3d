import type { ReactNode } from 'react';
import type { Slide, Table } from '../data/content.ts';
import { useStore } from '../store.ts';

export function Title({ slide }: { slide: Slide }) {
  const { title, accent } = slide;
  if (!accent || !title.endsWith(accent)) return <h1 className="title">{title}</h1>;
  return <h1 className="title">{title.slice(0, title.length - accent.length)}<span className="accent">{accent}</span></h1>;
}

export function Tbl({ t, size }: { t: Table; size?: 'lg' }) {
  return (
    <table className={`tbl ${size ? 'tbl--lg' : ''}`}>
      {t.title && <caption>{t.title}</caption>}
      <thead><tr>{t.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{t.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{j === 0 && t.head.length > 2 ? <strong>{c}</strong> : c}</td>)}</tr>)}</tbody>
    </table>
  );
}

const Bullets = ({ items, sm }: { items: string[]; sm?: boolean }) => (
  <ul className={`bullets ${sm ? 'bullets--sm' : ''}`}>{items.map((p) => <li key={p}>{p}</li>)}</ul>
);
const Key = ({ value, label }: { value: string; label: string }) => (
  <div className="key"><span className="key__value">{value}</span><span className="key__label">{label}</span></div>
);
const FigureChip = ({ src, caption }: { src: string; caption: string }) => {
  const toggle = useStore((s) => s.toggleFigure);
  return (
    <button className="figure-chip" onClick={toggle} type="button">
      <img src={src} alt="" />{caption}<span className="kbd">I</span>
    </button>
  );
};

/** Which block of the slide is spoken now (null when speaker steps are off). */
export function useActiveBlock(slide: Slide): string | null {
  const step = useStore((s) => s.step);
  const stepMode = useStore((s) => s.stepMode);
  const backup = useStore((s) => s.backup);
  if (!stepMode || backup || slide.steps.length < 2) return null;
  return slide.steps[Math.min(step, slide.steps.length - 1)].focusBlock ?? null;
}

/** Body of a slide. `compact` = HUD card on 3D slides. */
export function SlideBody({ slide }: { slide: Slide }): ReactNode {
  const active = useActiveBlock(slide);
  const dim = (id: string) => (active == null ? '' : active.split(',').includes(id) ? 'is-active' : 'is-dim');

  switch (slide.layout) {
    case 'cover':
      return (
        <>
          <div className="kicker">{slide.eyebrow}</div>
          <div className="cover-title">{slide.title}<br />{slide.title2}</div>
          <div className="cover-sub">{slide.subtitle}</div>
          <div className="team">{slide.team.map((t) => <span key={t}>{t}</span>)}</div>
          <div className="date">{slide.date}</div>
        </>
      );
    case 'summary':
      return (
        <>
          <div className="tile"><div className="label">Mission</div><div className="tile__value">{slide.mission}</div></div>
          <Key value={slide.key.value} label={slide.key.label} />
          <div className="grid3">
            {slide.facts.map((f) => <div className="tile" key={f.label}><div className="label">{f.label}</div><div className="tile__value">{f.value}</div></div>)}
            <div className="tile"><div className="label">{slide.casingProgram.label}</div><div className="tile__value">{slide.casingProgram.value}</div></div>
          </div>
          <div>
            <div className="label" style={{ marginBottom: '0.6rem' }}>Success criteria</div>
            <div className="grid2">
              {slide.criteria.map((c, i) => <div key={c} className="flow__item"><span className="num">{i + 1}</span><span>{c}</span></div>)}
            </div>
          </div>
          <div><FigureChip src={slide.figure.src} caption={slide.figure.caption} /></div>
        </>
      );
    case 'logistics':
      return (
        <>
          <div className="banner">{slide.banner}</div>
          <div className="flow">
            {slide.flow.map((f, i) => (
              <span key={f} className="flow__item">{i > 0 && <span className="flow__sep" />}<span className="num">{i + 1}</span>{f}</span>
            ))}
          </div>
          <Key value={slide.key.value} label={slide.key.label} />
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.4fr', gap: '1.2rem', minHeight: 0 }}>
            <div><div className="label" style={{ marginBottom: '0.6rem' }}>{slide.checksTitle}</div><Bullets items={slide.checks} sm /></div>
            <Tbl t={slide.table} />
          </div>
        </>
      );
    case 'hse':
      return (
        <>
          <Key value={slide.key.value} label={slide.key.label} />
          <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: '1.4rem', minHeight: 0 }}>
            <div>
              <div className="label" style={{ marginBottom: '0.5rem' }}>{slide.matrixTitle}</div>
              <RiskMatrix circles={slide.circles} />
              {slide.matrixNotes.map((n) => <div className="note" key={n}>{n}</div>)}
            </div>
            <div style={{ display: 'grid', gap: '0.45rem', alignContent: 'start' }}>
              <div className="label">{slide.bandsTitle}</div>
              {slide.bands.map((b) => (
                <div className="band" key={b.range}>
                  <div className={`band__range t-${b.tone}`}>{b.range}</div>
                  <div><div className="band__level">{b.level}</div><div className="band__auth">{b.authority}</div></div>
                  <div className="band__count">{b.count}</div>
                </div>
              ))}
              <div className="label" style={{ marginTop: '0.5rem' }}>{slide.ptwTitle}</div>
              <div className="ptw">{slide.ptw.map((p, i) => <div className="ptw__step" key={p}><span className="num">{i + 1}</span>{p}</div>)}</div>
            </div>
          </div>
          <div className="gate"><strong>{slide.gate.label}</strong>{slide.gate.text}</div>
        </>
      );
    case 'section':
      return (
        <>
          <div className="specs">{slide.specs.map((s) => <div className="tile" key={s.label}><div className="label">{s.label}</div><div className="tile__value">{s.value}</div></div>)}</div>
          <div className="roles">
            {slide.blocks.map((b) => (
              <div key={b.id} className={`role-block ${dim(b.id)}`}>
                <div className="role-block__head"><span className="num">{b.num}</span>{b.title}</div>
                <Bullets items={b.points} sm />
                {b.casing && (
                  <div className="cc">
                    {b.casing.map((g) => (
                      <div key={g.title} className="cc__group">
                        <div className="cc__title">{g.title}</div>
                        {g.rows.map(([k, v]) => <div key={k} className="cc__row"><span>{k}</span><strong>{v}</strong></div>)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      );
    case 'reservoir':
      return (
        <>
          <Key value={slide.key.value} label={slide.key.label} />
          <Bullets items={slide.points} />
          <Tbl t={slide.table} />
          <div className="grid3">{slide.tiles.map((t) => <div className="tile" key={t.label}><div className="label">{t.label}</div><div className="tile__value">{t.value}</div></div>)}</div>
          <div><FigureChip src={slide.figure.src} caption={slide.figure.caption} /></div>
        </>
      );
    case 'completion':
      return (
        <>
          <div className="steps5">
            {slide.steps5.map((s) => (
              <div key={s.num} className={`step5 ${dim(s.num)}`}>
                <span className="num">{s.num}</span>
                <div><div className="step5__title">{s.title}</div><div className="step5__sub">{s.sub}</div></div>
                <Bullets items={s.points} sm />
              </div>
            ))}
          </div>
          <div className="tile"><div className="label">{slide.trajectory.label}</div><div className="tile__value" style={{ fontWeight: 500 }}>{slide.trajectory.text}</div></div>
          <div><FigureChip src={slide.figure.src} caption={slide.figure.caption} /></div>
        </>
      );
    case 'image':
      return (
        <>
          <img className="fig" src={slide.figure.src} alt={slide.figure.alt} />
          <div className="figcap">{slide.figure.caption}</div>
        </>
      );
    case 'sectionData':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '2rem', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'grid', gap: '1.4rem', alignContent: 'start' }}>
            <Tbl t={slide.casing} size="lg" />
            <Tbl t={slide.cement} size="lg" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, gap: '0.6rem' }}>
            <img className="fig" src={slide.figure.src} alt={slide.figure.alt} />
            <div className="figcap">{slide.figure.caption}</div>
          </div>
        </div>
      );
    case 'days':
      return (
        <>
          <div className={`dimmable ${dim('kpi')}`} style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '1.6rem', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, gap: '0.4rem' }}>
              <img className="fig" src={slide.figure.src} alt={slide.figure.alt} />
              <div className="figcap">{slide.figure.caption}</div>
            </div>
            <div style={{ display: 'grid', gap: '0.9rem', alignContent: 'center' }}>
              {slide.kpis.map((k) => <div className="kpi" key={k.value}><div className="kpi__value">{k.value}</div><div className="kpi__label">{k.label}</div></div>)}
            </div>
          </div>
          <div className={`dimmable ${dim('report')}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.6rem' }}>
            <div><div className="label" style={{ marginBottom: '0.5rem' }}>{slide.cadenceTitle}</div><Tbl t={slide.cadence} /></div>
            <div>
              <div className="label" style={{ marginBottom: '0.5rem' }}>{slide.pathTitle}</div>
              <div className="path">{slide.path.map((p, i) => <span key={p} style={{ display: 'contents' }}>{i > 0 && <span className="flow__sep" />}<span className="path__node">{p}</span></span>)}</div>
            </div>
          </div>
        </>
      );
    case 'moc':
      return (
        <>
          <div className="moc">
            {slide.flow.map((f, i) => (
              <div className="moc__step" key={f.title}><span className="num">{i + 1}</span><div className="moc__title">{f.title}</div><div className="moc__text">{f.text}</div></div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '2rem' }}>
            <div className="tile" style={{ padding: '1.1rem 1.3rem', display: 'grid', gap: '0.9rem', alignContent: 'start' }}>
              <div className="gonogo__lead" style={{ fontSize: '1.2rem' }}>{slide.requiredTitle}</div>
              <Bullets items={slide.required} />
              <div className="urgent">{slide.urgent}</div>
            </div>
            <Tbl t={slide.table} size="lg" />
          </div>
        </>
      );
    case 'gonogo':
      return (
        <>
          <div className="gonogo">
            {[slide.go, slide.nogo].map((c, i) => (
              <div key={c.tag} className={`gonogo__col ${i ? 'gonogo__col--no' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span className="gonogo__tag">{c.tag}</span><span className="gonogo__lead">{c.lead}</span></div>
                <Bullets items={c.points} />
                <div className="gonogo__result"><span>Result</span>{c.result}</div>
              </div>
            ))}
          </div>
          <div className="strip">
            {slide.strip.map((s, i) => <span key={i}>{s.strong && <strong>{s.strong} </strong>}{s.text}{'   '}</span>)}
          </div>
        </>
      );
    case 'gates':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', flex: 1, minHeight: 0 }}>
          <div>
            <div className="gonogo__lead" style={{ marginBottom: '0.8rem' }}>{slide.listTitle}</div>
            <div className="gates">{slide.gates.map((g, i) => <div className="gates__item" key={g}><span className="num">{i + 1}</span>{g}</div>)}</div>
          </div>
          <Tbl t={slide.table} size="lg" />
        </div>
      );
    case 'qa':
      return (
        <div className="qa">
          <div>
            <div className="kicker">{slide.eyebrow}</div>
            <div className="qa__big">{slide.big}</div>
            <div className="qa__min">{slide.minutes}</div>
            <div className="qa__thanks">{slide.thanks}</div>
          </div>
          <img src={slide.photo} alt="Drilling rig" />
        </div>
      );
  }
}

function RiskMatrix({ circles }: { circles: { l: number; s: number; count: string }[] }) {
  const tone = (v: number) => (v <= 4 ? 'green' : v <= 9 ? 'yellow' : v <= 12 ? 'orange' : 'red');
  const cells: ReactNode[] = [];
  for (let l = 5; l >= 1; l--) {
    cells.push(<div key={`a${l}`} className="matrix__axis">{l}</div>);
    for (let s = 1; s <= 5; s++) {
      const c = circles.find((x) => x.l === l && x.s === s);
      cells.push(<div key={`${l}-${s}`} className={`matrix__cell t-${tone(l * s)}`}>{l * s}{c && <span className="matrix__dot">{c.count}</span>}</div>);
    }
  }
  cells.push(<div key="corner" />);
  for (let s = 1; s <= 5; s++) cells.push(<div key={`b${s}`} className="matrix__axis">{s}</div>);
  return <div className="matrix">{cells}</div>;
}
