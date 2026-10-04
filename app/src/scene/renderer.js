import { WebGLRenderer, PerspectiveCamera, Scene, Color, SRGBColorSpace, ACESFilmicToneMapping, PCFShadowMap } from 'three';

export function createRenderer(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  const scene = new Scene();
  scene.background = new Color('#2B2A27');
  const camera = new PerspectiveCamera(40, 1, 0.5, 120000);
  camera.position.set(250, 120, 330);
  return { renderer, scene, camera };
}

/**
 * Resize without recreating anything. `insets` describe the UI-covered
 * margins (px); the camera's principal point is shifted to the centre of the
 * unobstructed area via setViewOffset, keeping the same focal length.
 */
export function applyViewport(renderer, camera, width, height, insets = { top: 0, right: 0, bottom: 0, left: 0 }, baseFov = 40) {
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  const cx = insets.left + (width - insets.left - insets.right) / 2;
  const cy = insets.top + (height - insets.top - insets.bottom) / 2;
  const dx = cx - width / 2, dy = cy - height / 2;
  const fw = width + 2 * Math.abs(dx), fh = height + 2 * Math.abs(dy);
  // keep focal length: tan(fovFull/2) = tan(baseFov/2) * fh / height
  camera.fov = (2 * Math.atan(Math.tan((baseFov * Math.PI) / 360) * (fh / height)) * 180) / Math.PI;
  camera.setViewOffset(fw, fh, fw / 2 - cx, fh / 2 - cy, width, height);
  camera.updateProjectionMatrix();
  return { freeWidth: width - insets.left - insets.right, freeHeight: height - insets.top - insets.bottom };
}
