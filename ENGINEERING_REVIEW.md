# Engineering review — Alpha-05

This file lists what was checked in the well-plan data, inconsistencies found, and every visual
assumption, exaggeration or simplification in the 3D visualization.
**No plan value was changed.** Where something looks wrong it is recorded here.

The data lives in `src/engineeringData.js`. `tests/trajectory.test.js` and
`tests/stateMachine.test.js` check it automatically (`npm test`).

---

## 1. Values checked and found consistent

| Check | Plan value | Trajectory engine | Result |
|---|---|---|---|
| End of build = KOP + INC / BUR × 100 | ~2,187 ft MD | 2,187.0 ft MD | ✔ |
| TD TVD | 8,561 ft | 8,561.2 ft | ✔ |
| 20" shoe TVD (2,000 ft MD) | 1,956 ft | 1,955.8 ft | ✔ |
| 13-3/8" shoe TVD (5,000 ft MD) | 4,564 ft | 4,563.6 ft | ✔ |
| 9-5/8" shoe TVD (9,259 ft MD) | 8,261 ft | 8,261.6 ft | ✔ |
| 7" liner shoe TVD (9,604 ft MD) | 8,561 ft | 8,561.2 ft | ✔ |
| Formation tops (MD ↔ TVD), Fm-B … Fm-G | see data | within ±1 ft | ✔ |
| Target (top Fm-G) | 8,261 ft TVD | 9,258.5 ft MD | ✔ |
| 26" BHA length | — | 313.5 ft (fits the "~280–315 ft" quoted) | ✔ |
| Liner lap (TOL 9,108 ft vs 9-5/8" shoe 9,259 ft) | — | 151 ft overlap | ✔ plausible |
| ESP (8,750–8,840 ft MD) sits inside the 9-5/8" casing above TOL | — | ✔ | ✔ |
| Perforations (9,330–9,570 ft MD) inside the 7" liner, inside Fm-G | — | ✔ | ✔ |
| Wellhead / BOP progression (diverter → 21-1/4" 2K → 13-5/8") | — | matches casing head / spool ratings | ✔ |

Trajectory model: exact minimum-curvature geometry for a J-type well. The hole is vertical to KOP,
then a circular arc of radius 18000 / (π · 2) = 2,864.8 ft, then a straight tangent at 29.74°.
MD is the true arc length of the drawn path.

## 2. Inconsistencies / items to verify (NOT changed)

1. **8-1/2" section: mud weight below the window.** The planned MW is 8.7–9.0 ppg, but the stated
   mud window starts at 9.0 ppg (`win: [9.0, 17.7]`). The lower end of the MW range (8.7 ppg) is
   below the window floor. Please check whether the window floor is pore pressure or wellbore
   stability, or whether the MW range is a typo.
2. **12-1/4" section: window floor of 15.1 ppg below 6,200 ft.** The planned MW is 14.0–15.0 ppg,
   which is below the stated 15.1 ppg floor below 6,200 ft (`win2: 15.1`). Same question as item 1.
3. **7" liner shoe at TD (9,604 ft MD).** The plan leaves zero rathole. A few feet of rathole is
   common practice so the shoe can be set without tagging bottom. It is drawn as planned.
4. **9-5/8" single slurry to surface.** One 15.8 ppg slurry over 9,259 ft with 50% excess and TOC at
   surface is unusual: lead + tail or a stage tool would be normal. The 12-1/4" BHA does include a
   "port collar / diverter sub". This is noted for review only; it is drawn as planned.
5. **Azimuth 222.55°.** It is listed in the plan, but with a constant-azimuth J-type well it does not
   change the vertical-section geometry. The well is drawn in its vertical-section plane, and the
   azimuth only appears in the data panel.

## 3. Visual exaggerations (MD positions are never exaggerated)

| Item | Treatment |
|---|---|
| Hole and tubular diameters downhole | 5× radial exaggeration (unchanged from the original mockup) |
| Tubulars at surface | 2× above ground, blending to 5× within ~30 ft below the cellar floor (`surfaceTaper`). True scale would make a 9-5/8" joint ~0.8 ft wide next to a 140 ft mast |
| Bit body | Radius follows the hole. A short shank (visual height ≥ 2.4 ft) tapers into the motor and overlaps the motor's lowest feet, so the bit does not render as a flat disc. The cutting face stays exactly at bit MD |
| Casing couplings, tool joints | Drawn ~10% larger than the pipe body so the joint pattern is readable |
| Perforation tunnels | 3.4 ft long cones, far larger than real tunnels |
| Wellhead, BOP, X-mas tree, rig | Approximately true scale (surface equipment) |

## 4. Visual assumptions (not in the plan)

| Assumption | Value used | Where |
|---|---|---|
| Casing joint length (coupling spacing, joint-count estimate) | 40 ft (Range 3) | `JOINT.casing` |
| Drill pipe joint / stand length | 31 ft / 93 ft | `JOINT` |
| Tubing joint length | 31.5 ft | `JOINT.tubing` |
| Shoe track (float collar above shoe) | 80 ft | `SHOE_TRACK` |
| 20" lead / tail split | Tail 2,000–1,500 ft, lead 1,500 ft → surface (carried over from the original mockup) | `CASINGS.c20.stages` |
| ESP component breakdown | 90 ft interval split into sensor/motor base, motor, seal, intake, pump | `ESP_PARTS` |
| TCP gun string | 9,325–9,575 ft (covers the four perforated intervals) | `stateMachine.js` |
| Wireline tool length | 70 ft | `WIRELINE_TOOL_LEN` |
| Liner hanger length | 14 ft (packer + slips) | `liner.js` |
| Joint counts in the HUD | Labelled "visual est., 40 ft"; not tally data | HUD |

Operation durations on the timeline are presentation pacing. They are not rig time.

## 5. Simplified mechanical representations

- **Trips and stand handling:** the top drive follows the string top. Stands (93 ft) are handled
  during drilling, but during fast trips the elevator moves on a time-based rhythm, because one
  cycle per real stand would flicker. The string geometry always stays exact.
- **Casing running:** the first two joints are shown being picked up from the catwalk and stabbed
  one at a time. The run then speeds up (couplings and shoe keep moving with the string), and the
  last joint is lowered slowly to land. A landing joint stays in the elevator until the cement job
  ends.
- **Cementing:** fluids are placed by path length, not by volume: inside the pipe ↓, out of the
  shoe, then up the annulus ↑. Excess and hole washout are not modelled. Wiper plugs ride on the
  slug ends and the top plug bumps on the float collar. The shoe track cement stays until the next
  section drills it out.
- **Liner:** the liner is made up at surface, then run on drill pipe. The hanger slips expand when
  set, cement goes down the drill pipe and liner and up to TOL, and the running tool releases
  (lifted ~18 ft) before POOH. Excess cement above TOL is mentioned but not drawn.
- **Fluids:** particles show flow direction only (no CFD). Cuttings take the colour of the
  formation at the bit.
- **Rig floor:** the elevator, catwalk, V-door and pipe rack are simplified. This is not a
  training-grade rig simulator.
- **Rotation:** the bit spins, stabiliser blades and bands rotate about the local hole axis, and
  drill pipe rotation is shown by scrolling texture bands. The curved geometry itself never rotates
  (no twisting).

## 6. Values intentionally preserved

KOP 700 ft · BUR 2°/100 ft · max inclination 29.74° · EOB ~2,187 ft · TD 9,604 ft MD / 8,561 ft TVD ·
casing sizes and shoes (30" @ 120, 20" @ 2,000, 13-3/8" @ 5,000, 9-5/8" @ 9,259, 7" liner 9,108–9,604) ·
hole sizes · bit types · all BHA component ODs and lengths · mud types, MW and windows · hydraulics ·
safety factors · cement descriptions · kick tolerance and LOT · BOP / wellhead configuration ·
completion values (tubing, ESP, perforations, 210 BOPD target) · formation colours and tops.
