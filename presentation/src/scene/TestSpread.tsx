/**
 * Surface well-test spread (illustrative layout, real feet inside the surface
 * group). The drilling program (Section 5.7 E) gives the sequence only: flow
 * to cleanup / flare until clear of perforation debris, then through the
 * surface test separator to measure oil, water and gas. The routing below is
 * an illustration of that sequence:
 *
 *   tree wing valve -> choke manifold -> (cleanup) flare
 *                                     -> (test) separator -> gas to flare
 *                                                         -> oil meter -> oil tank
 *                                                         -> water meter -> water tank
 *
 * Lines are colour-coded by fluid; while the test step is on screen, moving
 * dots show the flow (cleanup first, then the separator).
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { InstancedMesh, MeshStandardMaterial, MeshBasicMaterial, Object3D, Vector3 } from 'three';

type P = [number, number, number];
const G = 0.7; // pipe centre height on supports

export const LINES: Record<'well' | 'cleanup' | 'test' | 'gas' | 'oil' | 'water', P[]> = {
  well: [[5.2, 6.8, 0], [8, 6.8, 0], [8, G, 0], [8, G, 22], [-23, G, 22]],
  cleanup: [[-33, G, 23.5], [-104, G, 23.5], [-104, G, 108], [-147, G, 108]],
  test: [[-33, G, 20.5], [-48, G, 20.5], [-48, G, 60], [-55, G, 60], [-55, 12, 60], [-60.5, 12, 60]],
  gas: [[-74, 13, 60], [-74, 17, 60], [-74, 17, 90], [-74, 2.2, 90], [-140, 2.2, 90], [-140, 2.2, 106], [-147, 2.2, 106]],
  oil: [[-72, 6, 64], [-72, 6, 70], [-72, G, 70], [-87, G, 70]],
  water: [[-66, 6, 56], [-66, 6, 48], [-66, G, 48], [-87, G, 48]],
};
const COLORS = { well: '#14307A', cleanup: '#F26A21', test: '#14307A', gas: '#E9B530', oil: '#4A3420', water: '#1F8FD6' };

const std = (c: string, m = 0.4, r = 0.45) => new MeshStandardMaterial({ color: c, metalness: m, roughness: r });

function Pipe({ pts, r, m }: { pts: P[]; r: number; m: MeshStandardMaterial }) {
  const segs = useMemo(() => pts.slice(1).map((b, i) => {
    const a = new Vector3(...pts[i]), e = new Vector3(...b);
    const mid = a.clone().add(e).multiplyScalar(0.5), d = e.clone().sub(a);
    const o = new Object3D(); o.position.copy(mid); o.lookAt(e); o.rotateX(Math.PI / 2);
    return { pos: mid.toArray() as P, rot: [o.rotation.x, o.rotation.y, o.rotation.z] as P, len: d.length() };
  }), [pts]);
  return (
    <group>
      {segs.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot} material={m} castShadow><cylinderGeometry args={[r, r, s.len, 14]} /></mesh>
      ))}
      {pts.slice(1, -1).map((p, i) => <mesh key={`e${i}`} position={p} material={m}><sphereGeometry args={[r * 1.05, 12, 8]} /></mesh>)}
    </group>
  );
}

/** Ground supports under every run that lies on the sleepers. */
function Supports({ m }: { m: MeshStandardMaterial }) {
  const ref = useRef<InstancedMesh>(null);
  const pts = useMemo(() => {
    const out: P[] = [];
    Object.values(LINES).forEach((line) => line.slice(1).forEach((b, i) => {
      const a = line[i];
      if (Math.abs(a[1] - G) > 0.01 || Math.abs(b[1] - G) > 0.01) return;
      const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
      for (let s = 6; s < len; s += 12) out.push([a[0] + ((b[0] - a[0]) * s) / len, 0.25, a[2] + ((b[2] - a[2]) * s) / len]);
    }));
    return out;
  }, []);
  useLayoutEffect(() => {
    const o = new Object3D();
    pts.forEach((p, i) => { o.position.set(...p); o.updateMatrix(); ref.current!.setMatrixAt(i, o.matrix); });
    ref.current!.instanceMatrix.needsUpdate = true; ref.current!.computeBoundingSphere();
  }, [pts]);
  return <instancedMesh ref={ref} args={[undefined, undefined, pts.length]} material={m}><boxGeometry args={[1.6, 0.5, 1.6]} /></instancedMesh>;
}

/** Moving dots along a polyline. */
function Flow({ pts, color, focus, when, phase }: { pts: P[]; color: string; focus: boolean; when: 'always' | 'cleanup' | 'test'; phase: number }) {
  const ref = useRef<InstancedMesh>(null);
  const n = 18;
  const path = useMemo(() => {
    const v = pts.map((p) => new Vector3(...p));
    const lens = v.slice(1).map((b, i) => b.distanceTo(v[i]));
    return { v, lens, total: lens.reduce((a, b) => a + b, 0) };
  }, [pts]);
  const mat = useMemo(() => new MeshBasicMaterial({ color }), [color]);
  const o = useMemo(() => new Object3D(), []);
  useFrame(() => {
    const im = ref.current; if (!im) return;
    const cyc = (performance.now() / 1000) % 10;
    const active = focus && (when === 'always' || (when === 'cleanup' ? cyc < 4 : cyc >= 4));
    im.visible = active;
    if (!active) return;
    for (let i = 0; i < n; i++) {
      let d = (((performance.now() / 1000) * 14 + (i / n) * path.total + phase) % path.total);
      let k = 0;
      while (k < path.lens.length - 1 && d > path.lens[k]) { d -= path.lens[k]; k++; }
      o.position.lerpVectors(path.v[k], path.v[k + 1], Math.min(1, d / path.lens[k]));
      o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, n]} material={mat} frustumCulled={false}><sphereGeometry args={[0.55, 10, 8]} /></instancedMesh>;
}

function Meter({ p, m, body }: { p: P; m: MeshStandardMaterial; body: MeshStandardMaterial }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.9, 0]} material={body} castShadow><boxGeometry args={[2.6, 1.8, 1.8]} /></mesh>
      <mesh position={[0, 2.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={m}><cylinderGeometry args={[0.55, 0.55, 0.3, 18]} /></mesh>
    </group>
  );
}

function Tank({ p, m, band }: { p: P; m: MeshStandardMaterial; band: MeshStandardMaterial }) {
  return (
    <group position={p}>
      <mesh position={[0, 4.5, 0]} material={m} castShadow receiveShadow><cylinderGeometry args={[3.6, 3.6, 9, 28]} /></mesh>
      <mesh position={[0, 6.8, 0]} material={band}><cylinderGeometry args={[3.65, 3.65, 1.1, 28]} /></mesh>
      <mesh position={[0, 9.2, 0]} material={m}><cylinderGeometry args={[0.6, 3.6, 0.6, 28]} /></mesh>
    </group>
  );
}

export function TestSpread({ visible, focus }: { visible: boolean; focus: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const m = useMemo(() => ({
    ...Object.fromEntries(Object.entries(COLORS).map(([k, c]) => [k, std(c, 0.35, 0.4)])) as Record<keyof typeof COLORS, MeshStandardMaterial>,
    vessel: std('#F3F4F6', 0.25, 0.35), vesselFocus: std('#F26A21', 0.25, 0.4), skid: std('#44506E', 0.3, 0.6),
    support: std('#8C877C', 0, 0.9), valve: std('#BF2E26', 0.35, 0.4), steel: std('#A7AFBA', 0.85, 0.3), white: std('#EEF1F6', 0.1, 0.6),
    flare: new MeshStandardMaterial({ color: '#FFC24A', emissive: '#F26A21', emissiveIntensity: 1.2 }),
  }), []);
  // cleanup to flare first (4 s), then flow through the separator (6 s); repeats while the test step is on screen
  useFrame(() => { if (visible && focus) invalidate(); });
  return (
    <group visible={visible}>
      {/* lines */}
      <Pipe pts={LINES.well} r={0.42} m={m.well} />
      <Pipe pts={LINES.cleanup} r={0.42} m={m.cleanup} />
      <Pipe pts={LINES.test} r={0.42} m={m.test} />
      <Pipe pts={LINES.gas} r={0.38} m={m.gas} />
      <Pipe pts={LINES.oil} r={0.32} m={m.oil} />
      <Pipe pts={LINES.water} r={0.32} m={m.water} />
      <Supports m={m.support} />
      {/* choke manifold */}
      <group position={[-28, 0, 22]}>
        <mesh position={[0, 0.4, 0]} material={m.skid}><boxGeometry args={[11, 0.8, 7]} /></mesh>
        <mesh position={[0, G + 0.4, 0]} rotation={[0, 0, Math.PI / 2]} material={m.steel}><cylinderGeometry args={[0.5, 0.5, 10, 14]} /></mesh>
        {[-3.5, 0, 3.5].map((x) => (
          <group key={x} position={[x, G + 0.4, 0]}>
            <mesh material={m.valve}><boxGeometry args={[1.2, 1.4, 1.4]} /></mesh>
            <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.steel}><torusGeometry args={[0.5, 0.06, 6, 18]} /></mesh>
          </group>
        ))}
      </group>
      {/* separator on its skid */}
      <group position={[-70, 0, 60]}>
        <mesh position={[0, 1.5, 0]} material={m.skid}><boxGeometry args={[24, 3, 11]} /></mesh>
        {[-7, 7].map((x) => <mesh key={x} position={[x, 4, 0]} material={m.skid}><boxGeometry args={[1.5, 3, 7]} /></mesh>)}
        <mesh position={[0, 9, 0]} rotation={[0, 0, Math.PI / 2]} material={focus ? m.vesselFocus : m.vessel} castShadow><cylinderGeometry args={[4, 4, 20, 32]} /></mesh>
        <mesh position={[10, 9, 0]} material={focus ? m.vesselFocus : m.vessel}><sphereGeometry args={[4, 24, 12, 0, Math.PI]} /></mesh>
        <mesh position={[-10, 9, 0]} rotation={[0, Math.PI, 0]} material={focus ? m.vesselFocus : m.vessel}><sphereGeometry args={[4, 24, 12, 0, Math.PI]} /></mesh>
        <mesh position={[-4, 14, 0]} material={m.steel}><cylinderGeometry args={[0.6, 0.6, 2.2, 12]} /></mesh>
      </group>
      {/* meters and tanks */}
      <Meter p={[-82, 0, 70]} m={m.white} body={m.oil} />
      <Meter p={[-82, 0, 48]} m={m.white} body={m.water} />
      <Pipe pts={[[-80.7, G, 70], [-87, G, 70]]} r={0.32} m={m.oil} />
      <Tank p={[-91, 0, 70]} m={m.white} band={m.oil} />
      <Tank p={[-91, 0, 48]} m={m.white} band={m.water} />
      {/* flare stack */}
      <mesh position={[-150, 22, 108]} material={m.skid}><cylinderGeometry args={[1, 1.3, 44, 14]} /></mesh>
      <mesh position={[-150, 48, 108]} material={m.flare}><coneGeometry args={[2.6, 9, 10]} /></mesh>
      {/* flow */}
      <Flow pts={LINES.well} color="#7FB2FF" focus={focus} when="always" phase={0} />
      <Flow pts={LINES.cleanup} color="#FFB37A" focus={focus} when="cleanup" phase={0} />
      <Flow pts={LINES.test} color="#7FB2FF" focus={focus} when="test" phase={0} />
      <Flow pts={LINES.gas} color="#FFE08A" focus={focus} when="test" phase={3} />
      <Flow pts={LINES.oil} color="#B08860" focus={focus} when="test" phase={5} />
      <Flow pts={LINES.water} color="#8FD0FF" focus={focus} when="test" phase={7} />
    </group>
  );
}
