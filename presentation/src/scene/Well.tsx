import { useEffect, useMemo, useRef } from 'react';
import { DoubleSide, MeshStandardMaterial, MeshBasicMaterial, BufferGeometry, type Group, type Mesh } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { CASINGS, HOLES, COMPLETION, CELLAR_Y, MW_WINDOWS, ANIM_SECONDS, rad, type SectionId, type Anim } from '../data/well.ts';
import { TD, tangentAt } from '../data/trajectory.ts';
import { halfShell, ribbon, shoeTriangles, axisPoints, tube } from './geometry.ts';
import { C } from '../theme.ts';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { HAZARD_MARKS } from '../data/sections.ts';
import type { SceneState } from '../data/content.ts';

const TOP_MD = -CELLAR_Y; // casing heads land on the cellar floor (schematic surface model)
const SECTION_IDX: Record<SectionId, number> = { s26: 0, s17: 1, s12: 2, s8: 3 };

const wall = (od: number) => Math.max(rad(od) * 0.09, 1.4);

function useMaterials() {
  return useMemo(() => ({
    hole: new MeshStandardMaterial({ color: C.rock, roughness: 1, metalness: 0, side: DoubleSide }),
    casing: new MeshStandardMaterial({ color: C.steel, roughness: 0.42, metalness: 0.45, side: DoubleSide }),
    liner: new MeshStandardMaterial({ color: C.steelLight, roughness: 0.42, metalness: 0.45, side: DoubleSide }),
    wall: new MeshBasicMaterial({ color: C.slate, side: DoubleSide }),
    cement: new MeshBasicMaterial({ color: '#DCD4C1', side: DoubleSide }),
    tail: new MeshBasicMaterial({ color: '#B3A78A', side: DoubleSide }),
    coupling: new MeshBasicMaterial({ color: '#2C3448', side: DoubleSide }),
    clay: new MeshBasicMaterial({ color: '#E9B530', side: DoubleSide }),
    kick: new MeshBasicMaterial({ color: '#C3332A', side: DoubleSide }),
    loss: new MeshBasicMaterial({ color: '#6A4FC4', side: DoubleSide }),
    shoe: new MeshBasicMaterial({ color: C.navy, side: DoubleSide }),
    tubing: new MeshStandardMaterial({ color: C.blue, roughness: 0.4, metalness: 0.3, side: DoubleSide }),
    tubingWall: new MeshBasicMaterial({ color: C.blue, side: DoubleSide }),
    esp: new MeshStandardMaterial({ color: C.orange, roughness: 0.45, metalness: 0.2, side: DoubleSide }),
    espWall: new MeshBasicMaterial({ color: C.orange, side: DoubleSide }),
    perf: new MeshBasicMaterial({ color: C.orange, side: DoubleSide }),
    glow: new MeshBasicMaterial({ color: C.orange, transparent: true, opacity: 0.13, side: DoubleSide, depthWrite: false }),
    mw: new MeshBasicMaterial({ color: '#2BA39A', side: DoubleSide }),
    mw2: new MeshBasicMaterial({ color: '#7CCFC7', side: DoubleSide }),
    mud: new MeshBasicMaterial({ color: '#8C6A43', transparent: true, opacity: 0.28, side: DoubleSide, depthWrite: false }),
    ghost: new MeshStandardMaterial({ color: C.blue, transparent: true, opacity: 0.22, side: DoubleSide, depthWrite: false }),
    ghostWall: new MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.45, side: DoubleSide, depthWrite: false }),
    pipe: new MeshStandardMaterial({ color: '#5E6E86', roughness: 0.35, metalness: 0.6 }),
    collar: new MeshStandardMaterial({ color: '#3C475E', roughness: 0.4, metalness: 0.55 }),
    motor: new MeshStandardMaterial({ color: C.green, roughness: 0.45, metalness: 0.3 }),
    bit: new MeshStandardMaterial({ color: '#D9A93A', roughness: 0.35, metalness: 0.6 }),
  }), []);
}

const ease = (t: number) => t * t * (3 - 2 * t);
const EMPTY = new BufferGeometry();
const swap = (mesh: Mesh | null, g: BufferGeometry) => { if (!mesh) return; if (mesh.geometry !== EMPTY) mesh.geometry.dispose(); mesh.geometry = g; };

export function Well({ state, anim }: { state: SceneState; anim?: Anim }) {
  const m = useMaterials();
  const linerRef = useRef<Group>(null);
  // animated pieces: geometry rebuilt from the moving front (works on every GPU, no clipping)
  const cementRefs = useRef<(Group | null)[]>([]);
  const animLead = useRef<Mesh>(null);
  const animTail = useRef<Mesh>(null);
  const runGroup = useRef<Group>(null);
  const completionRef = useRef<Group>(null);
  const animTubing = useRef<Mesh>(null);
  const animTubingWall = useRef<Mesh>(null);
  const animEsp = useRef<Mesh>(null);
  const animEspWall = useRef<Mesh>(null);
  const lastFront = useRef(-1);
  const invalidate = useThree((s) => s.invalidate);
  const start = useRef(0);
  useEffect(() => { start.current = performance.now(); lastFront.current = -1; invalidate(); }, [anim?.key, invalidate]);

  const builtIdx = state.built === 'none' ? -1 : state.built === 'all' ? 3 : SECTION_IDX[state.built];
  const focusIdx = state.focus && state.focus in SECTION_IDX ? SECTION_IDX[state.focus as SectionId] : -1;
  const drilledIdx = Math.max(builtIdx, focusIdx);
  const linerShown = state.built === 'all';
  const showPerfs = linerShown && (state.focus === 'perfs' || !!state.completion);

  const geo = useMemo(() => {
    const holes = HOLES.map((h) => ({ id: h.id, g: halfShell(h.top, h.bottom, rad(h.holeIn), 16), glow: ribbon(h.top, h.bottom, 0, rad(h.holeIn), -0.5) }));
    const casings = CASINGS.map((c, i) => {
      const top = c.liner ? c.top : TOP_MD;
      const r = rad(c.od);
      // cement annulus: outer boundary = previous string ID above its shoe, hole below
      const prev = CASINGS[i - 1];
      const lead = [] as ReturnType<typeof ribbon>[];
      const tail = [] as ReturnType<typeof ribbon>[];
      const slices: { a: number; b: number; ro: number; tail: boolean }[] = [];
      if (c.hole && prev) {
        const prevId = rad(prev.od) - wall(prev.od);
        const split = prev.shoe;
        const tt = c.tailTop ?? top;
        // split each annulus piece at the outer-boundary change and at the top of tail
        const pieces: [number, number, number][] = [];
        if (top < split) pieces.push([top, Math.min(split, c.shoe), prevId]);
        if (c.shoe > split) pieces.push([Math.max(top, split), c.shoe, rad(c.hole)]);
        for (const [a, b, ro] of pieces) {
          if (a < tt) { lead.push(ribbon(a, Math.min(b, tt), r, ro, 0.3)); slices.push({ a, b: Math.min(b, tt), ro, tail: false }); }
          if (b > tt) { tail.push(ribbon(Math.max(a, tt), b, r, ro, 0.3)); slices.push({ a: Math.max(a, tt), b, ro, tail: true }); }
        }
      }
      // couplings: one per joint of the tally, spaced evenly along the string
      let couplings: ReturnType<typeof ribbon> | null = null;
      if (c.joints) {
        const len = (c.shoe - top) / c.joints;
        const parts: ReturnType<typeof ribbon>[] = [];
        for (let j = 1; j < c.joints; j++) {
          const md = top + j * len;
          parts.push(ribbon(md - 2.5, md + 2.5, r - wall(c.od) * 1.1, r + wall(c.od) * 0.9, 1));
        }
        couplings = mergeGeometries(parts);
        parts.forEach((g) => g.dispose());
      }
      return {
        key: c.key,
        shell: halfShell(top, c.shoe, r),
        wall: ribbon(top, c.shoe, r - wall(c.od), r, 0.8),
        shoe: shoeTriangles(c.shoe, r, Math.max(rad(c.od) * 0.45, 6), 1),
        lead,
        tail,
        slices,
        r,
        couplings,
        hanger: c.liner ? ribbon(c.top, c.top + 40, r, rad(9.625) - wall(9.625), 1.2) : null,
      };
    });
    const intake = COMPLETION.intakeMd;
    const pumpTop = intake - COMPLETION.pumpVisualLength;
    const rt = rad(COMPLETION.tubingOd);
    const rEsp = rad(5);
    const completion = {
      tubing: halfShell(TOP_MD, pumpTop, rt, 10),
      tubingWall: ribbon(TOP_MD, pumpTop, rt - 1.6, rt, 1.6),
      esp: halfShell(pumpTop, COMPLETION.eotMd, rEsp, 12),
      espWall: ribbon(pumpTop, COMPLETION.eotMd, 0, rEsp, 1.7),
    };
    const perfs = COMPLETION.perfs.flatMap(([a, b]) => {
      const out = [] as ReturnType<typeof ribbon>[];
      for (let md = a; md < b; md += 10) out.push(ribbon(md, md + 4, rad(7), rad(7) + 26, 1.8));
      return out;
    });
    // drill string + BHA on bottom of each section (visual lengths, not data)
    const strings = HOLES.map((h) => {
      const bitLen = 18, motorLen = 60, bhaLen = 300;
      const bot = h.bottom - 4;
      return {
        id: h.id,
        pipe: tube(TOP_MD, bot - bhaLen, rad(5), 10),
        collars: tube(bot - bhaLen, bot - bitLen - motorLen, rad(Math.min(9.5, h.holeIn * 0.55)), 12),
        motor: tube(bot - bitLen - motorLen, bot - bitLen, rad(Math.min(9.625, h.holeIn * 0.6)), 12),
        bit: tube(bot - bitLen, bot, rad(h.holeIn) * 0.94, 14),
        mud: ribbon(h.top, h.bottom, 0, rad(h.holeIn), -0.8),
      };
    });
    // hazard intervals from the offset wells (report Tables 3.3 / 3.4), on the high side of the hole
    const hazards = HAZARD_MARKS.map((h, i) => {
      const a = Math.min(h.from, TD), b = Math.min(h.to, TD);
      const hole = HOLES.find((x) => a >= x.top && a < x.bottom) ?? HOLES[3];
      const r0 = rad(hole.holeIn) + 14 + (h.kind === 'clay' ? 0 : h.kind === 'kick' ? 18 : 36);
      return { i, kind: h.kind, g: ribbon(a, Math.max(b, a + 12), r0, r0 + 14, 2, [1]) };
    });
    // mud weight window bands on the low side of the hole (PPTX Table 3.1)
    const windows = MW_WINDOWS.map((w) => {
      const hole = HOLES.find((x) => w.from >= x.top && w.from < x.bottom) ?? HOLES[3];
      const r0 = rad(hole.holeIn) + 16;
      return { ...w, g: ribbon(w.from + 3, w.to - 3, r0, r0 + 12, 2, [-1]) };
    });
    return { holes, casings, completion, perfs, strings, hazards, windows };
  }, []);


  useFrame(() => {
    const kind = anim?.kind ?? null;
    const t = kind ? Math.min(1, (performance.now() - start.current) / (ANIM_SECONDS[kind] * 1000)) : 1;
    const e = ease(t);
    const running = kind != null && t < 1;
    // cementing: slurry rises from the shoe up the annulus
    const ci = running && kind === 'cement' ? CASINGS.findIndex((c) => c.section === state.focus) : -1;
    cementRefs.current.forEach((g, i) => { if (g) g.visible = i !== ci; });
    if (animLead.current) animLead.current.visible = ci >= 0;
    if (animTail.current) animTail.current.visible = ci >= 0;
    if (ci >= 0) {
      // slow through the first 900 ft above the shoe (in view), then on to the cement top
      const c = CASINGS[ci]; const top = c.liner ? c.top : TOP_MD;
      const near = Math.min(900, c.shoe - top);
      const front = t < 0.65 ? c.shoe - near * (t / 0.65) : c.shoe - near - (c.shoe - top - near) * ease((t - 0.65) / 0.35);
      if (Math.abs(front - lastFront.current) > 4) {
        lastFront.current = front;
        const gc = geo.casings[ci];
        const build = (tail: boolean) => {
          const parts = gc.slices.filter((x) => x.tail === tail && x.b > front + 1).map((x) => ribbon(Math.max(x.a, front), x.b, gc.r, x.ro, 0.4));
          if (!parts.length) return EMPTY;
          const g = mergeGeometries(parts); parts.forEach((p) => p.dispose()); return g;
        };
        swap(animLead.current, build(false));
        swap(animTail.current, build(true));
      }
    }
    // liner run to bottom along the tangent
    if (linerRef.current) {
      const d = running && kind === 'liner' ? -(1 - e) * 450 : 0;
      const [tx, ty] = tangentAt(9300);
      linerRef.current.position.set(tx * d, ty * d, 0);
    }
    // completion string run in from surface to the ESP
    const espRun = running && kind === 'esp';
    if (completionRef.current) completionRef.current.visible = !espRun && !!state.completion;
    if (runGroup.current) runGroup.current.visible = espRun;
    if (espRun) {
      const front = TOP_MD + (COMPLETION.eotMd - TOP_MD) * e;
      if (Math.abs(front - lastFront.current) > 25) {
        lastFront.current = front;
        const pumpTop = COMPLETION.intakeMd - COMPLETION.pumpVisualLength;
        const rt = rad(COMPLETION.tubingOd), rEsp = rad(5);
        // the ESP leads the string: tubing above it, pump/motor at the front
        const espTop = Math.max(TOP_MD, front - (COMPLETION.eotMd - pumpTop));
        swap(animEsp.current, front > TOP_MD + 5 ? halfShell(espTop, front, rEsp, 12) : EMPTY);
        swap(animEspWall.current, front > TOP_MD + 5 ? ribbon(espTop, front, 0, rEsp, 1.7) : EMPTY);
        swap(animTubing.current, espTop > TOP_MD + 5 ? halfShell(TOP_MD, espTop, rt, 10) : EMPTY);
        swap(animTubingWall.current, espTop > TOP_MD + 5 ? ribbon(TOP_MD, espTop, rt - 1.6, rt, 1.6) : EMPTY);
      }
    }
    if (running) invalidate();
  });

  const lastDrilled = drilledIdx >= 0 ? HOLES[drilledIdx].bottom : 120;
  const ghost = useMemo(() => axisPoints(lastDrilled, TD, 0, 2), [lastDrilled]);
  const focusSection = focusIdx >= 0 ? HOLES[focusIdx] : null;
  const focusLines = useMemo(() => {
    if (!focusSection) return null;
    const r = rad(focusSection.holeIn) + 6;
    return [axisPoints(focusSection.top, focusSection.bottom, r, 3), axisPoints(focusSection.top, focusSection.bottom, -r, 3)];
  }, [focusSection]);


  return (
    <group>
      {/* open hole */}
      {geo.holes.map((h, i) => (
        <group key={h.id} visible={i <= drilledIdx}>
          <mesh geometry={h.g} material={m.hole} />
          {focusSection?.id === h.id && i <= builtIdx && <mesh geometry={h.glow} material={m.glow} />}
        </group>
      ))}

      {/* casing strings */}
      {geo.casings.map((c, i) => {
        const def = CASINGS[i];
        const shown = def.key === 'c30' ? true : def.liner ? linerShown : builtIdx >= i - 1;
        const planned = !shown && i - 1 === focusIdx; // casing of the section being drilled: shown as planned
        return (
          <group key={c.key} ref={def.liner ? linerRef : undefined}>
            <group visible={shown}>
              <mesh geometry={c.shell} material={def.liner ? m.liner : m.casing} />
              <mesh geometry={c.wall} material={m.wall} />
              <mesh geometry={c.shoe} material={m.shoe} />
              <group ref={(el) => { cementRefs.current[i] = el; }}>
                {c.lead.map((g, k) => <mesh key={`l${k}`} geometry={g} material={m.cement} />)}
                {c.tail.map((g, k) => <mesh key={`t${k}`} geometry={g} material={m.tail} />)}
              </group>
              {c.couplings && <mesh geometry={c.couplings} material={m.coupling} />}
              {c.hanger && <mesh geometry={c.hanger} material={m.shoe} />}
            </group>
            <group visible={planned}>
              <mesh geometry={c.wall} material={m.ghostWall} />
              <mesh geometry={c.shoe} material={m.ghostWall} />
            </group>
          </group>
        );
      })}

      {/* animated cement front and completion run */}
      <mesh ref={animLead} geometry={EMPTY} material={m.cement} visible={false} />
      <mesh ref={animTail} geometry={EMPTY} material={m.tail} visible={false} />
      <group ref={runGroup} visible={false}>
        <mesh ref={animTubing} geometry={EMPTY} material={m.tubing} />
        <mesh ref={animTubingWall} geometry={EMPTY} material={m.tubingWall} />
        <mesh ref={animEsp} geometry={EMPTY} material={m.esp} />
        <mesh ref={animEspWall} geometry={EMPTY} material={m.espWall} />
      </group>

      {/* completion: tubing and ESP */}
      <group ref={completionRef} visible={!!state.completion}>
        <mesh geometry={geo.completion.tubing} material={m.tubing} />
        <mesh geometry={geo.completion.tubingWall} material={m.tubingWall} />
        <mesh geometry={geo.completion.esp} material={m.esp} />
        <mesh geometry={geo.completion.espWall} material={m.espWall} />
      </group>

      {/* drilling in progress: string + BHA on bottom of the focus section, mud in the open hole */}
      {geo.strings.map((st, i) => (
        <group key={st.id} visible={i === focusIdx && i > builtIdx}>
          <mesh geometry={st.mud} material={m.mud} />
          <mesh geometry={st.pipe} material={m.pipe} />
          <mesh geometry={st.collars} material={m.collar} />
          <mesh geometry={st.motor} material={m.motor} />
          <mesh geometry={st.bit} material={m.bit} />
        </group>
      ))}

      {/* mud weight window markers for the section in view */}
      {focusSection && geo.windows.map((w, k) => (
        <mesh key={k} geometry={w.g} material={k % 2 ? m.mw2 : m.mw}
          visible={w.to > focusSection.top && w.from <= focusSection.bottom} />
      ))}

      <group visible={!!state.hazards}>
        {geo.hazards.map((h) => <mesh key={h.i} geometry={h.g} material={m[h.kind]} />)}
      </group>

      <group visible={showPerfs}>
        {geo.perfs.map((g, i) => <mesh key={i} geometry={g} material={m.perf} />)}
      </group>

      {/* planned path not yet drilled */}
      {lastDrilled < TD && <Line points={ghost} color={C.navy} lineWidth={2} dashed dashSize={60} gapSize={45} transparent opacity={0.45} />}

      {focusLines && focusLines.map((pts, i) => <Line key={i} points={pts} color={C.orange} lineWidth={4} />)}

    </group>
  );
}
