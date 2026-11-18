/**
 * Optional second-screen presenter view (?view=presenter, opened from the
 * presenter overlay). The main window is authoritative: it broadcasts a
 * snapshot on every change; the presenter window mirrors it and sends
 * navigation commands back. Same machine, so timers share one clock.
 */
import { useStore, type NavState } from './store.ts';

type Cmd = 'next' | 'prev' | 'backup' | 'escape' | 'timer' | 'reset' | 'steps' | 'hello';
type Msg = { type: 'snap'; snap: Partial<NavState> } | { type: 'cmd'; cmd: Cmd; arg?: number };

const CHANNEL = 'alpha05-dwop';
export const isPresenterWindow = new URLSearchParams(location.search).get('view') === 'presenter';

const pick = (s: NavState): Partial<NavState> => ({
  slide: s.slide, step: s.step, backup: s.backup, backupMenu: s.backupMenu, stepMode: s.stepMode, timer: s.timer, detail: s.detail, hseStep: s.hseStep,
});

let ch: BroadcastChannel | null = null;

export function startSync() {
  if (typeof BroadcastChannel === 'undefined') return;
  ch = new BroadcastChannel(CHANNEL);
  if (isPresenterWindow) {
    ch.onmessage = (e: MessageEvent<Msg>) => { if (e.data.type === 'snap') useStore.getState().apply(e.data.snap); };
    ch.postMessage({ type: 'cmd', cmd: 'hello' } satisfies Msg);
    return;
  }
  const send = () => ch?.postMessage({ type: 'snap', snap: pick(useStore.getState()) } satisfies Msg);
  useStore.subscribe(send);
  ch.onmessage = (e: MessageEvent<Msg>) => {
    if (e.data.type !== 'cmd') return;
    const st = useStore.getState();
    const map: Record<Cmd, () => void> = {
      next: st.next, prev: st.prev, backup: st.toggleBackup, escape: st.closeOverlay,
      timer: st.toggleTimer, reset: st.resetTimer, steps: st.toggleStepMode, hello: send,
    };
    if (e.data.cmd === 'backup' && e.data.arg) st.openBackup(e.data.arg);
    else map[e.data.cmd]?.();
  };
}

/** Commands from the presenter window go to the main window. */
export function remote(cmd: Cmd, arg?: number) {
  ch?.postMessage({ type: 'cmd', cmd, arg } satisfies Msg);
}

export function openPresenterWindow() {
  const url = new URL(location.href);
  url.searchParams.set('view', 'presenter');
  url.hash = '';
  window.open(url.toString(), 'alpha05-presenter', 'width=1280,height=800');
}
