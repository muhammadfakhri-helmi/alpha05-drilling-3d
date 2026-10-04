/**
 * Touch-friendly timeline: 12 operation segments (width ∝ duration), drag to
 * scrub, tap a segment, prev/next operation, play/pause, speed.
 */
import { PHASES, PHASE_START, TOTAL } from '../stateMachine.js';
import { clamp } from '../utils/math.js';

const $ = (id) => document.getElementById(id);
const SPEEDS = [0.5, 1, 2, 4];

export class Timeline {
  constructor(clock) {
    this.clock = clock; // { t, playing, speed, scrubbing }
    this.bar = $('bar');
    PHASES.forEach((ph) => {
      const d = document.createElement('div');
      d.className = 'seg';
      d.style.flex = String(ph.dur);
      d.title = ph.title;
      d.innerHTML = `<i></i><span>${ph.short}</span>`;
      this.bar.appendChild(d);
    });
    this.segs = [...this.bar.children];
    this.fills = this.segs.map((s) => s.firstChild);
    this.lastI = -1;

    $('btnPlay').addEventListener('click', () => this.togglePlay());
    $('btnPrev').addEventListener('click', () => this.step(-1));
    $('btnNext').addEventListener('click', () => this.step(1));
    $('btnSpeed').addEventListener('click', () => this.setSpeed(SPEEDS[(SPEEDS.indexOf(this.clock.speed) + 1) % SPEEDS.length]));

    const scrub = (x) => {
      const r = this.bar.getBoundingClientRect();
      this.clock.t = clamp((x - r.left) / r.width) * (TOTAL - 0.001);
    };
    this.bar.addEventListener('pointerdown', (e) => { this.clock.scrubbing = true; this.bar.setPointerCapture(e.pointerId); scrub(e.clientX); });
    this.bar.addEventListener('pointermove', (e) => { if (this.clock.scrubbing) scrub(e.clientX); });
    const end = () => { this.clock.scrubbing = false; };
    this.bar.addEventListener('pointerup', end);
    this.bar.addEventListener('pointercancel', end);
    this.bar.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { this.step(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { this.step(-1); e.preventDefault(); }
      if (e.key === 'Home') { this.clock.t = 0; e.preventDefault(); }
      if (e.key === 'End') { this.clock.t = TOTAL - 0.01; e.preventDefault(); }
    });
    new ResizeObserver(() => this.bar.classList.toggle('nolabels', this.bar.clientWidth / PHASES.length < 52)).observe(this.bar);
    this.syncPlay();
  }

  currentIndex() { let i = 0; while (i < PHASES.length - 1 && this.clock.t >= PHASE_START[i + 1]) i++; return i; }

  step(dir) {
    const i = this.currentIndex();
    const into = this.clock.t - PHASE_START[i];
    let j = i + dir;
    if (dir < 0 && into > 1.5) j = i; // first press restarts the current operation
    this.clock.t = PHASE_START[clamp(j, 0, PHASES.length - 1)] + 0.001;
    this.onJump?.();
  }

  togglePlay() {
    this.clock.playing = !this.clock.playing;
    if (this.clock.playing && this.clock.t >= TOTAL - 0.05) this.clock.t = 0;
    this.syncPlay();
  }

  setSpeed(v) {
    this.clock.speed = v;
    $('btnSpeed').textContent = `${v}×`;
    this.onSpeed?.(v);
  }

  syncPlay() {
    $('playIco').setAttribute('d', this.clock.playing ? 'M6 4h4v16H6zM14 4h4v16h-4z' : 'M7 4l13 8-13 8z');
    $('btnPlay').setAttribute('aria-label', this.clock.playing ? 'Pause' : 'Play');
  }

  update(S) {
    if (S.i !== this.lastI) {
      this.segs.forEach((s, j) => s.classList.toggle('on', j === S.i));
      this.lastI = S.i;
    }
    for (let j = 0; j < this.fills.length; j++) {
      const w = j < S.i ? 100 : j > S.i ? 0 : S.p * 100;
      const v = `${w.toFixed(1)}%`;
      if (this.fills[j].style.width !== v) this.fills[j].style.width = v;
    }
    this.bar.setAttribute('aria-valuenow', String(Math.round((S.t / TOTAL) * 100)));
    this.bar.setAttribute('aria-valuetext', `${S.i + 1} of 12: ${S.phase.title}`);
  }
}
