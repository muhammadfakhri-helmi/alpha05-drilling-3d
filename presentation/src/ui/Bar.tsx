import { useEffect, useState } from 'react';
import { useStore, activeRole, elapsedNow } from '../store.ts';
import { SLIDES, ROLES, PRESENTATION_MINUTES, slideByN } from '../data/content.ts';

export const fmt = (ms: number) => {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  return `${neg ? '-' : ''}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function useTick(on: boolean) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => set((x) => x + 1), 500);
    return () => clearInterval(id);
  }, [on]);
}

/** Bottom bar: progress, current speaker, step dots, slide count, total clock. */
export function Bar({ mode }: { mode: '3d' | '2d' }) {
  const s = useStore();
  useTick(s.timer.running);
  const slide = slideByN(s.slide);
  const role = ROLES[activeRole(s)];
  const total = (['pm', 'sub', 'drl', 'hse', 'log', 'eco'] as const).reduce((a, k) => a + elapsedNow(s.timer, k), 0);
  const remaining = PRESENTATION_MINUTES * 60000 - total;
  return (
    <nav className="bar" aria-label="Slide navigation">
      <span className="bar__brand">ALPHA-05 DWOP</span>
      <div className="dots">
        {SLIDES.map((sl) => {
          const on = s.backup ? s.backup === sl.n : s.slide === sl.n;
          return (
            <button
              key={sl.n}
              type="button"
              aria-label={`Slide ${sl.n}`}
              className={`dot ${sl.kind === 'backup' ? 'is-backup' : ''} ${on ? 'is-on' : ''} ${!on && sl.n < s.slide && sl.kind !== 'backup' ? 'is-done' : ''}`}
              style={{ border: sl.kind === 'backup' ? undefined : 0, padding: 0, cursor: 'pointer' }}
              onClick={() => (sl.kind === 'backup' ? s.openBackup(sl.n) : s.goto(sl.n))}
            />
          );
        })}
      </div>
      {mode === '3d' && slide.kind !== '2d' && <span className="bar__scale">Depth to true scale · diameters exaggerated</span>}
      {s.stepMode && slide.steps.length > 1 && !s.backup && (
        <span className="bar__steps">{slide.steps.map((_, i) => <i key={i} className={i === s.step ? 'is-on' : ''} />)}</span>
      )}
      <span className="bar__who">{role.name}</span>
      {s.timer.started && <span className={`timer-chip ${remaining < 0 ? 'is-over' : ''}`}>{fmt(remaining)}</span>}
      <span className="bar__count">{s.backup ? `Backup ${s.backup}` : `${s.slide} / 18`}</span>
    </nav>
  );
}
