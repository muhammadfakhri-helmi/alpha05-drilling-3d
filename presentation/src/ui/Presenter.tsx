import { useStore, activeRole, elapsedNow, timerKey } from '../store.ts';
import { ROLES, ROLE_ORDER, QA_MINUTES, PRESENTATION_MINUTES, MAIN_SEQUENCE, slideByN, type RoleId } from '../data/content.ts';
import { GUIDE, MEMORIZE, BACKUP_NOTE, ROUTING } from '../data/presenter.ts';
import { fmt, useTick } from './Bar.tsx';
import { openPresenterWindow, remote, isPresenterWindow } from '../sync.ts';

/** What comes after the current location (for the "next" hint). */
function nextLabel(slide: number, step: number, stepMode: boolean): string {
  const sl = slideByN(slide);
  if (stepMode && step < sl.steps.length - 1) return `${ROLES[sl.steps[step + 1].role].name} · slide ${slide}`;
  const i = MAIN_SEQUENCE.indexOf(slide);
  if (i >= MAIN_SEQUENCE.length - 1) return 'Selesai';
  const n = slideByN(MAIN_SEQUENCE[i + 1]);
  return `${ROLES[n.steps[0].role].name} · slide ${n.n} · ${n.title}`;
}

export function Presenter({ window: asWindow = false }: { window?: boolean }) {
  const s = useStore();
  useTick(s.timer.running);
  if (!s.presenter && !asWindow) return null;

  const loc = { slide: s.slide, step: s.step, backup: s.backup };
  const role: RoleId = activeRole(loc);
  const n = s.backup ?? s.slide;
  const cue = GUIDE[n]?.[role];
  const key = timerKey(loc);
  const isQa = key === 'qa';
  const limit = (isQa ? QA_MINUTES : ROLES[role].minutes) * 60000;
  const used = elapsedNow(s.timer, key);
  const left = limit - used;
  const warn = left < limit * 0.2;
  const totalUsed = ROLE_ORDER.reduce((a, k) => a + elapsedNow(s.timer, k), 0);
  const cmd = (local: () => void, c: Parameters<typeof remote>[0]) => () => (isPresenterWindow ? remote(c) : local());
  // handover is said at the end of the role's part
  const sl = slideByN(s.slide);
  const lastStepOfRole = s.backup || !s.stepMode || s.step === sl.steps.length - 1 || sl.steps[s.step + 1]?.role !== role;

  return (
    <aside className={`presenter ${asWindow ? 'presenter--window' : ''}`} aria-label="Presenter view">
      <div className="p-role">
        <div>
          <h3>Role aktif · slide {n}{s.backup ? ' (backup)' : ''}</h3>
          <div className="p-role__name">{isQa ? 'Q&A · Project Manager' : ROLES[role].name}</div>
          <div className="p-sub">{slideByN(n).title}{cue?.minutes ? ` · target sekitar ${cue.minutes} menit` : ''}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={`p-clock ${left < 0 ? 'is-over' : warn ? 'is-warn' : ''}`}>{fmt(left)}</div>
          <div className="p-sub">{isQa ? `sisa dari ${QA_MINUTES} menit Q&A` : `sisa jatah ${ROLES[role].minutes} menit`}</div>
        </div>
      </div>

      <div className={asWindow ? 'p-grid' : ''} style={asWindow ? undefined : { display: 'grid', gap: '0.9rem' }}>
        <div style={{ display: 'grid', gap: '0.9rem', alignContent: 'start' }}>
          <div>
            <h3>Poin wajib</h3>
            {cue ? <ol className="p-points">{cue.points.map((p) => <li key={p}>{p}</li>)}</ol> : <div className="p-sub">Tidak ada poin wajib untuk role ini di slide ini.</div>}
          </div>
          {cue?.handover && (
            <div>
              <h3>Serah-terima{lastStepOfRole ? '' : ' (di akhir bagian Anda)'}</h3>
              <div className="p-hand">"{cue.handover}"</div>
            </div>
          )}
          <div>
            <h3>Angka hafal · {ROLES[role].name}</h3>
            <div className="p-sub" style={{ color: '#F5F8FD' }}>{MEMORIZE[role]}</div>
          </div>
          {asWindow && <div><h3>Backup</h3><div className="p-sub">{BACKUP_NOTE[role]}</div></div>}
        </div>
        <div style={{ display: 'grid', gap: '0.9rem', alignContent: 'start' }}>
          <div>
            <h3>Timer per role · total {fmt(totalUsed)} / {PRESENTATION_MINUTES}:00</h3>
            <div className="p-roles">
              {ROLE_ORDER.map((r) => {
                const u = elapsedNow(s.timer, r);
                return (
                  <div key={r} className={`${r === key ? 'is-on' : ''} ${u > ROLES[r].minutes * 60000 ? 'is-over' : ''}`}>
                    {ROLES[r].short}<b>{fmt(u)} / {fmt(ROLES[r].minutes * 60000)}</b>
                  </div>
                );
              })}
            </div>
          </div>
          {(n === 18 || asWindow) && (
            <div>
              <h3>Routing pertanyaan</h3>
              <table className="p-routing"><tbody>{ROUTING.map(([t, w]) => <tr key={t}><td>{t}</td><td><b>{w}</b></td></tr>)}</tbody></table>
            </div>
          )}
          <div className="p-next">Berikutnya: {nextLabel(s.slide, s.step, s.stepMode)}</div>
          <div className="p-btns">
            <button type="button" onClick={cmd(s.prev, 'prev')}>Sebelumnya</button>
            <button type="button" onClick={cmd(s.next, 'next')}>Berikutnya (Enter)</button>
            <button type="button" onClick={cmd(s.toggleTimer, 'timer')}>{s.timer.running ? 'Jeda timer (T)' : 'Mulai timer (T)'}</button>
            <button type="button" onClick={cmd(s.resetTimer, 'reset')}>Reset (Shift+R)</button>
            <button type="button" onClick={cmd(s.toggleStepMode, 'steps')}>Langkah pembicara: {s.stepMode ? 'on' : 'off'} (S)</button>
            {!isPresenterWindow && <button type="button" onClick={openPresenterWindow}>Buka di jendela kedua</button>}
          </div>
        </div>
      </div>
    </aside>
  );
}
