import { Component, Suspense, lazy, useEffect, type ReactNode } from 'react';
import { useStore } from './store.ts';
import { useKeyboard } from './keyboard.ts';
import { hasWebGL } from './webgl.ts';
import { isPresenterWindow } from './sync.ts';
import { slideByN, IMAGES, type SceneState } from './data/content.ts';
import { Hud, BackupMenu, FigureView, Help } from './ui/Hud.tsx';
import { Bar } from './ui/Bar.tsx';
import { Presenter } from './ui/Presenter.tsx';
import { Schematic } from './ui/Schematic.tsx';
import { HseDetail } from './ui/HseDetail.tsx';
import { MobileDetail } from './ui/MobileDetail.tsx';

const isDetailPage = new URLSearchParams(location.search).get('view') === 'detail';

const Scene3D = lazy(() => import('./scene/Scene3D.tsx').then((m) => ({ default: m.Scene3D })));

/** Any render error inside the 3D view switches to the 2D deck instead of a blank screen. */
class Guard extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Fallback2DVisual() {
  const slide = slideByN(useStore((s) => s.slide));
  const step = useStore((s) => s.step);
  if (slide.kind === '2d') return null;
  const st = slide.steps[Math.min(step, slide.steps.length - 1)];
  const state: SceneState = { ...slide.scene, ...(st.scene ?? {}) };
  const width = { md: 42, lg: 48, xl: 56 }[slide.width ?? 'md'];
  return (
    <div className="schematic" style={{ right: `calc(${width}vw + 1.6rem)` }}>
      {slide.n === 1 || slide.n === 3 || slide.n === 5 ? <img src={IMAGES.rigImg} alt="Drilling rig" /> : <Schematic state={state} />}
    </div>
  );
}

export function App() {
  useKeyboard();
  const mode = useStore((s) => s.mode);
  const fail = useStore((s) => s.setWebglFailed);
  useEffect(() => { if (!hasWebGL()) fail(); }, [fail]);

  if (isDetailPage) return <MobileDetail />;
  if (isPresenterWindow) return <div className="app"><Presenter window /></div>;

  return (
    <div className="app" data-mode={mode}>
      {mode === '3d' ? (
        <Guard onFail={fail}>
          <Suspense fallback={null}><Scene3D onFail={fail} /></Suspense>
        </Guard>
      ) : (
        <>
          <div className="fallback-notice">Tampilan 2D</div>
          <Fallback2DVisual />
        </>
      )}
      <Hud />
      <HseDetail />
      <Bar mode={mode} />
      <Presenter />
      <BackupMenu />
      <FigureView />
      <Help />
    </div>
  );
}
