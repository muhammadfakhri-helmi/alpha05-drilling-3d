/**
 * Lighting + procedural sky / environment reflections.
 *
 * No HDR download is needed: a small gradient sky scene is pre-filtered with
 * PMREMGenerator to give painted steel and pipe natural reflections. Lighting
 * is a balanced hemisphere + sun + soft fill; shadows are limited to the
 * surface (pad-sized shadow camera).
 */
import {
  Mesh, SphereGeometry, ShaderMaterial, BackSide, Scene, PMREMGenerator, HemisphereLight, DirectionalLight,
  PointLight, Color, Vector3,
} from 'three';

const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; }`;
const SKY_FRAG = /* glsl */`
uniform vec3 top; uniform vec3 horizon; uniform vec3 ground; uniform vec3 sunDir; uniform float sunStrength;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = h > 0.0 ? mix(horizon, top, pow(clamp(h,0.0,1.0), 0.55)) : mix(horizon, ground, clamp(-h*4.0,0.0,1.0));
  float s = max(dot(d, normalize(sunDir)), 0.0);
  col += vec3(1.0,0.92,0.78) * (pow(s, 600.0) * 6.0 + pow(s, 12.0) * 0.18) * sunStrength;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const SUN_DIR = new Vector3(400, 600, 300).normalize();

function skyMaterial(sunStrength = 1) {
  return new ShaderMaterial({
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: BackSide, depthWrite: false,
    uniforms: {
      top: { value: new Color('#4E6C88') }, horizon: { value: new Color('#B9C3C6') }, ground: { value: new Color('#6E6656') },
      sunDir: { value: SUN_DIR.clone() }, sunStrength: { value: sunStrength },
    },
  });
}

export function createEnvironment(renderer, scene, { env = true, shadowMapSize = 2048, shadows = true } = {}) {
  const sky = new Mesh(new SphereGeometry(40000, 32, 16), skyMaterial());
  sky.name = 'sky';
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  scene.add(sky);

  if (env) {
    const pm = new PMREMGenerator(renderer);
    const envScene = new Scene();
    envScene.add(new Mesh(new SphereGeometry(100, 32, 16), skyMaterial(0.6)));
    const rt = pm.fromScene(envScene, 0.035);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.55;
    pm.dispose();
  }

  const hemi = new HemisphereLight('#E1E9F0', '#5A4A38', 1.25);
  scene.add(hemi);

  const sun = new DirectionalLight('#FFF1DC', 2.4);
  sun.position.copy(SUN_DIR).multiplyScalar(600);
  sun.castShadow = shadows;
  sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  const sc = sun.shadow.camera;
  sc.left = -260; sc.right = 260; sc.top = 260; sc.bottom = -260; sc.near = 100; sc.far = 1500;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);

  // soft fill from the viewer side – also keeps the cutaway readable underground
  const fill = new DirectionalLight('#C3D0DC', 0.9);
  fill.position.set(-300, 200, 700);
  scene.add(fill);

  // local operation light near the active depth (bit / shoe / cement front)
  const opLight = new PointLight('#FFE1B0', 0, 320, 1.2);
  scene.add(opLight);

  return { sky, hemi, sun, fill, opLight };
}
