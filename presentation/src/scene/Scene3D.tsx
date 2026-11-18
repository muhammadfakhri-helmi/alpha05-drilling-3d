import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, PerspectiveCamera, PMREMGenerator, PCFSoftShadowMap } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitImpl } from 'three-stdlib';
import { useStore } from '../store.ts';
import { slideByN, type SceneState, type Step } from '../data/content.ts';
import type { Anim, AnimKind } from '../data/well.ts';
import { station } from './stations.ts';
import { Well } from './Well.tsx';
import { Earth } from './Earth.tsx';
import { Surface } from './Surface.tsx';
import { sceneLabels, LabelLayer, LabelProjector } from './labels.tsx';

const FLIGHT_S = 1.7;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);


function useLocation() {
  const slide = useStore((s) => s.slide);
  const step = useStore((s) => s.step);
  const sl = slideByN(slide);
  const st: Step = sl.steps[Math.min(step, sl.steps.length - 1)];
  // the 3D picture follows the summary only: opening the report detail (D)
  // never moves the camera or changes the well, so both views show the same image
  const scene: SceneState = { ...sl.scene, ...(st.scene ?? {}) };
  // stage-2 animations in the main flow: liner run (13, step 1) and ESP run (13, step 4)
  const kind: AnimKind | null = slide === 13 ? (step === 0 ? 'liner' : step === 2 ? 'esp' : null) : null;
  const anim: Anim = { kind, key: `${slide}-${step}-${kind}` };
  return { sl, st, scene, anim };
}

/** Flies camera + orbit target to the active station; shifts the projection so the subject sits left of the HUD. */
export const HUD_FRACTION = { md: 0.42, lg: 0.48, xl: 0.56 } as const;

function CameraRig() {
  const { st, sl } = useLocation();
  const hudFrac = sl.kind === '2d' ? 0 : HUD_FRACTION[sl.width ?? 'md'];
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitImpl | null;
  const invalidate = useThree((s) => s.invalidate);
  const fly = useRef({ t: 1, start: 0, fromP: new Vector3(), fromT: new Vector3(), toP: new Vector3(), toT: new Vector3(), fromH: 0, toH: 0, hud: 0 });
  const first = useRef(true);

  useEffect(() => {
    const s = station(st.station);
    const f = fly.current;
    f.toP.set(...s.position);
    f.toT.set(...s.target);
    f.toH = hudFrac;
    if (first.current) {
      first.current = false;
      camera.position.copy(f.toP);
      controls?.target.copy(f.toT);
      f.hud = f.toH;
      f.t = 1;
    } else {
      f.fromP.copy(camera.position);
      f.fromT.copy(controls ? controls.target : f.toT);
      f.fromH = f.hud;
      f.t = 0;
      f.start = performance.now();
    }
    invalidate();
  }, [st.station, hudFrac, camera, controls, invalidate]);

  useFrame(() => {
    const f = fly.current;
    if (f.t < 1) {
      // wall-clock based: the flight always ends after FLIGHT_S, even on a slow GPU
      f.t = Math.min(1, (performance.now() - f.start) / (FLIGHT_S * 1000));
      const k = ease(f.t);
      camera.position.lerpVectors(f.fromP, f.toP, k);
      controls?.target.lerpVectors(f.fromT, f.toT, k);
      f.hud = f.fromH + (f.toH - f.fromH) * k;
      controls?.update();
      invalidate();
    }
    // virtual frame wider than the screen; we render its right part so the target lands in the free area
    // (target at the centre of the free area: (1 - a) / 2 = (1 - hud) / 2, so a = hud)
    const a = f.hud;
    const w = size.width, h = size.height;
    camera.aspect = (w * (1 + a)) / h;
    camera.setViewOffset(w * (1 + a), h, w * a, 0, w, h);
  });
  return null;
}

function World() {
  const { scene, anim } = useLocation();
  return (
    <>
      <fog attach="fog" args={['#E4ECF7', 30000, 60000]} />
      <SceneEnvironment />
      <hemisphereLight args={['#ffffff', '#c9cfdc', 0.9]} />
      <directionalLight
        position={[2600, 5200, 3400]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-3200}
        shadow-camera-right={3200}
        shadow-camera-top={3200}
        shadow-camera-bottom={-3200}
        shadow-camera-near={100}
        shadow-camera-far={14000}
      />
      <directionalLight position={[-4000, 2000, -2000]} intensity={0.5} />
      <Hills />
      <Earth />
      <Well state={scene} anim={anim} />
      <Surface state={scene} anim={anim} />
    </>
  );
}

/** Image-based lighting from a procedural studio room (no files): realistic steel and paint. */
function SceneEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = tex;
    scene.environmentIntensity = 0.65;
    return () => { tex.dispose(); pmrem.dispose(); scene.environment = null; };
  }, [gl, scene]);
  return null;
}

/** Low-poly hills on the horizon behind the location (as in the deck photo). */
function Hills() {
  const hills: [number, number, number, number][] = [
    [-9000, -16000, 9000, 3200], [2000, -20000, 12000, 4200], [12000, -15000, 8000, 2600], [-18000, -22000, 10000, 3600], [21000, -24000, 11000, 3900],
  ];
  return (
    <group>
      {hills.map(([x, z, r, h], i) => (
        <mesh key={i} position={[x, h / 2 - 20, z]}>
          <coneGeometry args={[r, h, 9]} />
          <meshStandardMaterial color={i % 2 ? '#8FB49A' : '#A3C2A9'} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function Scene3D({ onFail }: { onFail: () => void }) {
  const paused = useStore((s) => slideByN(s.slide).kind === '2d' || s.backup !== null);
  const { scene, sl, st } = useLocation();
  const labels = useMemo(() => {
    const out = sceneLabels(scene, st.station, sl.kind === '2d');
    return out;
  }, [scene.built, scene.focus, scene.equipment, scene.completion, scene.cementDetail, scene.hazards, st.station, sl.kind]); // eslint-disable-line
  return (
    <>
    <Canvas
      className="scene"
      frameloop="demand"
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' }}
      camera={{ fov: 38, near: 5, far: 80000, position: [3000, 1500, 4000] }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = PCFSoftShadowMap;
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail(); }, { once: true });
      }}
      style={{ visibility: 'visible' }}
      aria-label="3D model of the ALPHA-05 well"
    >
      <World />
      <OrbitControls makeDefault enableDamping={false} enabled={!paused} maxDistance={40000} minDistance={60} />
      <CameraRig />
      <LabelProjector labels={labels} />
    </Canvas>
    <LabelLayer labels={labels} />
    </>
  );
}
