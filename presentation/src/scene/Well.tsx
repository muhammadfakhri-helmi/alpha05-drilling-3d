import { useMemo } from 'react';
import { DoubleSide, MeshStandardMaterial, MeshBasicMaterial } from 'three';
import { Line } from '@react-three/drei';
import { CASINGS, HOLES, COMPLETION, CELLAR_Y, rad, type SectionId } from '../data/well.ts';
import { TD } from '../data/trajectory.ts';
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
    mud: new MeshBasicMaterial({ color: '#8C6A43', transparent: true, opacity: 0.28, side: DoubleSide, depthWrite: false }),
    ghost: new MeshStandardMaterial({ color: C.blue, transparent: true, opacity: 0.22, side: DoubleSide, depthWrite: false }),
    ghostWall: new MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.45, side: DoubleSide, depthWrite: false }),
    pipe: new MeshStandardMaterial({ color: '#5E6E86', roughness: 0.35, metalness: 0.6 }),
    collar: new MeshStandardMaterial({ color: '#3C475E', roughness: 0.4, metalness: 0.55 }),
    motor: new MeshStandardMaterial({ color: C.green, roughness: 0.45, metalness: 0.3 }),
    bit: new MeshStandardMaterial({ color: '#D9A93A', roughness: 0.35, metalness: 0.6 }),
  }), []);
}

export function Well({ state }: { state: SceneState }) {
  const m = useMaterials();

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
      if (c.hole && prev) {
        const prevId = rad(prev.od) - wall(prev.od);
        const split = prev.shoe;
        const tt = c.tailTop ?? top;
        // split each annulus piece at the outer-boundary change and at the top of tail
        const pieces: [number, number, number][] = [];
        if (top < split) pieces.push([top, Math.min(split, c.shoe), prevId]);
        if (c.shoe > split) pieces.push([Math.max(top, split), c.shoe, rad(c.hole)]);
        for (const [a, b, ro] of pieces) {
          if (a < tt) lead.push(ribbon(a, Math.min(b, tt), r, ro, 0.3));
          if (b > tt) tail.push(ribbon(Math.max(a, tt), b, r, ro, 0.3));
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
    return { holes, casings, completion, perfs, strings, hazards };
  }, []);

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
          <group key={c.key}>
            <group visible={shown}>
              <mesh geometry={c.shell} material={def.liner ? m.liner : m.casing} />
              <mesh geometry={c.wall} material={m.wall} />
              <mesh geometry={c.shoe} material={m.shoe} />
              {c.lead.map((g, k) => <mesh key={`l${k}`} geometry={g} material={m.cement} />)}
              {c.tail.map((g, k) => <mesh key={`t${k}`} geometry={g} material={m.tail} />)}
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

      {/* completion: tubing and ESP */}
      <group visible={!!state.completion}>
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
