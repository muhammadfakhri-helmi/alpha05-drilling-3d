# Changelog

## 2.0.0 — Interactive Well Construction Digital Twin

This is a complete rebuild of the single-file mockup (Three.js r128 via CDN) as a Vite +
ES-module application on Three.js r186. The original `index.html` is still in git history
(commit `97bfaa2`). The UI text is now in English. All engineering values are unchanged.

### Project structure
- Moved to Vite (`npm run dev | build | preview`), ES modules, and `three` + `gsap` from npm.
- Split the code into focused modules (`trajectory`, `stateMachine`, `well/*`, `surface/*`,
  `camera/*`, `ui/*`, `utils/*`).
- Added `node:test` suites for the trajectory engine and the state machine.
- Source moved to `app/`. The repository root now holds the generated build, so the existing
  GitHub Pages setting ("Deploy from branch: main / root") serves it unchanged.
- Added a GitHub Actions workflow that tests and builds on every push and pull request, and on
  `main` commits a refreshed root build.

### Trajectory
- Added one master MD-based engine: `getPosition / getTangent / getNormal / getBinormal /
  getQuaternion / getTrajectoryFrame / placeAtMD`, plus adaptive ring sampling and a
  `TrajectoryCurve`. It supports MD < 0 (pipe standing above ground).
- The original `traj()/P()/Tn()/Nn()` logic is kept as the analytic J-type survey.

### Drill string / BHA fixes
- Removed the rigid, tangent-aligned BHA group that caused the kink through KOP/EOB.
- Every BHA component now has its own MD interval and is a curved, in-place updated tube.
  The bit, stabiliser blades, MWD/jar/motor bands and HWDP tool joints are placed with the local
  frame. Drill-pipe tool joints are instanced.
- Bit lengths are true. The original drew the bit at 1.4× length, which shifted the BHA.
- Rotation is shown without twisting geometry (bit and part spin, scrolling pipe texture bands).

### Casing running
- New sub-steps: condition hole, POOH BHA, prepare casing, pick up, run, land, cement, plug bump,
  wellhead/BOP.
- Added a pipe rack with casing joints, a handling joint (catwalk → V-door → well centre), a
  casing elevator on the top drive, a landing joint and a cement head.
- Couplings (40 ft, instanced) and the shoe now move with the string. Added a guide shoe with a
  highlight ring and a float collar.
- The HUD shows shoe depth, planned shoe, progress and a labelled joint estimate. Added
  "CASING LANDED" and "PLUG BUMPED" banners.

### Liner
- The 7" liner now only spans TOL → TD and is run on a separate drill-pipe running string with a
  running tool and a liner hanger (packer and expanding slips).
- New sequence: run → set hanger → cement → release running tool (visible gap) → POOH.

### Cementing
- Cement now flows along its path: inside the pipe ↓, out of the shoe, up the annulus ↑. Stages
  are separate slugs (20" lead/tail), with displacement fluid and bottom/top plugs. Shoe-track
  cement stays until drilled out.

### Camera
- Replaced the global-offset "follow bit" with trajectory-frame tracking that reads user orbit
  back into the local frame.
- Camera modes: Rig, Rig floor, Wellhead, Follow bit, Casing run, Cementing, Completion,
  Entire well. An Auto director picks them per sub-step, and GSAP blends the transitions.
- The view offset re-centres the scene in the area not covered by the UI. The entire-well view
  fits that area. Close-up distances scale with the active hole size.
- Respects `prefers-reduced-motion` (instant transitions, no autoplay).

### Materials, lighting, environment
- `MeshStandardMaterial` families (painted steel, galvanized, casing steel, BOP and wellhead
  paint, concrete, cement, mud, rock).
- sRGB output and ACES tone mapping. Lighting is hemisphere + sun + fill, plus an operation light
  at the active depth. A procedural sky gives PMREM environment reflections without an HDR
  download. Shadows are surface-only.
- Procedural gravel, field and concrete textures. The mud column is translucent and darkens with
  mud weight (as before). Open-hole walls are tinted by formation. Thin section-edge outlines were
  added.
- Downhole tubulars are exaggerated 5×. At surface they blend down to 2×, so the rig floor reads
  at a believable scale.

### Formations
- The formation cross-section is now evaluated per pixel in a shader. It uses the same tops,
  undulation, fault model and colours, so boundaries stay crisp from the overview down to a few
  feet. Added subtle grain, stratification and world-scale lithology symbols. Text moved to a
  transparent overlay.

### Responsive UI
- Five layouts (phone, phone-land, tablet, tablet-land, desktop). Added a compact HUD with level-1
  readouts, an operation card with progress and a flow legend, and milestone banners.
- Added an engineering panel with progressive disclosure: docked on desktop and tablet landscape,
  a bottom sheet (closed/half/full) on phone and tablet portrait, a drawer on phone landscape.
- The timeline is touch friendly (44–48 px targets), with prev/next, drag-to-scrub and speed.
- Added `100dvh`, safe-area insets, `ResizeObserver` and visual-viewport handling.
- Added a priority-based label system with screen-space collision avoidance.
- Added raycast tap-to-inspect equipment cards: function, MD interval and current relevance.
- Added a Technical / Cinematic presentation mode and a loading screen with progress.

### Performance
- Auto/Low/Medium/High quality with adaptive pixel ratio. Added instancing, in-place geometry
  updates, adaptive sampling, a single particle draw call and DOM writes only on change.

### Known limitations
- Verified in headless Chromium (SwiftShader) at 19 viewport sizes; there was no real-device
  GPU profiling in this environment. Frame-rate targets rely on the adaptive quality system.
- Not tested on physical iOS/Android devices. Touch was emulated (Playwright `hasTouch` /
  `isMobile`).
- Post-processing (bloom/SMAA) was evaluated but not added: native MSAA is used, and bloom gave no
  engineering value at its mobile cost.
- Fluids are positioned by length, not volume. Excess and washout are not modelled.
- Fast trips use a time-based top-drive rhythm instead of real stand-by-stand handling.
- Google Fonts are loaded from the CDN. System fonts are used as the fallback when offline.
