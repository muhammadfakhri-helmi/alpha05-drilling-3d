import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { FORMATIONS, EARTH_BOTTOM_TVD, CELLAR_Y, rad } from '../data/well.ts';
import { C } from '../theme.ts';

export const WALL_Z = -rad(30) - 60;
const X0 = -2200, X1 = 6400;
export const RULER_X = -420;
/** Ruler ticks at TVDs that are printed on the slides (shoe and TD depths). */
export const RULER_TICKS: [number, string][] = [
  [1956, '1,956 ft TVD'],
  [4564, '4,564 ft TVD'],
  [8261, '8,261 ft TVD'],
  [8561, '8,561 ft TVD'],
];

export function Earth() {
  const bands = useMemo(() => FORMATIONS.map((f, i) => {
    const bot = i < FORMATIONS.length - 1 ? FORMATIONS[i + 1].tvd : EARTH_BOTTOM_TVD;
    return { ...f, top: f.tvd, h: bot - f.tvd };
  }), []);
  const minor = useMemo(() => {
    const segs: Vector3[][] = [];
    for (let t = 500; t < 9000; t += 500) segs.push([new Vector3(RULER_X - (t % 1000 === 0 ? 50 : 30), -t, 0), new Vector3(RULER_X, -t, 0)]);
    return segs;
  }, []);

  return (
    <group>
      {/* formation cross-section behind the cutaway */}
      {bands.map((b) => (
        <mesh key={b.name} position={[(X0 + X1) / 2, -b.top - b.h / 2, WALL_Z]}>
          <planeGeometry args={[X1 - X0, b.h]} />
          <meshBasicMaterial color={b.color} />
        </mesh>
      ))}
      {bands.slice(1).map((b) => (
        <Line key={b.name} points={[[X0, -b.top, WALL_Z + 1], [X1, -b.top, WALL_Z + 1]]} color={C.slate} lineWidth={1} transparent opacity={0.35} />
      ))}

      {/* ground behind the section plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[(X0 + X1) / 2, 0, (WALL_Z - 4000) / 2]}>
        <planeGeometry args={[X1 - X0 + 30000, 4000 + WALL_Z]} />
        <meshStandardMaterial color={C.ground} roughness={1} />
      </mesh>

      {/* far field behind the location */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(X0 + X1) / 2, -2, -4000 - 15000]}>
        <planeGeometry args={[80000, 30000]} />
        <meshStandardMaterial color="#C9D6B8" roughness={1} />
      </mesh>
      {/* concrete pad around the rig with an open cellar (schematic surface scale) */}
      <Pad />

      {/* TVD ruler: true vertical scale */}
      <Line points={[[RULER_X, 0, 0], [RULER_X, -8561, 0]]} color={C.navy} lineWidth={2} />
      {minor.map((s, i) => <Line key={i} points={s} color={C.navy} lineWidth={1} transparent opacity={0.55} />)}
      {RULER_TICKS.map(([t]) => (
        <Line key={t} points={[[RULER_X - 80, -t, 0], [RULER_X + 20, -t, 0]]} color={C.orange} lineWidth={3} />
      ))}
    </group>
  );
}

function Pad() {
  const half = 1500, cellar = 110;
  const parts: [number, number, number, number][] = [
    // x, z, width, depth
    [-(half + cellar) / 2, 0, half - cellar, half * 2],
    [(half + cellar) / 2, 0, half - cellar, half * 2],
    [0, -(half + cellar) / 2, cellar * 2, half - cellar],
    [0, (half + cellar) / 2, cellar * 2, half - cellar],
  ];
  return (
    <group>
      {parts.map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.5, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color={C.pad} roughness={0.95} />
        </mesh>
      ))}
      {/* cellar floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, CELLAR_Y, 0]}>
        <planeGeometry args={[cellar * 2, cellar * 2]} />
        <meshStandardMaterial color={C.slate} roughness={1} />
      </mesh>
    </group>
  );
}
