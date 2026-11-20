import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store.ts';
import { slideByN } from '../data/content.ts';
import { topicsFor, type Block, type Topic } from '../data/sections.ts';
import { HseBody } from './HseDetail.tsx';

export function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case 'table':
      return (
        <div className="dblock dblock--table">
          <table className="tbl tbl--detail">
            <caption>{b.title}</caption>
            <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
          {b.note && <div className="note">{b.note}</div>}
        </div>
      );
    case 'bullets':
      return (
        <div className="dblock">
          <div className="dblock__title">{b.title}</div>
          <ul className="bullets bullets--sm">{b.items.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      );
    case 'steps':
      return (
        <div className="dblock dblock--steps">
          <div className="dblock__title">{b.title}</div>
          <ol className="opsteps">{b.items.map((x, i) => <li key={i}><span className="opsteps__n">{i + 1}</span><span>{x}</span></li>)}</ol>
        </div>
      );
    case 'figure':
      return (
        <figure className="dblock dblock--figure">
          <img src={b.src} alt={b.caption} />
          <figcaption className="figcap">{b.caption}</figcaption>
        </figure>
      );
  }
}

function TopicBody({ topic }: { topic: Topic }) {
  return (
    <div className="topic">
      {topic.groups ? topic.groups.map((g) => (
        <section key={g.title} className="topic__group">
          <h2 className="topic__group-title">{g.title}</h2>
          <div className="topic__grid">{g.blocks.map((b, i) => <BlockView key={i} b={b} />)}</div>
        </section>
      )) : (
        <div className={`topic__grid ${topic.blocks.length <= 2 ? 'topic__grid--roomy' : ''}`}>{topic.blocks.map((b, i) => <BlockView key={i} b={b} />)}</div>
      )}
    </div>
  );
}

/** Report detail panel (D): tabs per topic, from the drilling program report. */
export function DetailPanel() {
  const open = useStore((s) => s.detail);
  const slideN = useStore((s) => s.slide);
  const topicId = useStore((s) => s.detailTopic);
  const hseStep = useStore((s) => s.hseStep);
  const setTopic = useStore((s) => s.setTopic);
  const topics = topicsFor(slideN);
  const topic = topics.find((t) => t.id === topicId) ?? topics[0];
  const slide = slideByN(slideN);
  return (
    <AnimatePresence>
      {open && topic && (
        <motion.section
          key="detail"
          className={`detail detail--${slide.kind === '2d' ? 'full' : slide.width ?? 'md'}`}
          data-detail={topic.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="panel__head">
            <div>
              <div className="kicker">Report detail · slide {slide.n} · {topic.label}</div>
              <h1 className="title">{topic.id === 'hse' ? <>Before &amp; after <span className="accent">controls</span></> : topic.title}</h1>
            </div>
            <div className="detail__keys"><span className="kbd">Enter</span> next <span className="kbd">Esc</span> {topic.id === 'hse' && hseStep != null ? 'overview' : 'close'}</div>
          </div>
          {topics.length > 1 && (
            <div className="tabs" role="tablist">
              {topics.map((t, i) => (
                <button key={t.id} type="button" role="tab" aria-selected={t.id === topic.id} className={`tab ${t.id === topic.id ? 'is-on' : ''}`} onClick={() => setTopic(t.id)}>
                  <span className="tab__k">{i + 1}</span>{t.label}
                </button>
              ))}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div key={topic.id} className="detail__content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {topic.id === 'hse' ? <HseBody /> : <TopicBody topic={topic} />}
            </motion.div>
          </AnimatePresence>
          <div className="hud__footer"><span>ALPHA-05 DEVELOPMENT WELL</span><span className="role">{slide.footer}</span><span>Drilling program · {topic.source}</span></div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
