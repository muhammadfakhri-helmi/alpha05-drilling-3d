import { create } from 'zustand';
import { MAIN_SEQUENCE, BACKUP_FOR, slideByN, type RoleId } from './data/content.ts';
import { HSE_STEPS, stepsForSlide } from './data/hse.ts';

/** HSE steps reachable from a slide's detail panel (slide 5 lists all 18). */
export const detailSteps = (slide: number) => (slide === 5 ? HSE_STEPS : stepsForSlide(slide)).map((s) => s.n);

export type TimerKey = RoleId | 'qa';

export interface TimerState {
  started: boolean;
  running: boolean;
  /** accumulated ms per role (and Q&A) */
  elapsed: Record<TimerKey, number>;
  /** role currently accruing time and since when (epoch ms) */
  segKey: TimerKey | null;
  segStart: number;
}

export interface NavState {
  slide: number;
  step: number;
  backup: number | null;
  backupMenu: boolean;
  presenter: boolean;
  help: boolean;
  figure: boolean;
  /** report detail panel (D) and the HSE step selected in it (null = overview) */
  detail: boolean;
  hseStep: number | null;
  /** Enter walks through the speakers of a multi-role slide before moving on */
  stepMode: boolean;
  mode: '3d' | '2d';
  webglOk: boolean;
  timer: TimerState;
}

interface Actions {
  next(): void;
  prev(): void;
  goto(slide: number, step?: number): void;
  toggleBackup(): void;
  openBackup(n: number): void;
  closeOverlay(): void;
  togglePresenter(): void;
  toggleHelp(): void;
  toggleFigure(): void;
  toggleDetail(): void;
  selectHse(n: number | null): void;
  toggleStepMode(): void;
  toggleMode(): void;
  setWebglFailed(): void;
  toggleTimer(): void;
  resetTimer(): void;
  apply(snapshot: Partial<NavState>): void;
}

const zero = (): Record<TimerKey, number> => ({ pm: 0, sub: 0, drl: 0, hse: 0, log: 0, eco: 0, qa: 0 });

/** Role speaking at the current location (backup slide speaker when a backup is open). */
export function activeRole(s: Pick<NavState, 'slide' | 'step' | 'backup'>): RoleId {
  if (s.backup) return slideByN(s.backup).steps[0].role;
  const sl = slideByN(s.slide);
  return sl.steps[Math.min(s.step, sl.steps.length - 1)].role;
}
export const timerKey = (s: Pick<NavState, 'slide' | 'step' | 'backup'>): TimerKey =>
  !s.backup && s.slide === 18 ? 'qa' : activeRole(s);

/** Close the running segment and open a new one for the location in `next`. */
function retime(prev: NavState, next: Partial<NavState>): TimerState {
  const t = prev.timer;
  const merged = { ...prev, ...next };
  if (!t.running) return t;
  const now = Date.now();
  const elapsed = { ...t.elapsed };
  if (t.segKey) elapsed[t.segKey] += now - t.segStart;
  return { ...t, elapsed, segKey: timerKey(merged), segStart: now };
}

export function elapsedNow(t: TimerState, key: TimerKey, now = Date.now()): number {
  return t.elapsed[key] + (t.running && t.segKey === key ? now - t.segStart : 0);
}

const params = new URLSearchParams(location.search);
const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
const initSlide = Math.min(18, Math.max(1, Number(hash.get('s')) || 1));
const initBackup = slideByN(initSlide).kind === 'backup' ? initSlide : null;

export const useStore = create<NavState & Actions>((set, get) => ({
  slide: initBackup ? Number(Object.keys(BACKUP_FOR).find((k) => BACKUP_FOR[Number(k)] === initBackup) ?? 1) : initSlide,
  step: Math.max(0, Number(hash.get('k')) || 0),
  backup: initBackup,
  backupMenu: false,
  presenter: false,
  help: false,
  figure: false,
  detail: false,
  hseStep: null,
  stepMode: params.get('steps') !== '0',
  mode: params.get('mode') === '2d' ? '2d' : '3d',
  webglOk: true,
  timer: { started: false, running: false, elapsed: zero(), segKey: null, segStart: 0 },

  next() {
    const s = get();
    if (s.detail) {
      const list = detailSteps(s.slide);
      const i = s.hseStep == null ? -1 : list.indexOf(s.hseStep);
      if (i < list.length - 1) set({ hseStep: list[i + 1] });
      return;
    }
    if (s.backup || s.backupMenu || s.figure) return;
    const sl = slideByN(s.slide);
    let nextLoc: Partial<NavState>;
    if (s.stepMode && s.step < sl.steps.length - 1) nextLoc = { step: s.step + 1 };
    else {
      const i = MAIN_SEQUENCE.indexOf(s.slide);
      if (i >= MAIN_SEQUENCE.length - 1) return;
      nextLoc = { slide: MAIN_SEQUENCE[i + 1], step: 0 };
    }
    // the first forward move starts the clock
    let timer = s.timer;
    if (!timer.started) timer = { ...timer, started: true, running: true, segKey: timerKey(s), segStart: Date.now() };
    set({ ...nextLoc, timer: retime({ ...s, timer }, nextLoc) });
  },
  prev() {
    const s = get();
    if (s.detail) {
      const list = detailSteps(s.slide);
      const i = s.hseStep == null ? list.length : list.indexOf(s.hseStep);
      set({ hseStep: i <= 0 ? null : list[i - 1] });
      return;
    }
    if (s.backup || s.backupMenu || s.figure) return;
    let loc: Partial<NavState>;
    if (s.stepMode && s.step > 0) loc = { step: s.step - 1 };
    else {
      const i = MAIN_SEQUENCE.indexOf(s.slide);
      if (i <= 0) return;
      const n = MAIN_SEQUENCE[i - 1];
      loc = { slide: n, step: s.stepMode ? slideByN(n).steps.length - 1 : 0 };
    }
    set({ ...loc, timer: retime(s, loc) });
  },
  goto(slide, step = 0) {
    const s = get();
    const loc = { slide, step, backup: null, backupMenu: false, figure: false, detail: false, hseStep: null };
    set({ ...loc, timer: retime(s, loc) });
  },
  toggleBackup() {
    const s = get();
    if (s.backup || s.backupMenu) return get().closeOverlay();
    const direct = BACKUP_FOR[s.slide];
    if (direct) get().openBackup(direct);
    else set({ backupMenu: true });
  },
  openBackup(n) {
    const s = get();
    const loc = { backup: n, backupMenu: false };
    set({ ...loc, timer: retime(s, loc) });
  },
  closeOverlay() {
    const s = get();
    if (s.figure) return set({ figure: false });
    if (s.detail) return set(s.hseStep != null ? { hseStep: null } : { detail: false });
    if (s.help) return set({ help: false });
    if (s.backup || s.backupMenu) {
      const loc = { backup: null, backupMenu: false };
      return set({ ...loc, timer: retime(s, loc) });
    }
    if (s.presenter) set({ presenter: false });
  },
  togglePresenter: () => set((s) => ({ presenter: !s.presenter })),
  toggleHelp: () => set((s) => ({ help: !s.help })),
  toggleFigure: () => set((s) => ({ figure: !s.figure })),
  toggleDetail: () => set((s) => (s.detail ? { detail: false, hseStep: null } : detailSteps(s.slide).length && !s.backup ? { detail: true, hseStep: null } : {})),
  selectHse: (n) => set({ hseStep: n }),
  toggleStepMode: () => set((s) => ({ stepMode: !s.stepMode, step: 0 })),
  toggleMode: () => set((s) => ({ mode: s.mode === '3d' && s.webglOk ? '2d' : s.webglOk ? '3d' : '2d' })),
  setWebglFailed: () => set({ webglOk: false, mode: '2d' }),
  toggleTimer() {
    const s = get();
    const t = s.timer;
    const now = Date.now();
    if (t.running) {
      const elapsed = { ...t.elapsed };
      if (t.segKey) elapsed[t.segKey] += now - t.segStart;
      set({ timer: { ...t, running: false, elapsed, segKey: null } });
    } else set({ timer: { ...t, started: true, running: true, segKey: timerKey(s), segStart: now } });
  },
  resetTimer: () => set({ timer: { started: false, running: false, elapsed: zero(), segKey: null, segStart: 0 } }),
  apply: (snap) => set(snap),
}));

/** Keep the URL hash in sync so a reload returns to the same slide. */
useStore.subscribe((s) => {
  const h = `#s=${s.backup ?? s.slide}${s.step ? `&k=${s.step}` : ''}`;
  if (location.hash !== h) history.replaceState(null, '', h);
});
