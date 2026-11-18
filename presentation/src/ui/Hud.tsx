import { Fragment } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store.ts';
import { slideByN, BACKUPS, type Slide } from '../data/content.ts';
import { SlideBody, Title } from './SlideBody.tsx';

const fade = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -12 }, transition: { duration: 0.35, ease: 'easeOut' as const } };

function Footer({ slide }: { slide: Slide }) {
  // cover and Q&A carry no footer line or page number in the PPTX: role only
  const bare = slide.layout === 'cover' || slide.layout === 'qa';
  return (
    <div className="hud__footer">
      <span>{bare ? '' : 'ALPHA-05 DEVELOPMENT WELL'}</span>
      <span className="role">{slide.footer}</span>
      <span>{bare ? '' : slide.n}</span>
    </div>
  );
}

function Head({ slide, badge }: { slide: Slide; badge?: string }) {
  if (slide.layout === 'cover' || slide.layout === 'qa') return null;
  return (
    <div className="panel__head">
      <div>
        <div className="kicker">{slide.kicker}</div>
        <Title slide={slide} />
      </div>
      {badge && <span className="backup-badge">{badge}</span>}
    </div>
  );
}

/** HUD card for 3D slides; full light panel for 2D slides (14-18). */
export function SlideView({ slide, forcePanel }: { slide: Slide; forcePanel?: boolean }) {
  const panel = forcePanel || slide.kind === '2d';
  if (panel) {
    return (
      <motion.section key={slide.n} {...fade} className={`panel ${slide.light ? 'panel--light' : ''}`} data-hud data-slide={slide.n}>
        <Head slide={slide} />
        <div className="panel__body"><SlideBody slide={slide} /></div>
        <Footer slide={slide} />
      </motion.section>
    );
  }
  return (
    <motion.section key={slide.n} {...fade} className={`hud hud--${slide.width ?? 'md'}`} data-hud data-slide={slide.n}>
      <Head slide={slide} />
      <div className="hud__body"><SlideBody slide={slide} /></div>
      <Footer slide={slide} />
    </motion.section>
  );
}

export function Hud() {
  const slide = slideByN(useStore((s) => s.slide));
  const backupN = useStore((s) => s.backup);
  const backup = backupN ? slideByN(backupN) : null;
  return (
    <>
      <AnimatePresence mode="wait">
        <SlideView key={slide.n} slide={slide} />
      </AnimatePresence>
      <AnimatePresence>
        {backup && (
          <motion.section key={`b${backup.n}`} {...fade} className="panel panel--backup" data-backup={backup.n}>
            <Head slide={backup} badge={`BACKUP · Esc`} />
            <div className="panel__body"><SlideBody slide={backup} /></div>
            <Footer slide={backup} />
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

export function BackupMenu() {
  const open = useStore((s) => s.backupMenu);
  const openBackup = useStore((s) => s.openBackup);
  const close = useStore((s) => s.closeOverlay);
  if (!open) return null;
  return (
    <div className="overlay" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Backup slides</h2>
        {BACKUPS.map((n, i) => (
          <button className="row" key={n} onClick={() => openBackup(n)} type="button">
            <span className="kbd">{i + 1}</span><span>Slide {n} · {slideByN(n).title}</span>
          </button>
        ))}
        <div className="note" style={{ marginTop: '0.6rem' }}>Tekan 1-4 atau klik. Esc untuk kembali.</div>
      </div>
    </div>
  );
}

export function FigureView() {
  const open = useStore((s) => s.figure);
  const slide = slideByN(useStore((s) => s.slide));
  const fig = 'figure' in slide ? slide.figure : null;
  if (!open || !fig) return null;
  return (
    <div className="figure-view">
      <img src={fig.src} alt={fig.alt} />
      <div className="figcap">{fig.caption} · <span className="kbd">Esc</span></div>
    </div>
  );
}

export function Help() {
  const open = useStore((s) => s.help);
  if (!open) return null;
  const keys: [string, string][] = [
    ['Enter', 'Berikutnya: pembicara berikutnya di slide yang sama, lalu slide berikutnya'],
    ['Panah kiri', 'Sebelumnya'],
    ['B', 'Slide backup (4, 7, 9, 11); dari slide 3/6/8/10 langsung ke backup-nya'],
    ['Esc', 'Kembali ke alur utama / tutup panel'],
    ['P', 'Mode presenter (role aktif, timer, poin wajib, serah-terima)'],
    ['T', 'Mulai / jeda timer role (timer mulai otomatis saat Enter pertama)'],
    ['Shift+R', 'Reset timer'],
    ['S', 'Langkah pembicara on/off (off: Enter langsung ke slide berikutnya)'],
    ['D', 'Detail HSE: register 18 langkah, sebelum/sesudah kontrol, kontrol EL/SB/EG/AD/PPE, QR (slide 3, 5, 6, 8, 10, 12, 13). Enter/panah pindah langkah'],
    ['I', 'Perbesar gambar slide (2, 12, 13)'],
    ['V', 'Ganti tampilan 3D / 2D'],
    ['F', 'Layar penuh'],
    ['H', 'Bantuan ini'],
  ];
  return (
    <div className="overlay" onClick={useStore.getState().toggleHelp}>
      <div className="sheet">
        <h2>Tombol</h2>
        <dl className="keys">{keys.map(([k, d]) => <Fragment key={k}><dt>{k}</dt><dd>{d}</dd></Fragment>)}</dl>
        <div className="note" style={{ marginTop: '1rem' }}>Clicker presentasi (PageDown / PageUp) juga bisa dipakai.</div>
      </div>
    </div>
  );
}
