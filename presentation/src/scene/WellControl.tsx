/**
 * Detailed well-control equipment in the cellar, modelled in real feet:
 * concrete cellar, wellhead sections A/B/C with gate valves, diverter with
 * its vent line and knife valve, double/triple ram BOP with bonnets and
 * operators, annular preventer, drilling spool with choke and kill lines
 * (manual + HCR valves), bell nipple and flowline, and the X-mas tree.
 * Studs are instanced; everything else is simple primitives.
 */
import { useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { InstancedMesh, MeshStandardMaterial, Object3D, type Group } from 'three';
import { RoundedBox } from '@react-three/drei';
import type { Equipment, SceneState } from '../data/content.ts';

type V3 = [number, number, number];
const std = (color: string, metalness: number, roughness: number) => new MeshStandardMaterial({ color, metalness, roughness });

function useWcMats() {
  return useMemo(() => ({
    red: std('#BF2E26', 0.35, 0.38),
    redDark: std('#8E1F1A', 0.35, 0.45),
    steel: std('#A7AFBA', 0.85, 0.3),
    stud: std('#C9CED6', 0.9, 0.25),
    green: std('#2E7A58', 0.35, 0.42),
    dark: std('#262B36', 0.4, 0.55),
    wheel: std('#E9B530', 0.3, 0.4),
    hose: std('#1D2129', 0.1, 0.8),
    concrete: std('#BEB8AC', 0, 0.95),
    concreteDark: std('#9C978C', 0, 0.95),
    gauge: std('#F3F4F6', 0.2, 0.3),
  }), []);
}
type M = ReturnType<typeof useWcMats>;

const Cyl = ({ p, r, h, m, rot, seg = 28, r2 }: { p: V3; r: number; h: number; m: MeshStandardMaterial; rot?: V3; seg?: number; r2?: number }) => (
  <mesh position={p} rotation={rot} material={m} castShadow receiveShadow><cylinderGeometry args={[r, r2 ?? r, h, seg]} /></mesh>
);
const Box = ({ p, s, m, r }: { p: V3; s: V3; m: MeshStandardMaterial; r?: V3 }) => (
  <mesh position={p} rotation={r} material={m} castShadow receiveShadow><boxGeometry args={s} /></mesh>
);

/** Ring of studs on a flange (instanced). */
function Studs({ y, ring, n, len, m }: { y: number; ring: number; n: number; len: number; m: MeshStandardMaterial }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new Object3D();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      o.position.set(Math.cos(a) * ring, y, Math.sin(a) * ring);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [y, ring, n]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} material={m} castShadow>
      <cylinderGeometry args={[0.09, 0.09, len, 6]} />
    </instancedMesh>
  );
}

/** Body between two flanges, with studs top and bottom. */
function Flanged({ y, r, h, m, mats, studs = 16 }: { y: number; r: number; h: number; m: MeshStandardMaterial; mats: M; studs?: number }) {
  const fr = r * 1.32, ft = 0.42;
  return (
    <group position={[0, y, 0]}>
      <Cyl p={[0, 0, 0]} r={r} h={h} m={m} />
      <Cyl p={[0, h / 2 - ft / 2, 0]} r={fr} h={ft} m={m} />
      <Cyl p={[0, -h / 2 + ft / 2, 0]} r={fr} h={ft} m={m} />
      <Studs y={h / 2 - ft / 2} ring={fr * 0.86} n={studs} len={ft * 2.2} m={mats.stud} />
      <Studs y={-h / 2 + ft / 2} ring={fr * 0.86} n={studs} len={ft * 2.2} m={mats.stud} />
    </group>
  );
}

/** Gate valve with bonnet and handwheel; local +X is the flow direction. */
function GateValve({ p, rotY = 0, s = 1, body, mats, hcr = false }: { p: V3; rotY?: number; s?: number; body: MeshStandardMaterial; mats: M; hcr?: boolean }) {
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <Cyl p={[-0.55, 0, 0]} r={0.62} h={0.22} m={body} rot={[0, 0, Math.PI / 2]} />
      <Cyl p={[0.55, 0, 0]} r={0.62} h={0.22} m={body} rot={[0, 0, Math.PI / 2]} />
      <RoundedBox args={[1.0, 1.1, 0.95]} radius={0.12} smoothness={3} material={body} castShadow />
      <Cyl p={[0, 0.85, 0]} r={0.32} h={0.7} m={body} />
      {hcr ? (
        <group>
          <Cyl p={[0, 1.55, 0]} r={0.5} h={0.8} m={mats.dark} />
          <Cyl p={[0, 2.0, 0]} r={0.55} h={0.12} m={mats.dark} />
        </group>
      ) : (
        <group>
          <Cyl p={[0, 1.45, 0]} r={0.05} h={0.6} m={mats.steel} seg={8} />
          <mesh position={[0, 1.75, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.wheel} castShadow><torusGeometry args={[0.55, 0.06, 8, 24]} /></mesh>
          {[0, Math.PI / 2].map((a) => <Box key={a} p={[0, 1.75, 0]} s={[1.05, 0.06, 0.06]} m={mats.wheel} r={[0, a, 0]} />)}
        </group>
      )}
    </group>
  );
}

/** Horizontal side outlet with a flanged pipe and one or two valves. */
function Outlet({ y, dir, r = 0.32, len = 2.6, children }: { y: number; dir: number; r?: number; len?: number; children?: ReactNode }) {
  return (
    <group position={[0, y, 0]} rotation={[0, dir, 0]}>
      <mesh position={[len / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[r, r, len, 16]} /><meshStandardMaterial color="#A7AFBA" metalness={0.85} roughness={0.3} /></mesh>
      {children}
    </group>
  );
}

/** Ram preventer block with two bonnets and hydraulic operators. */
function RamBlock({ y, mats, w = 6.2 }: { y: number; mats: M; w?: number }) {
  const side = (s: 1 | -1) => (
    <group key={s} position={[(s * w) / 2, 0, 0]} rotation={[0, 0, (s * Math.PI) / 2]}>
      <Cyl p={[0, -0.2 * s, 0]} r={1.5} h={0.4} m={mats.red} rot={[0, 0, 0]} />
      <Cyl p={[0, -1.25 * s, 0]} r={1.22} h={1.8} m={mats.red} />
      <Cyl p={[0, -2.4 * s, 0]} r={0.95} h={0.6} m={mats.redDark} />
      <Cyl p={[0, -2.9 * s, 0]} r={0.35} h={0.5} m={mats.steel} />
    </group>
  );
  return (
    <group position={[0, y, 0]}>
      <RoundedBox args={[w, 2.5, 4.6]} radius={0.35} smoothness={3} material={mats.red} castShadow receiveShadow />
      {side(1)}{side(-1)}
      {/* hydraulic hoses to the operators */}
      <Cyl p={[0, 0.9, 2.35]} r={0.08} h={w - 0.6} m={mats.hose} rot={[0, 0, Math.PI / 2]} seg={6} />
    </group>
  );
}

/** Annular preventer: wide body with a domed head. */
function Annular({ y, r, mats }: { y: number; r: number; mats: M }) {
  return (
    <group position={[0, y, 0]}>
      <Cyl p={[0, 0, 0]} r={r} h={2.2} m={mats.red} />
      <mesh position={[0, 1.1, 0]} scale={[1, 0.42, 1]} material={mats.red} castShadow><sphereGeometry args={[r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <Cyl p={[0, -1.25, 0]} r={r * 1.12} h={0.4} m={mats.red} />
      <Studs y={-1.25} ring={r * 1.0} n={20} len={0.9} m={mats.stud} />
      <Cyl p={[0, 2.05, 0]} r={r * 0.42} h={0.6} m={mats.red} />
    </group>
  );
}

function Cellar({ mats }: { mats: M }) {
  const d = 6, half = 7.5, t = 0.8;
  return (
    <group>
      {[[0, -half], [0, half]].map(([x, z], i) => <Box key={`z${i}`} p={[x, -d / 2, z]} s={[half * 2 + t, d, t]} m={mats.concrete} />)}
      {[[-half, 0], [half, 0]].map(([x, z], i) => <Box key={`x${i}`} p={[x, -d / 2, z]} s={[t, d, half * 2]} m={mats.concrete} />)}
      <Box p={[0, -d - 0.05, 0]} s={[half * 2, 0.1, half * 2]} m={mats.concreteDark} />
      {/* ladder */}
      {[-0.7, 0.7].map((x) => <Box key={x} p={[x - 5, -d / 2, -half + 0.6]} s={[0.12, d, 0.12]} m={mats.wheel} />)}
      {Array.from({ length: 6 }, (_, i) => <Box key={i} p={[-5, -d + 0.8 + i * 0.9, -half + 0.6]} s={[1.4, 0.08, 0.08]} m={mats.wheel} />)}
    </group>
  );
}

export function WellControlStack({ equipment, built, eqRef }: { equipment: Equipment; built: SceneState['built']; eqRef: RefObject<Group | null> }) {
  const m = useWcMats();
  const lvl = built === 'none' ? 0 : built === 's26' ? 1 : built === 's17' ? 2 : 3;

  // wellhead sections, bottom up from the cellar floor
  const heads: ReactNode[] = [];
  let top = -6;
  const section = (key: string, r: number, h: number) => {
    const y = top + h / 2;
    heads.push(
      <group key={key}>
        <Flanged y={y} r={r} h={h} m={m.green} mats={m} />
        <Outlet y={y} dir={0} len={2.2}><GateValve p={[2.6, 0, 0]} body={m.green} mats={m} /></Outlet>
        <Outlet y={y} dir={Math.PI} len={2.2}><GateValve p={[2.6, 0, 0]} body={m.green} mats={m} /></Outlet>
      </group>,
    );
    top += h;
  };
  if (lvl >= 1 || equipment !== 'none') section('A', 2.2, 2.6);
  if (lvl >= 2) section('B', 1.9, 2.4);
  if (lvl >= 3) section('C', 1.6, 2.2);
  const b = top;

  const bell = (y: number) => (
    <group>
      <Cyl p={[0, y + 1.6, 0]} r={1.25} r2={1.4} h={3.2} m={m.steel} />
      <Cyl p={[0, y + 1.6, -4.5]} r={0.55} h={6.6} m={m.steel} rot={[Math.PI / 2, 0, 0]} seg={16} />
      <Cyl p={[0, y + 1.6, -30]} r={0.55} h={44} m={m.steel} rot={[Math.PI / 2, 0, 0]} seg={12} />
    </group>
  );

  const bopStack = (three: boolean, annR: number) => {
    let y = b;
    const parts: ReactNode[] = [];
    // drilling spool with choke (+X) and kill (-X) lines: manual + HCR valves
    parts.push(
      <group key="spool">
        <Flanged y={y + 1.2} r={1.9} h={2.4} m={m.red} mats={m} />
        <Outlet y={y + 1.2} dir={0} len={6.5}>
          <GateValve p={[2.4, 0, 0]} body={m.red} mats={m} />
          <GateValve p={[4.3, 0, 0]} body={m.red} mats={m} hcr />
        </Outlet>
        <Outlet y={y + 1.2} dir={Math.PI} len={5}>
          <GateValve p={[2.4, 0, 0]} body={m.red} mats={m} />
          <GateValve p={[4.0, 0, 0]} body={m.red} mats={m} />
        </Outlet>
      </group>,
    );
    y += 2.4;
    const rams = three ? 3 : 2;
    for (let i = 0; i < rams; i++) { parts.push(<RamBlock key={`r${i}`} y={y + 1.35} mats={m} />); y += 2.7; }
    parts.push(<Annular key="ann" y={y + 1.35} r={annR} mats={m} />);
    y += 3.6;
    parts.push(<group key="bell">{bell(y)}</group>);
    return parts;
  };

  return (
    <group>
      <Cellar mats={m} />
      {heads}
      <group ref={eqRef}>
        {equipment === 'diverter' && (
          <group>
            <Flanged y={b + 1.2} r={2.4} h={2.4} m={m.red} mats={m} />
            {/* diverter housing with packer element */}
            <Cyl p={[0, b + 4.1, 0]} r={3.3} h={3.4} m={m.red} />
            <Cyl p={[0, b + 5.95, 0]} r={2.6} h={0.5} m={m.redDark} />
            <Studs y={b + 5.95} ring={2.9} n={20} len={0.7} m={m.stud} />
            {/* vent line with knife valve to the safe discharge area */}
            <Outlet y={b + 3.2} dir={Math.PI} r={0.62} len={34}>
              <group position={[5, 0, 0]}>
                <RoundedBox args={[1.2, 2.2, 1.8]} radius={0.15} material={m.red} castShadow />
                <Cyl p={[0, 1.9, 0]} r={0.55} h={1.6} m={m.dark} />
              </group>
            </Outlet>
            {bell(b + 6.2)}
          </group>
        )}
        {equipment === 'bop21' && <group>{bopStack(false, 3.6)}</group>}
        {equipment === 'bop13' && <group>{bopStack(true, 3.1)}</group>}
        {equipment === 'tree' && (
          <group>
            <Flanged y={b + 0.7} r={1.4} h={1.4} m={m.green} mats={m} studs={12} />
            {/* lower and upper master valves (vertical gate valves) */}
            {[2.2, 4.0].map((yy) => (
              <group key={yy} position={[0, b + yy, 0]} rotation={[0, 0, Math.PI / 2]}>
                <GateValve p={[0, 0, 0]} s={1.35} body={m.green} mats={m} />
              </group>
            ))}
            {/* flow cross with wing valves and choke */}
            <RoundedBox args={[1.7, 1.5, 1.7]} radius={0.15} position={[0, b + 5.6, 0]} material={m.green} castShadow />
            <Outlet y={b + 5.6} dir={0} len={5}>
              <GateValve p={[1.8, 0, 0]} body={m.green} mats={m} />
              <GateValve p={[3.4, 0, 0]} body={m.green} mats={m} hcr />
              <Cyl p={[4.6, 0.5, 0]} r={0.45} h={1.4} m={m.dark} />
            </Outlet>
            <Outlet y={b + 5.6} dir={Math.PI} len={2.4}><GateValve p={[1.8, 0, 0]} body={m.green} mats={m} /></Outlet>
            {/* swab valve, tree cap and gauge */}
            <group position={[0, b + 7.2, 0]} rotation={[0, 0, Math.PI / 2]}><GateValve p={[0, 0, 0]} s={1.15} body={m.green} mats={m} /></group>
            <Cyl p={[0, b + 8.4, 0]} r={0.75} h={0.6} m={m.green} />
            <Cyl p={[0, b + 8.9, 0]} r={0.12} h={0.5} m={m.steel} seg={8} />
            <Cyl p={[0, b + 9.3, 0.12]} r={0.32} h={0.12} m={m.gauge} rot={[Math.PI / 2, 0, 0]} />
          </group>
        )}
      </group>
    </group>
  );
}
