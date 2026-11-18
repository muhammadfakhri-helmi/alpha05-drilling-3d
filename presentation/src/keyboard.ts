import { useEffect } from 'react';
import { useStore } from './store.ts';
import { BACKUPS } from './data/content.ts';
import { isPresenterWindow, remote } from './sync.ts';

/**
 * Keys
 *   Enter / Right / Space / PageDown  next (speaker step, then slide)
 *   Left / PageUp / Backspace         previous
 *   B   backup slide (4, 7, 9, 11)      Esc  back to the main flow
 *   P   presenter overlay               T    start / pause role timer
 *   S   speaker steps on/off            V    switch 3D / 2D view
 *   I   enlarge slide figure            F    full screen       H or ?  help
 * Presentation clickers send PageDown / PageUp or arrows, so they work too.
 */
export function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const st = useStore.getState();
      const k = e.key;
      const r = isPresenterWindow;
      const handled = () => e.preventDefault();
      if (st.backupMenu && /^[1-4]$/.test(k)) { handled(); return r ? remote('backup', BACKUPS[Number(k) - 1]) : st.openBackup(BACKUPS[Number(k) - 1]); }
      switch (k) {
        case 'Enter': case 'ArrowRight': case ' ': case 'PageDown': case 'ArrowDown':
          handled(); return r ? remote('next') : st.next();
        case 'ArrowLeft': case 'PageUp': case 'Backspace': case 'ArrowUp':
          handled(); return r ? remote('prev') : st.prev();
        case 'b': case 'B': handled(); return r ? remote('backup') : st.toggleBackup();
        case 'Escape': handled(); return r ? remote('escape') : st.closeOverlay();
        case 't': case 'T': handled(); return r ? remote('timer') : st.toggleTimer();
        case 'R': if (e.shiftKey) { handled(); return r ? remote('reset') : st.resetTimer(); } return;
        case 's': case 'S': handled(); return r ? remote('steps') : st.toggleStepMode();
        case 'p': case 'P': if (!r) { handled(); st.togglePresenter(); } return;
        case 'v': case 'V': if (!r) { handled(); st.toggleMode(); } return;
        case 'i': case 'I': if (!r) { handled(); st.toggleFigure(); } return;
        case 'h': case 'H': case '?': handled(); return st.toggleHelp();
        case 'f': case 'F':
          handled();
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen?.().catch(() => {});
          return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
