/**
 * HSE risk register: 18 work steps (drilling program, Chapter 2.2.2).
 * Scores (initial and residual L x S) and approval bands follow the drilling
 * program Table 2.2 / 2.3 and the PPTX (slide 5). Hazards, potential impacts
 * and controls (EL/SB/EG/AD/PPE) follow the linked RA/JSA of the program.
 */
import type { StationId } from './content.ts';

export interface HseStep {
  n: number;
  name: string;
  phase: string;
  station: StationId;
  /** main-flow slide where this step is discussed */
  slide: number;
  initial: { l: number; s: number };
  residual: { l: number; s: number };
  hazards: string[];
  impacts: string[];
  controls: Record<ControlKey, string>;
}
export type ControlKey = 'EL' | 'SB' | 'EG' | 'AD' | 'PPE';

export const CONTROL_NAMES: Record<ControlKey, string> = {
  EL: 'Elimination', SB: 'Substitution', EG: 'Engineering controls', AD: 'Administrative controls', PPE: 'Personal protective equipment',
};
export const LIKELIHOOD = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'];
export const SEVERITY = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

/** Residual-risk bands and approval authority (PPTX slide 5). */
export const BANDS = [
  { range: '1 – 4', min: 1, max: 4, level: 'Low to Moderate', authority: 'Company Man (Drilling Supervisor)', tone: 'green' },
  { range: '5 – 9', min: 5, max: 9, level: 'Moderate', authority: 'Rig Superintendent', tone: 'yellow' },
  { range: '10 – 12', min: 10, max: 12, level: 'Moderate to High', authority: 'Drilling Manager', tone: 'orange' },
  { range: '15 – 25', min: 15, max: 25, level: 'High', authority: 'Asset General Manager', tone: 'red' },
] as const;
export const bandOf = (score: number) => BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[3];

export const HSE_STEPS: HseStep[] = [
  {
    n: 1, name: "Pre-job planning, site readiness, induction, RA/JSA, PTW, TBT and SIMOPS review", phase: "Mobilization & rig-up", station: 'rig-overview', slide: 5,
    initial: { l: 3, s: 5 }, residual: { l: 1, s: 4 },
    hazards: ["Work without valid authorization", "Unclear scope or work boundary", "Conflicting SIMOPS", "Inadequate emergency readiness", "H2S/hydrocarbon exposure", "Adverse weather"],
    impacts: ["Personnel injury or fatality", "Uncontrolled work", "Delayed emergency response", "Asset damage", "Loss of containment"],
    controls: {
      EL: "Do not start until the approved drilling program, site readiness, RA/JSA and required PTW are available; stop conflicting SIMOPS.",
      SB: "Restrict access to essential personnel and use remote/non-intrusive checks where practicable.",
      EG: "Establish barricades, warning signs, muster point, escape routes, gas detection, radios, APAR and spill kits.",
      AD: "Conduct induction and TBT; confirm well status, work limits, weather, emergency contacts, roles, communication and SWA; review ERP and SIMOPS matrix.",
      PPE: "FR coverall, helmet, safety boots, safety glasses, gloves, hearing protection and personal gas detector as required by site assessment.",
    },
  },
  {
    n: 2, name: "Rig and equipment mobilization / transportation to wellpad", phase: "Mobilization & rig-up", station: 'location-staging', slide: 3,
    initial: { l: 3, s: 4 }, residual: { l: 2, s: 4 },
    hazards: ["Vehicle collision or rollover", "Fatigue", "Unsecured cargo", "Route obstruction", "Bridge overloading", "Reversing and blind spots", "Interaction with public traffic"],
    impacts: ["Serious injury or fatality", "Dropped or damaged equipment", "Road/bridge damage", "Schedule interruption"],
    controls: {
      EL: "Stop movement if route, bridge capacity, load condition or weather is not acceptable.",
      SB: "Use suitable transport units and handling equipment matched to the load and route.",
      EG: "Secure loads with rated restraints; use wheel chocks, warning lights, reversing alarms and physical segregation where practicable.",
      AD: "Apply the approved Journey Management Plan; verify actual gross/load distribution against Bridge A (50 t) and Bridge B (30-40 t) limits; arrange required escort, route survey, driver fitness and journey communication.",
      PPE: "High-visibility vest, safety boots, helmet and gloves during loading/unloading.",
    },
  },
  {
    n: 3, name: "Offloading and critical lifting of rig packages, tubulars and heavy equipment", phase: "Mobilization & rig-up", station: 'location-staging', slide: 3,
    initial: { l: 4, s: 5 }, residual: { l: 2, s: 5 },
    hazards: ["Dropped or swinging load", "Crane or lifting-gear failure", "Ground bearing failure", "Pinch/crush points", "Personnel entering line of fire", "Wind or poor visibility"],
    impacts: ["Fatal crush injury", "Structural damage", "Equipment damage", "Dropped-object incident"],
    controls: {
      EL: "Establish an exclusion zone and prohibit personnel beneath suspended loads or inside the line of fire.",
      SB: "Use mechanical handling aids and engineered lifting arrangements instead of manual handling where practicable.",
      EG: "Use certified crane, slings, shackles and lifting points; verify load chart, radius, ground bearing, outrigger support, taglines and communication.",
      AD: "Approved lift plan and critical-lift permit where required; competent operator/rigger/banksman; pre-use inspection; TBT; suspend lifting in unsafe wind/visibility conditions.",
      PPE: "Helmet with chin strap where required, gloves, safety boots, eye protection and high-visibility vest.",
    },
  },
  {
    n: 4, name: "Rig-up, derrick/substructure erection and installation of mechanical/electrical systems", phase: "Mobilization & rig-up", station: 'rig-overview', slide: 5,
    initial: { l: 4, s: 5 }, residual: { l: 2, s: 5 },
    hazards: ["Work at height", "Dropped tools or components", "Suspended loads", "Pinch points", "Unexpected movement", "Electrical energy", "Incomplete guards or connections"],
    impacts: ["Fall from height", "Fatal crush injury", "Struck-by injury", "Electric shock", "Equipment failure during operation"],
    controls: {
      EL: "Keep personnel clear of suspended loads and incomplete/unstable structures; isolate equipment before adjustment.",
      SB: "Use approved access platforms and mechanical positioning aids instead of improvised access.",
      EG: "Install certified fall-arrest systems, guardrails, toe boards, tool lanyards, lifting restraints, guards and emergency stops.",
      AD: "Work-at-height and critical-lift permits where applicable; approved rig-up sequence; competent crew; inspection of scaffolds and fall protection; rescue plan; LOTO before electrical/mechanical work.",
      PPE: "Full-body harness with suitable lanyard, helmet, safety boots, gloves, eye protection and hearing protection.",
    },
  },
  {
    n: 5, name: "Pre-spud readiness, function tests, diverter checks, BOP checks and emergency drills", phase: "Mobilization & rig-up", station: 'rig-diverter', slide: 5,
    initial: { l: 3, s: 5 }, residual: { l: 1, s: 4 },
    hazards: ["Failure of safety-critical equipment", "Stored pressure/energy", "Pressure-test line failure", "Incorrect valve line-up", "Inadequate communication", "Unprepared crew"],
    impacts: ["Loss of well control", "High-pressure injection or impact injury", "Equipment damage", "Delayed response to kick, H2S or fire"],
    controls: {
      EL: "Do not spud if critical well-control, diverter, alarm, communication or emergency-readiness checks fail.",
      SB: "Use remote pressure-test arrangements and keep non-essential personnel outside the test area.",
      EG: "Verify rated test lines, restraints, test plug, calibrated gauges, barriers, safe vent routing and accumulator readiness.",
      AD: "Execute approved pre-spud checklist and test procedure; verify certificates and function tests; conduct H2S, kick, fire and evacuation drills; record deficiencies and close them before release.",
      PPE: "Standard rig PPE, hearing protection and task-specific face/hand protection.",
    },
  },
  {
    n: 6, name: "Drill 36-in augered hole and install/cement 30-in conductor", phase: "Conductor & surface hole", station: 'rig-diverter', slide: 6,
    initial: { l: 3, s: 4 }, residual: { l: 2, s: 4 },
    hazards: ["Rotating auger entanglement", "Near-surface collapse or settlement", "Dropped conductor", "Lifting/pinch points", "Cement/grout exposure", "Unstable cellar edge"],
    impacts: ["Entanglement injury", "Struck-by/crush injury", "Fall into excavation", "Equipment damage", "Inadequate conductor support"],
    controls: {
      EL: "Stop augering if ground instability, cellar movement or unsafe access is observed; keep personnel away from rotating equipment.",
      SB: "Use mechanical handling for conductor and heavy components.",
      EG: "Maintain guards, exclusion zones, stable lifting points, cellar barricades and suitable ground support.",
      AD: "Verify well center/elevation; inspect auger and lifting gear; follow conductor installation and cement/grout procedure; monitor hole condition and confirm support before cutting conductor.",
      PPE: "Helmet, gloves, safety boots, eye protection and suitable respiratory protection for dust/cement exposure.",
    },
  },
  {
    n: 7, name: "Drill 26-in surface hole under diverter system", phase: "Conductor & surface hole", station: 'surface-section', slide: 6,
    initial: { l: 3, s: 5 }, residual: { l: 1, s: 4 },
    hazards: ["Shallow gas or unexpected flow", "Inadequate diversion", "Reactive clay/gumbo", "Partial losses", "Rotating equipment", "Mud/chemical exposure", "Slips and trips"],
    impacts: ["Uncontrolled flow or fire", "Gas exposure", "Loss of well control", "Stuck equipment", "Personnel injury", "Environmental contamination"],
    controls: {
      EL: "Stop drilling and follow the approved shallow-flow response if abnormal flow, gas or loss indicators occur.",
      SB: "Adjust drilling rate and use planned fluid/sweep treatment rather than forcing unstable hole conditions.",
      EG: "Confirm diverter function and route to designated safe discharge area; maintain gas detection, flow monitoring, mud volume and return monitoring.",
      AD: "Follow the approved drilling program; monitor pit volume, flow, gas, mud weight and cuttings; maintain crew kick/shallow-gas response readiness; do not close in a weak shallow formation unless the approved procedure directs it.",
      PPE: "FR coverall, helmet, safety boots, gloves, eye protection and personal gas detector.",
    },
  },
  {
    n: 8, name: "Run 20-in surface casing and perform cementing", phase: "Conductor & surface hole", station: 'surface-section', slide: 6,
    initial: { l: 3, s: 5 }, residual: { l: 2, s: 4 },
    hazards: ["Dropped tubulars", "Suspended casing", "Slips/elevators failure", "Pinch points", "High-pressure cement lines", "Cement/chemical exposure", "Unexpected returns"],
    impacts: ["Crush injury", "Line-of-fire injury", "High-pressure release", "Chemical burns/irritation", "Poor casing support or zonal isolation"],
    controls: {
      EL: "Keep personnel out of the tubular drop zone and do not handle connections while suspended or pressurized.",
      SB: "Use approved casing-handling tools and mechanized handling aids.",
      EG: "Inspect elevators, slips, tongs, handling tools, cement hoses, restraints and pressure connections; establish exclusion zones.",
      AD: "Follow casing-running and cementing programs; verify string tally, fill-up, centralization, slurry program, line-up and communication; manage returns and pressure within approved limits.",
      PPE: "Helmet, gloves, safety boots, coverall, eye/face protection and chemical-resistant gloves as required by SDS.",
    },
  },
  {
    n: 9, name: "Install wellhead and 2,000-psi BOP; pressure test and perform surface-shoe FIT", phase: "Conductor & surface hole", station: 'rig-diverter', slide: 6,
    initial: { l: 3, s: 5 }, residual: { l: 1, s: 4 },
    hazards: ["Heavy suspended equipment", "Incorrect connection or test plug", "Stored pressure", "Hose/connection failure", "Pressure release", "Barrier failure"],
    impacts: ["Fatal struck-by or pressure injury", "Loss of well control", "Damage to wellhead/BOP", "Invalid shoe-strength acceptance"],
    controls: {
      EL: "Do not drill ahead until wellhead/BOP installation, tests and required shoe-integrity acceptance are complete.",
      SB: "Use remote test pump/control where practicable and keep personnel clear of pressurized connections.",
      EG: "Use pressure-rated test equipment, correct test plug, calibrated gauges, restraints, barriers and controlled bleed-off arrangement.",
      AD: "Follow approved test sequence and limits; confirm the weakest exposed component; record and witness pressure charts; verify connections after installation; close test deficiencies before release.",
      PPE: "Standard rig PPE plus face shield/eye protection and hearing protection as required.",
    },
  },
  {
    n: 10, name: "Drill 17-1/2-in intermediate hole to planned 5,000-ft MD casing point", phase: "Intermediate hole", station: 'intermediate-section', slide: 8,
    initial: { l: 4, s: 5 }, residual: { l: 2, s: 4 },
    hazards: ["Reactive clay/marl and gumbo", "Tight hole", "Pack-off", "Stuck pipe", "Partial/total losses", "Influx", "ECD excursion", "High torque/drag"],
    impacts: ["Loss of well control", "Stuck or lost BHA", "Pressure-related event", "Wellbore instability", "NPT and equipment damage"],
    controls: {
      EL: "Stop and reassess if flow, pit, gas, ECD, SPP, torque/drag or hole condition exceeds approved operating limits.",
      SB: "Use approved sweeps, reaming/backreaming and fluid-treatment options rather than forcing pipe through restrictions.",
      EG: "Maintain calibrated flow/pit monitoring, gas detection, mud testing and reliable pressure/torque indicators.",
      AD: "Keep MW within approved 12.0-13.7 ppg design range; maintain planned hydraulics and hole-cleaning practices; control ROP; circulate and flow-check before trips; use approved kick/loss/stuck-pipe procedures.",
      PPE: "FR coverall, helmet, boots, gloves, eye protection, hearing protection and gas detector.",
    },
  },
  {
    n: 11, name: "Run 13-3/8-in intermediate casing and perform cementing", phase: "Intermediate hole", station: 'intermediate-section', slide: 8,
    initial: { l: 3, s: 5 }, residual: { l: 2, s: 4 },
    hazards: ["Dropped tubulars", "Suspended load", "Slips/elevators or connection failure", "High-pressure cementing", "Fluid/chemical exposure", "Losses or poor returns"],
    impacts: ["Crush injury", "High-pressure injection", "Chemical injury", "Inadequate zonal isolation", "Subsequent well-control exposure"],
    controls: {
      EL: "Stop casing operations if handling equipment, string condition or well status is unsafe.",
      SB: "Use mechanized casing handling and approved connection tools.",
      EG: "Inspect elevators/slips/tongs, pressure lines, hose restraints and cementing connections; establish exclusion zones.",
      AD: "Verify casing tally, running procedure, centralizers, slurry design, displacement plan and returns; monitor pressures and losses; verify cement placement and pressure test before next section.",
      PPE: "Standard rig PPE, eye/face protection and chemical-resistant gloves as required by SDS.",
    },
  },
  {
    n: 12, name: "Install 5,000-psi BOP system; pressure test and perform intermediate-shoe FIT", phase: "Intermediate hole", station: 'rig-diverter', slide: 8,
    initial: { l: 3, s: 5 }, residual: { l: 1, s: 4 },
    hazards: ["High-pressure stored energy", "Pressure-test plug or line failure", "BOP/connection leakage", "Accumulator malfunction", "Suspended BOP loads"],
    impacts: ["Fatal pressure-release injury", "Loss of well control", "Equipment damage", "Unsafe release to drill next interval"],
    controls: {
      EL: "Do not drill into the next pressure interval until BOP and shoe-integrity acceptance criteria are met.",
      SB: "Use remote testing and isolate the test area from non-essential personnel.",
      EG: "Verify test plug, pressure-rated lines, restraints, calibrated gauges, barriers and accumulator condition.",
      AD: "Use approved test pressure and sequence, subject to the approved program and the weakest exposed component; perform accumulator drawdown test; record/witness charts.",
      PPE: "Standard rig PPE, face/eye protection and hearing protection.",
    },
  },
  {
    n: 13, name: "Drill 12-1/4-in production interval (controlling pressure-window section)", phase: "Production hole", station: 'production-section', slide: 10,
    initial: { l: 4, s: 5 }, residual: { l: 2, s: 5 },
    hazards: ["Narrow PP/FG window", "Influx/kick", "Partial or total losses", "Simultaneous influx/loss indications", "High ECD", "Gas", "Fractured/permeable carbonate", "High torque/drag"],
    impacts: ["Blowout or loss of well control", "Severe circulation loss", "Formation damage", "Stuck pipe", "Wellbore instability", "Fatality or major environmental impact"],
    controls: {
      EL: "Stop drilling and initiate the approved well-control or loss-response procedure on abnormal flow, pit gain/loss, gas or pressure trends; do not continue outside approved limits.",
      SB: "Apply only approved mud/LCM and drilling-parameter adjustments; avoid unapproved changes to MW, ECD or pump rate.",
      EG: "Maintain functioning pit/flow/gas monitoring, calibrated pressure indicators, BOP/choke-kill system and communication.",
      AD: "Maintain approved MW program (approximately 13.7-15.7 ppg in the 12-1/4-in interval); continuously monitor MW, ECD, SPP, flow, pits, gas, cuttings, torque and drag; use controlled connections/trips and approved kick/loss contingencies. Design reference: kick tolerance 51.27 bbl at 13.90 ppg; this is not an operational alarm threshold or allowable influx.",
      PPE: "FR coverall, helmet, safety boots, gloves, eye protection, hearing protection and personal gas detector.",
    },
  },
  {
    n: 14, name: "Tripping, reaming/backreaming, BHA handling and hole conditioning", phase: "Production hole", station: 'production-section', slide: 10,
    initial: { l: 4, s: 4 }, residual: { l: 2, s: 4 },
    hazards: ["Swab/surge", "Trip-induced influx", "Stuck pipe/pack-off", "Dropped tubular or BHA", "High hookload/torque", "Line-of-fire and pinch points"],
    impacts: ["Kick or loss of well control", "Dropped-object/crush injury", "Stuck/lost BHA", "Equipment damage and NPT"],
    controls: {
      EL: "Stop tripping if abnormal fill, flow, drag, torque or pressure response is observed.",
      SB: "Use controlled tripping speed and approved reaming/backreaming practices.",
      EG: "Verify elevators, slips, tongs, handling tools, trip tank and flow-monitoring systems; maintain guards and exclusion zones.",
      AD: "Follow trip sheet and approved pipe-movement limits; keep hole full; monitor trip tank, hookload, torque and flow; circulate/condition hole before POOH; conduct flow checks at required points; maintain clear driller-floor communication.",
      PPE: "Standard rig PPE, gloves, safety boots, eye protection and hearing protection.",
    },
  },
  {
    n: 15, name: "Run 9-5/8-in production casing and perform cementing", phase: "Production hole", station: 'production-section', slide: 10,
    initial: { l: 3, s: 5 }, residual: { l: 2, s: 4 },
    hazards: ["Dropped tubulars", "High suspended loads", "Tight-hole or casing hang-up", "Pressure line failure", "High-density cement exposure", "Lost returns"],
    impacts: ["Crush injury", "Casing stuck or damaged", "High-pressure release", "Inadequate zonal isolation", "Loss of well integrity"],
    controls: {
      EL: "Stop casing run if drag, well condition or pressure response exceeds approved limits.",
      SB: "Use mechanized handling and approved casing-running tools.",
      EG: "Inspect elevators/slips/tongs, casing accessories, cement lines, restraints and pressure gauges; maintain exclusion zones.",
      AD: "Confirm hole cleaning, static flow check, casing tally, fill-up, centralizers and drag limits; execute approved cementing design and displacement; monitor losses/returns and verify pressure integrity before drilling ahead.",
      PPE: "Standard rig PPE with face/eye and chemical protection per SDS.",
    },
  },
  {
    n: 16, name: "Drill 8-1/2-in reservoir section and conduct formation evaluation/logging", phase: "Reservoir & liner", station: 'reservoir-td', slide: 12,
    initial: { l: 3, s: 5 }, residual: { l: 2, s: 4 },
    hazards: ["Partial losses", "Reservoir fluid influx", "Unstable hole", "Formation damage", "Wireline line-of-fire", "Dropped tools", "Radioactive source exposure if radioactive tools are used"],
    impacts: ["Loss of well control", "Lost circulation", "Stuck logging tools", "Personnel exposure", "Formation damage and invalid data"],
    controls: {
      EL: "Stop logging or drilling if well condition, barrier status or source-control arrangements are unsafe.",
      SB: "Use approved reservoir drill-in fluid and logging method appropriate to hole condition.",
      EG: "Maintain well-control barriers, line-of-fire exclusion, suitable pressure-control equipment and source transport/storage shielding where applicable.",
      AD: "Maintain approved 8-1/2-in fluid window (approximately 8.8-10.8 ppg RDIF basis); confirm hole condition before logging; apply radioactive-source permit, source inventory and exclusion controls if such sources are used; coordinate logging with drilling operations.",
      PPE: "Standard rig PPE; additional radiation controls/PPE only as required by the approved radiation protection procedure.",
    },
  },
  {
    n: 17, name: "Run, set, cement and test 7-in production liner", phase: "Reservoir & liner", station: 'liner', slide: 13,
    initial: { l: 3, s: 5 }, residual: { l: 2, s: 4 },
    hazards: ["Dropped liner/tubulars", "Premature setting or failure of liner-hanger tool", "Hydraulic stored energy", "High-pressure cementing", "Stuck liner", "Chemical exposure"],
    impacts: ["Crush injury", "Loss of liner", "Loss of zonal isolation", "Pressure-release injury", "Well-integrity failure"],
    controls: {
      EL: "Do not run liner until running tool, setting mechanism, ball seat, release system and backup tool are function-tested and accepted.",
      SB: "Use approved liner-running equipment and contingency tools.",
      EG: "Verify pressure-rated connections, tool function, lifting accessories, barriers and controlled pressure-release arrangements.",
      AD: "Follow approved liner-running and cementing program; confirm tally, overlap, setting depth, communication, cement design and pressure-test criteria; document test and handover results.",
      PPE: "Standard rig PPE, gloves, safety boots, eye/face protection and chemical protection per SDS.",
    },
  },
  {
    n: 18, name: "Rig-down, demobilization, waste handling and site handover", phase: "Rig-down & handover", station: 'location-staging', slide: 13,
    initial: { l: 3, s: 4 }, residual: { l: 2, s: 4 },
    hazards: ["Residual mechanical/electrical/pressure energy", "Dropped loads", "Work at height", "Vehicle movement", "Oil/mud/chemical spills", "Improper B3 waste handling"],
    impacts: ["Fall or crush injury", "Electric shock", "Environmental contamination", "Traffic incident", "Incomplete handover or asset damage"],
    controls: {
      EL: "Do not dismantle equipment until isolation, depressurization and release conditions are verified; stop work if SIMOPS conflicts arise.",
      SB: "Use approved lifting and waste-handling methods; segregate waste streams.",
      EG: "Apply LOTO, barricades, lifting restraints, drip trays, spill kits and designated waste containers.",
      AD: "Follow rig-down and demobilization sequence; verify permits closed, tools/personnel accounted for, waste manifests/records completed and site handed back safely.",
      PPE: "Standard rig PPE, high-visibility vest, gloves and task-specific fall/chemical protection.",
    },
  },
];

export const stepsForSlide = (n: number) => HSE_STEPS.filter((s) => s.slide === n);
