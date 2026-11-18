/**
 * Surface location, modelled in REAL feet inside a group scaled by SCALE.surface,
 * styled after a real land-rig location: lattice mast with racked stands,
 * substructure, top drive, BOP stack in the cellar, mud system, power, camp,
 * pipe racks, heavy-haul trucks with a crane offloading, test separator and
 * flare, crew on the floor. Primitives and instancing only (no textures).
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { InstancedMesh, Matrix4, Quaternion, Vector3, MeshStandardMaterial, Object3D, Euler, type Group } from 'three';
import { SCALE, ANIM_SECONDS, type Anim } from '../data/well.ts';
import type { SceneState } from '../data/content.ts';
import { C } from '../theme.ts';
import { WellControlStack } from './WellControl.tsx';
import { TestSpread } from './TestSpread.tsx';

type V3 = [number, number, number];
const mat = (color: string, metal = 0.25, rough = 0.6) => new MeshStandardMaterial({ color, metalness: metal, roughness: rough });

function useMats() {
  return useMemo(() => ({
    mast: mat('#F1F2F4', 0.3, 0.5),
    mastTop: mat('#D8452B', 0.3, 0.5),
    navy: mat(C.navy, 0.2, 0.55),
    slate: mat(C.slate, 0.2, 0.6),
    orange: mat(C.orange, 0.2, 0.5),
    red: mat('#C3332A', 0.3, 0.45),
    white: mat('#EEF1F6', 0.05, 0.7),
    cream: mat('#E6E1D2', 0.05, 0.8),
    pale: mat('#B9C4DA', 0.2, 0.6),
    steel: mat('#8E99AC', 0.55, 0.4),
    pipe: mat('#6F7F96', 0.55, 0.4),
    green: mat('#3C7F5A', 0.2, 0.55),
    yellow: mat('#E9B530', 0.25, 0.5),
    dark: mat('#2C3448', 0.3, 0.6),
    tyre: mat('#1E2230', 0, 0.9),
    glass: mat('#5B7BA6', 0.6, 0.2),
    coverall: mat('#F26A21', 0, 0.8),
    helmet: mat('#FFFFFF', 0, 0.5),
    skin: mat('#B9875E', 0, 0.8),
    flame: new MeshStandardMaterial({ color: '#FFC24A', emissive: '#F26A21', emissiveIntensity: 1.2 }),
  }), []);
}
type Mats = ReturnType<typeof useMats>;

const Box = ({ p, s, m, r }: { p: V3; s: V3; m: MeshStandardMaterial; r?: V3 }) => (
  <mesh position={p} rotation={r} material={m}><boxGeometry args={s} /></mesh>
);
const Cyl = ({ p, r, h, m, rot, seg = 20, r2 }: { p: V3; r: number; h: number; m: MeshStandardMaterial; rot?: V3; seg?: number; r2?: number }) => (
  <mesh position={p} rotation={rot} material={m}><cylinderGeometry args={[r, r2 ?? r, h, seg]} /></mesh>
);

/** Instanced bars between point pairs (mast lattice, pipe stacks, racked stands, rails). */
function Bars({ pairs, r, m, seg = 6 }: { pairs: [Vector3, Vector3][]; r: number; m: MeshStandardMaterial; seg?: number }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current!;
    const up = new Vector3(0, 1, 0), q = new Quaternion(), mtx = new Matrix4(), sc = new Vector3();
    pairs.forEach(([a, b], i) => {
      const d = new Vector3().subVectors(b, a);
      q.setFromUnitVectors(up, d.clone().normalize());
      sc.set(1, d.length(), 1);
      mtx.compose(a.clone().add(b).multiplyScalar(0.5), q, sc);
      im.setMatrixAt(i, mtx);
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }, [pairs]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pairs.length]} material={m} castShadow>
      <cylinderGeometry args={[r, r, 1, seg]} />
    </instancedMesh>
  );
}
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** Simple crew member, ~6 ft, orange coverall and white hard hat. */
function Crew({ p, rotY = 0, m }: { p: V3; rotY?: number; m: Mats }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Cyl p={[-0.35, 1.5, 0]} r={0.28} h={3} m={m.navy} seg={8} />
      <Cyl p={[0.35, 1.5, 0]} r={0.28} h={3} m={m.navy} seg={8} />
      <Box p={[0, 4, 0]} s={[1.6, 2.2, 0.9]} m={m.coverall} />
      <Cyl p={[-1.0, 3.9, 0]} r={0.22} h={2} m={m.coverall} seg={6} />
      <Cyl p={[1.0, 3.9, 0]} r={0.22} h={2} m={m.coverall} seg={6} />
      <mesh position={[0, 5.55, 0]} material={m.skin}><sphereGeometry args={[0.45, 10, 8]} /></mesh>
      <mesh position={[0, 5.85, 0]} material={m.helmet}><sphereGeometry args={[0.55, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
    </group>
  );
}

const FLOOR = 27.6, CROWN = 160, MONKEY = 92;

function DrillingRig({ m: m0, drilling, xray }: { m: Mats; drilling: boolean; xray: boolean }) {
  // cutaway: in the cellar view the substructure towers are removed so the stack is in clear view
  const m = m0;
  const { lower, upper } = useMemo(() => {
    const lower: [Vector3, Vector3][] = [], upper: [Vector3, Vector3][] = [];
    const corner = (sx: number, sz: number, y: number) => {
      const t = (y - FLOOR) / (CROWN - FLOOR);
      return v(sx * (7.5 - 5 * t), y, sz * (6.5 - 4 * t));
    };
    const cs: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const levels: number[] = [];
    for (let y = FLOOR; y < CROWN; y += 9) levels.push(y);
    levels.push(CROWN);
    const put = (a: Vector3, b: Vector3) => ((a.y + b.y) / 2 > 128 ? upper : lower).push([a, b]);
    for (let k = 0; k < levels.length - 1; k++) {
      for (const [sx, sz] of cs) put(corner(sx, sz, levels[k]), corner(sx, sz, levels[k + 1]));
      for (let c = 0; c < 4; c++) {
        const [ax, az] = cs[c], [bx, bz] = cs[(c + 1) % 4];
        put(corner(ax, az, levels[k]), corner(bx, bz, levels[k]));
        const vdoor = az === 1 && bz === 1 && levels[k] < 60;
        if (!vdoor) put(k % 2 ? corner(ax, az, levels[k]) : corner(bx, bz, levels[k]), k % 2 ? corner(bx, bz, levels[k + 1]) : corner(ax, az, levels[k + 1]));
      }
    }
    for (let c = 0; c < 4; c++) put(corner(...cs[c], CROWN), corner(...cs[(c + 1) % 4], CROWN));
    return { lower, upper };
  }, []);
  // stands racked in the setback (left of well centre, behind the V-door)
  const stands = useMemo(() => {
    const out: [Vector3, Vector3][] = [];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
      const x = -3.8 + j * 0.75, z = -4.5 + i * 0.95;
      out.push([v(x, FLOOR + 0.2, z), v(x * 0.82, MONKEY + 2, z * 0.86)]);
    }
    return out;
  }, []);
  const rails = useMemo(() => {
    const out: [Vector3, Vector3][] = [];
    const y1 = FLOOR + 3.5;
    const pts = [v(-16, y1, -22), v(16, y1, -22), v(16, y1, 22), v(5, y1, 22)];
    for (let i = 0; i < pts.length - 1; i++) out.push([pts[i], pts[i + 1]]);
    out.push([v(-5, y1, 22), v(-16, y1, 22)], [v(-16, y1, 22), v(-16, y1, -22)]);
    for (const p of [...pts, v(-5, y1, 22), v(-16, y1, 22)]) out.push([v(p.x, FLOOR, p.z), p]);
    return out;
  }, []);
  return (
    <group>
      {/* substructure: two box-girder towers either side of the cellar */}
      {[-12, 12].map((x) => (
        <group key={x} visible={!xray}>
          <Box p={[x, FLOOR / 2, 0]} s={[7, FLOOR - 2, 44]} m={m.cream} />
          <Box p={[x, 1.2, 0]} s={[9, 2.4, 48]} m={m.slate} />
          {[-15, -5, 5, 15].map((z) => <Box key={z} p={[x + (x > 0 ? -3.6 : 3.6), FLOOR / 2, z]} s={[0.4, FLOOR - 4, 0.6]} m={m.slate} />)}
        </group>
      ))}
      {/* rig floor with an opening at well centre */}
      <Box p={[0, FLOOR - 0.75, -12]} s={[34, 1.5, 20]} m={m.slate} />
      <Box p={[-10.5, FLOOR - 0.75, 11]} s={[13, 1.5, 26]} m={m.slate} />
      <Box p={[10.5, FLOOR - 0.75, 11]} s={[13, 1.5, 26]} m={m.slate} />
      <Box p={[0, FLOOR - 0.75, 16]} s={[8, 1.5, 16]} m={m.slate} />
      <Bars pairs={rails} r={0.12} m={m.yellow} seg={5} />
      {/* rotary table */}
      <Cyl p={[0, FLOOR + 0.4, 0]} r={2.8} h={0.8} m={m.dark} />
      {/* mast lattice: white, red crown section */}
      <Bars pairs={lower} r={0.42} m={m.mast} />
      <Bars pairs={upper} r={0.42} m={m.mastTop} />
      <Box p={[0, CROWN + 3, 0]} s={[7, 5, 6]} m={m.red} />
      {/* monkey board and racked stands */}
      <Box p={[-4, MONKEY, 0]} s={[5, 0.6, 11]} m={m.yellow} />
      <Bars pairs={stands} r={0.27} m={m.pipe} />
      {/* drill line, travelling block, top drive */}
      <Cyl p={[0, (CROWN + 104) / 2, 0.8]} r={0.1} h={CROWN - 104} m={m.dark} seg={4} />
      <Cyl p={[0, (CROWN + 104) / 2, -0.8]} r={0.1} h={CROWN - 104} m={m.dark} seg={4} />
      <Box p={[0, 108, 0]} s={[3.4, 6, 3]} m={m.yellow} />
      <Box p={[0, 99, 0]} s={[4.2, 11, 3.8]} m={m.orange} />
      {/* pipe from top drive to the rotary (drilling) */}
      {drilling && <Cyl p={[0, (93 - 6) / 2, 0]} r={0.28} h={93 + 6} m={m.pipe} seg={10} />}
      {/* drawworks, doghouse, driller's cabin */}
      <Box p={[0, FLOOR + 4, -17]} s={[14, 7, 6]} m={m.navy} />
      <Box p={[-23, FLOOR + 5.5, -10]} s={[12, 10, 16]} m={m.white} />
      <Box p={[-23, FLOOR + 6.5, -1.9]} s={[8, 3, 0.2]} m={m.glass} />
      <Box p={[11, FLOOR + 4, -6]} s={[5, 7, 5]} m={m.white} />
      <Box p={[11, FLOOR + 5, -3.4]} s={[3.6, 2.4, 0.2]} m={m.glass} />
      {/* V-door ramp and catwalk with a joint ready */}
      <mesh position={[0, FLOOR / 2 + 0.5, 39]} rotation={[-Math.atan2(FLOOR, 46), 0, 0]} material={m.slate}><boxGeometry args={[5, 1, 54]} /></mesh>
      <Box p={[0, 2.2, 78]} s={[6, 4.4, 34]} m={m.slate} />
      <Cyl p={[0, 5, 78]} r={0.45} h={32} m={m.pipe} rot={[Math.PI / 2, 0, 0]} seg={10} />
      {/* stairs */}
      <mesh position={[-21, FLOOR / 2, 26]} rotation={[0.85, 0, 0]} material={m.yellow}><boxGeometry args={[3, 0.6, 36]} /></mesh>
      {/* crew on the floor */}
      <Crew p={[3.6, FLOOR, 3]} rotY={-0.6} m={m} />
      <Crew p={[-3.4, FLOOR, 4.2]} rotY={0.7} m={m} />
      <Crew p={[11, FLOOR, -1]} rotY={3.1} m={m} />
      <Crew p={[-4, MONKEY + 0.3, 3]} rotY={1.6} m={m} />
    </group>
  );
}

function WorkoverRig({ m }: { m: Mats }) {
  return (
    <group>
      {/* self-propelled carrier backed up to the wellhead, mast raised */}
      <group position={[0, 0, -34]}>
        <Box p={[0, 5.5, 0]} s={[10, 4, 46]} m={m.navy} />
        <Box p={[0, 11, -20]} s={[9, 7, 7]} m={m.white} />
        <Box p={[0, 12, -16.5]} s={[7.6, 3, 0.2]} m={m.glass} />
        {[-18, -8, 2, 12, 18].map((z) => (
          <group key={z}>
            <Cyl p={[5.4, 2.4, z]} r={2.4} h={1.6} m={m.tyre} rot={[0, 0, Math.PI / 2]} seg={14} />
            <Cyl p={[-5.4, 2.4, z]} r={2.4} h={1.6} m={m.tyre} rot={[0, 0, Math.PI / 2]} seg={14} />
          </group>
        ))}
        <Box p={[0, 9, 4]} s={[8, 6, 10]} m={m.yellow} />
      </group>
      {[-3, 3].map((x) => <mesh key={x} position={[x, 52, -16]} rotation={[0.07, 0, 0]} material={m.mast}><boxGeometry args={[1, 96, 1]} /></mesh>)}
      {Array.from({ length: 12 }, (_, i) => <Box key={i} p={[0, 10 + i * 7.6, -18.6 + i * 0.53]} s={[6, 0.4, 0.4]} m={m.mastTop} />)}
      <Box p={[0, 100, -12.5]} s={[5, 4, 5]} m={m.red} />
      <Box p={[0, 62, -9]} s={[2.6, 5, 2.4]} m={m.orange} />
      <Cyl p={[0, 80, -10.5]} r={0.08} h={38} m={m.dark} seg={4} />
      {/* work platform over the tree */}
      <Box p={[0, 8, 0]} s={[16, 0.8, 16]} m={m.slate} />
      <Crew p={[3.5, 8.4, 3]} rotY={-0.5} m={m} />
      <Crew p={[-4, 8.4, 2]} rotY={0.8} m={m} />
    </group>
  );
}

function PipeStack({ origin, len, n, rows, r, m }: { origin: V3; len: number; n: number; rows: number; r: number; m: MeshStandardMaterial }) {
  const pairs = useMemo(() => {
    const out: [Vector3, Vector3][] = [];
    for (let row = 0; row < rows; row++)
      for (let i = 0; i < n - row; i++) {
        const z = origin[2] + (i + row * 0.5) * r * 2.1, y = origin[1] + r + row * r * 1.8;
        out.push([v(origin[0], y, z), v(origin[0] + len, y, z)]);
      }
    return out;
  }, [origin, len, n, rows, r]);
  return <Bars pairs={pairs} r={r} m={m} seg={10} />;
}

function Truck({ p, m, load, rotY = 0 }: { p: V3; m: Mats; load: boolean; rotY?: number }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Box p={[0, 5.4, 0]} s={[9, 7, 8.4]} m={m.white} />
      <Box p={[-4.55, 6.6, 0]} s={[0.2, 3, 7]} m={m.glass} />
      <Box p={[0, 2.4, 0]} s={[9.4, 2, 8.8]} m={m.navy} />
      <Box p={[24, 3.6, 0]} s={[40, 1.2, 8.5]} m={m.slate} />
      {[-2, 4, 32, 36, 40].map((x) => (
        <group key={x}>
          <Cyl p={[x, 1.7, 4.3]} r={1.7} h={1.3} m={m.tyre} rot={[Math.PI / 2, 0, 0]} seg={14} />
          <Cyl p={[x, 1.7, -4.3]} r={1.7} h={1.3} m={m.tyre} rot={[Math.PI / 2, 0, 0]} seg={14} />
        </group>
      ))}
      {load && <PipeStack origin={[6, 4.2, -3.6]} len={38} n={5} rows={3} r={0.75} m={m.pipe} />}
    </group>
  );
}

/** Mobile crane lifting a casing bundle off a trailer (offloading & staging). */
function Crane({ p, m }: { p: V3; m: Mats }) {
  return (
    <group position={p}>
      <Box p={[0, 4, 0]} s={[36, 5, 10]} m={m.yellow} />
      {[-14, -6, 6, 14].map((x) => (
        <group key={x}>
          <Cyl p={[x, 2.2, 5.2]} r={2.2} h={1.4} m={m.tyre} rot={[Math.PI / 2, 0, 0]} seg={14} />
          <Cyl p={[x, 2.2, -5.2]} r={2.2} h={1.4} m={m.tyre} rot={[Math.PI / 2, 0, 0]} seg={14} />
        </group>
      ))}
      <Box p={[-15, 9, 3]} s={[6, 5, 4]} m={m.white} />
      <Box p={[4, 8.5, 0]} s={[10, 4, 8]} m={m.yellow} />
      {/* boom */}
      <mesh position={[18, 30, 0]} rotation={[0, 0, Math.atan2(44, 28) - Math.PI / 2]} material={m.yellow}><boxGeometry args={[2.4, Math.hypot(44, 28), 2.4]} /></mesh>
      <Cyl p={[32, 34, 0]} r={0.08} h={36} m={m.dark} seg={4} />
      <PipeStack origin={[18, 14, -2]} len={28} n={3} rows={2} r={0.75} m={m.pipe} />
      {[-24, 24].map((x) => <Box key={x} p={[x * 0.6, 1, 9]} s={[1.2, 2, 6]} m={m.slate} />)}
    </group>
  );
}

function Trees({ m }: { m: Mats }) {
  const ref = useRef<InstancedMesh>(null);
  const trunks = useRef<InstancedMesh>(null);
  const items = useMemo(() => {
    // deterministic pseudo-random ring of trees around the location (outside the pad)
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const out: { x: number; z: number; s: number }[] = [];
    while (out.length < 170) {
      const x = -520 + rnd() * 1100, z = -340 + rnd() * 480;
      if (Math.abs(x) < 190 && z > -150) continue; // keep the pad and the section plane clear
      if (z > -12) continue; // only behind the cutaway plane
      out.push({ x, z, s: 0.7 + rnd() * 0.8 });
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const o = new Object3D();
    items.forEach((t, i) => {
      o.position.set(t.x, 16 * t.s, t.z); o.scale.setScalar(t.s); o.rotation.copy(new Euler(0, t.x, 0)); o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
      o.position.set(t.x, 3 * t.s, t.z); o.updateMatrix();
      trunks.current!.setMatrixAt(i, o.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    trunks.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
    trunks.current!.computeBoundingSphere();
  }, [items]);
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, items.length]} material={m.green} castShadow>
        <coneGeometry args={[7, 24, 7]} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, items.length]} material={m.slate}>
        <cylinderGeometry args={[0.8, 1, 6, 5]} />
      </instancedMesh>
    </group>
  );
}

function Site({ m, separator, focusSeparator }: { m: Mats; separator: boolean; focusSeparator: boolean }) {
  return (
    <group>
      {/* pipe racks with casing joints staged next to the catwalk */}
      {[0, 1].map((k) => (
        <group key={k}>
          {[84, 100, 116].map((x) => <Box key={x} p={[x, 1.5, 14 + k * 18]} s={[1, 3, 14]} m={m.slate} />)}
          <PipeStack origin={[80, 3, 8.6 + k * 18]} len={40} n={7} rows={k === 0 ? 3 : 2} r={0.85} m={k === 0 ? m.pipe : m.steel} />
        </group>
      ))}
      <Crew p={[92, 0, 46]} rotY={2.4} m={m} />
      <Crew p={[110, 0, 48]} rotY={-2.2} m={m} />
      {/* heavy-haul trucks and the crane offloading */}
      <Truck p={[150, 0, 70]} m={m} load />
      <Truck p={[150, 0, 98]} m={m} load />
      <Crane p={[118, 0, 128]} m={m} />
      <Crew p={[140, 0, 84]} rotY={1.2} m={m} />
      {/* mud system: tanks, shakers, mud pumps behind the rig */}
      {[-42, -16, 10].map((x) => (
        <group key={x}>
          <Box p={[x, 6, -50]} s={[24, 12, 12]} m={m.pale} />
          <Box p={[x, 12.6, -50]} s={[24.4, 1.2, 12.4]} m={m.slate} />
        </group>
      ))}
      <Box p={[0, 15, -38]} s={[10, 4, 8]} m={m.navy} />
      <Box p={[0, 9, -38]} s={[10, 8, 8]} m={m.slate} />
      {[-12, 6].map((z) => (
        <group key={z}>
          <Box p={[-84, 6, z]} s={[20, 10, 10]} m={m.navy} />
          <Cyl p={[-72, 6, z]} r={2.6} h={4} m={m.red} rot={[0, 0, Math.PI / 2]} />
        </group>
      ))}
      {/* power: generators, fuel and water tanks */}
      {[30, 44].map((z) => <Box key={z} p={[-124, 6, z]} s={[32, 12, 10]} m={m.white} />)}
      <Cyl p={[-170, 6, 30]} r={6} h={30} m={m.cream} rot={[0, 0, Math.PI / 2]} />
      <Cyl p={[-170, 6, -10]} r={6} h={30} m={m.pale} rot={[0, 0, Math.PI / 2]} />
      {/* camp / office cabins */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i}>
          <Box p={[160 + i * 0, 5, -60 + i * 16]} s={[34, 10, 12]} m={m.white} />
          <Box p={[160, 10.4, -60 + i * 16]} s={[34.4, 0.8, 12.4]} m={m.navy} />
        </group>
      ))}
      {/* BOP accumulator (koomey) and barite silos */}
      <Box p={[48, 4, -34]} s={[14, 8, 7]} m={m.red} />
      {[62, 74].map((x) => <Cyl key={x} p={[x, 20, -76]} r={5} h={40} m={m.white} />)}

      <TestSpread visible={separator} focus={focusSeparator} />
    </group>
  );
}

export function Surface({ state, anim }: { state: SceneState; anim?: Anim }) {
  const m = useMats();
  const S = SCALE.surface;
  const sep = state.focus === 'separator' || !!state.completion;
  const drilling = ['s26', 's17', 's12', 's8'].includes(state.focus ?? '');
  const root = useRef<Group>(null);
  // nipple-up: the diverter / BOP is lowered onto the wellhead
  const eqRef = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const start = useRef(0);
  useEffect(() => { start.current = performance.now(); invalidate(); }, [anim?.key, invalidate]);
  useFrame(() => {
    if (!eqRef.current) return;
    const on = anim?.kind === 'bop';
    const t = on ? Math.min(1, (performance.now() - start.current) / (ANIM_SECONDS.bop * 1000)) : 1;
    const e = t * t * (3 - 2 * t);
    eqRef.current.position.y = (1 - e) * 26;
    if (t < 1) invalidate();
  });
  useLayoutEffect(() => {
    root.current?.traverse((o) => { o.castShadow = true; });
  });
  return (
    <group>
      <group scale={S} ref={root}>
        {state.rig === 'drilling' ? <DrillingRig m={m} drilling={drilling} xray={state.focus === 'cellar'} /> : <WorkoverRig m={m} />}
        <WellControlStack equipment={state.equipment} built={state.built} eqRef={eqRef} />
        <Site m={m} separator={sep} focusSeparator={state.focus === 'separator'} />
        <Trees m={m} />
      </group>
    </group>
  );
}
