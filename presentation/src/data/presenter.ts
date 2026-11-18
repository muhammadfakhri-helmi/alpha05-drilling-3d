/**
 * Presenter guide (guide/Panduan_Presenter_Per_Role.md) and PPTX speaker notes.
 * Keyed by slide number and role. Text is copied from the guide; the "≈" glyph
 * of the guide is written as "~" (outside the font).
 */
import type { RoleId } from './content.ts';

export interface Cue { points: string[]; minutes?: string; handover?: string }

export const GUIDE: Record<number, Partial<Record<RoleId, Cue>>> = {
  1: { pm: { points: ['Welcome. This is the Drilling Well on Paper session for ALPHA-05, Phase 3 Drilling Program.', '20 minutes of presentation, then 10 minutes of Q&A.', 'In every hole section the roles speak in this order: Subsurface, Drilling, HSE, Logistic.'] } },
  2: {
    pm: {
      points: [
        'Mission: drill ALPHA-05 to 9,604 ft MD, log the Tuban carbonate, run and cement the 7-in liner, complete with an ESP.',
        'J-type well. KOP 700 ft MD. Final inclination 29.74° on 222.55° azimuth.',
        'Planned TD 9,604 ft MD / 8,561 ft TVD.',
        'Rigs: 1,500-hp drilling rig and 450-hp workover rig. Completion: 3-1/2-in tubing with ESP.',
        'Read all four success criteria: drill to TD within the design window; casing seats and cement verified; BOP, FIT and pressure tests accepted; completion installed and tested.',
        'Announce the rule: in every hole section the roles speak in this order: Subsurface, Drilling, HSE, Logistic.',
      ],
      handover: 'Logistic will start with pre-spud logistics.',
    },
  },
  3: {
    log: {
      minutes: '1.5',
      points: [
        'Long lead items are completed before rig mobilization.',
        'Three steps: pre-mobilization, transport to site, offloading and staging.',
        'Pre-mobilization checks: plan and schedule confirmed; rig equipment inspected; heavy-haul trucks, trailers and barges ready; permits and transport documents ready; manpower and logistics ready.',
        'Lead times (Table 9.3): casing 42 / 35 / 30 days for 20-in / 13-3/8-in / 9-5/8-in; tubing 20 days; reamer shoes and OH slider 30–35 days; bits 20–50 days.',
        'Longest lead time: wellhead and X-mas tree, 60 days.',
        'BOP 13-5/8-in recertification, mud motor and 8-in MWD: 4 weeks.',
      ],
      handover: 'HSE will cover regulatory readiness.',
    },
  },
  4: { log: { points: ['Backup slide: long lead item schedule.', 'Use it only if asked about procurement timing.'] } },
  5: {
    hse: {
      minutes: '1.5',
      points: [
        'Risk matrix is 5 by 5: likelihood times severity.',
        'After controls, 18 activities sit in the matrix: 5 in band 1–4, 10 in band 5–9, 3 in band 10–12.',
        'Approval authority by residual risk: 1–4 Company Man (Drilling Supervisor); 5–9 Rig Superintendent; 10–12 Drilling Manager; 15–25 Asset General Manager.',
        'Permit to Work has six steps: request, hazard ID and JSA, isolation and gas test, authorize, execute and monitor, close-out.',
        'Pre-spud gate: a permit, document or rig acceptance gap delays the spud until it is closed.',
      ],
      handover: 'Back to the section walk-through, starting with the surface hole.',
    },
  },
  6: {
    sub: { minutes: '0.75', points: ['Smectite 55 %, total clay 63 % at 250–280 ft MD.', 'Gumbo and reactive shale are the hazards.', 'Window below the shoe: 9–15.4 ppg.', 'Shoe FIT about 14.2 ppg EMW.'], handover: 'Drilling will now take the section procedure.' },
    drl: { minutes: '0.75', points: ['Steerable BHA: mill-tooth bit, motor, MWD.', 'Kickoff at 700 ft MD.', 'Hi-vis sweeps and a controlled rate.', 'Circulate clean and confirm static before running casing.'], handover: 'HSE will cover the hazards and controls.' },
    hse: { minutes: '0.75', points: ['Diverter N/U and function test.', 'Shallow gas: detection and blind float valve.', '26-in drilling: residual 4, Company Man.', '20-in casing and cement: residual 8, Rig Superintendent.'], handover: 'Logistic will cover materials and supply.' },
    log: { minutes: '0.75', points: ['20-in casing 42 days. 26-in bit 20 days.', 'Spud mud 9.8 ppg, 5 % KCl polymer. Reserve 1,200 bbl spud mud.', 'Kill mud 150 bbl at 13.0 ppg. LCM pill 120 bbl.'], handover: 'Next section.' },
  },
  7: { drl: { points: ['Backup data slide for Surface hole: casing design factors, cementing design and the well-control equipment.', 'Use it if asked about casing safety factors or cement design.'] } },
  8: {
    sub: { minutes: '0.75', points: ['Tight hole in all four offset wells.', 'Window 2,827–5,000 ft: 11.5–15.4 ppg.', 'Casing point is set from tops, pore pressure and losses.', 'Shoe test about 16.0 ppg EMW.'], handover: 'Drilling will now take the section procedure.' },
    drl: { minutes: '0.75', points: ['Steerable BHA on the J-type profile.', 'Flow 790–910 gpm. Standpipe 2,100–3,680 psi.', 'Sweeps, and reaming where the hole is tight.', 'Run 13-3/8-in, cement, then Wellhead Section B.'], handover: 'HSE will cover the hazards and controls.' },
    hse: { minutes: '0.75', points: ['N/D the 21-1/4-in BOP, N/U 13-5/8-in × 5,000 psi. Function and pressure test.', '17-1/2-in drilling: residual 8, Rig Superintendent.', 'BOP test and shoe FIT: residual 4, Company Man.'], handover: 'Logistic will cover materials and supply.' },
    log: { minutes: '0.75', points: ['13-3/8-in casing 35 days. 17-1/2-in bit 50 days.', 'BOP recertification: 4 weeks.', 'Kill mud 150 bbl at 15.0 ppg. Hi-vis pill 150 bbl. Sweeps each stand.'], handover: 'Next section.' },
  },
  9: { drl: { points: ['Backup data slide for Intermediate hole: casing design factors, cementing design and the well-control equipment.', 'Use it if asked about casing safety factors or cement design.'] } },
  10: {
    sub: { minutes: '0.75', points: ['Critical interval 6,000–8,000 ft TVD.', 'Pore pressure 12–13.5 ppg, the window narrows.', 'Safe window 15.1–16.6 ppg.', 'Kicks at 7,400–10,000 ft, losses at 8,800–9,200 ft MD.', 'Top of Tuban at 9,259 ft MD.'], handover: 'Drilling will now take the section procedure.' },
    drl: { minutes: '0.75', points: ['Tangent-packed steerable BHA holds 29.74° / 222.55°.', 'ECD 14.1–15.7 ppg. Flow 800–1,000 gpm.', 'WOB 5–20 klbs, 50–60 rpm.', 'Kick tolerance 51.27 bbl at 13.90 ppg.'], handover: 'HSE will cover the hazards and controls.' },
    hse: { minutes: '0.75', points: ['This is the controlling pressure-window section.', 'Residual 10, Drilling Manager.', '13-5/8-in × 5,000 psi BOP tested before drilling out.', 'Kill mud 130 bbl at 16 ppg.'], handover: 'Logistic will cover materials and supply.' },
    log: { minutes: '0.75', points: ['Mud motor and 8-in MWD: 4 weeks, main and spare.', '9-5/8-in casing 30 days. 12-1/4-in bits 22–38 days.', 'Hi-vis and tandem sweeps ready. Barite recovery centrifuge.'], handover: 'Subsurface will cover the reservoir.' },
  },
  11: { drl: { points: ['Backup data slide for Production hole: casing design factors, cementing design and the well-control equipment.', 'Use it if asked about casing safety factors or cement design.'] } },
  12: {
    sub: {
      minutes: '1',
      points: [
        '8-1/2-in section drills the Tuban carbonate below the shale caprock, about 8,261 ft TVD.',
        'TD 9,604 ft MD / 8,561 ft TVD.',
        'Drill-in fluid 8.8–10.8 ppg. ECD 9.10–11.28 ppg. Fracture limit 17.7 ppg.',
        'Mud weight window follows Table 3.1.',
        'At TD: wireline Quad Combo and VSP.',
        'TD call: Subsurface with PM. Logging and coring: Subsurface.',
      ],
      handover: 'Drilling will cover the 7-in liner and completion.',
    },
  },
  13: {
    drl: {
      minutes: '0.75',
      points: [
        'Step 1: 7-in liner set at 9,604 ft MD. 26 ppf, L-80, BTC, hydraulic liner hanger.',
        'Cement with 20 % excess and 10 bbl above the top of liner. Lap test and negative inflow test.',
        'Step 4: ESP with 165 stages, 160-hp. 191 joints of 3-1/2-in tubing.',
        'Intake at 6,013 ft, end of tubing at 6,025 ft MD. 5,000 psi Christmas tree.',
      ],
      handover: 'Project Manager will cover test and handover.',
    },
    sub: {
      minutes: '0.25',
      points: [
        'Cleanout 7-in by 9-5/8-in. CBL across the liner lap and casing.',
        'Perforation: 4-1/2-in TCP guns, depth correlated with GR/CCL, well static before retrieval.',
      ],
    },
    pm: { points: ['Start-up at about 42 Hz.', 'Cleanup to flare.', 'Surface test separator: oil, water, gas.', 'Handover to production.'] },
  },
  14: {
    eco: {
      minutes: '1',
      points: [
        'Read the chart: day versus depth versus cost is the planning reference.',
        'Drilling target: 38 days.',
        'Base case cost: about USD 7.55 M. High case: about USD 10.79 M.',
        'Project duration: at most 130 days.',
      ],
      handover: 'The Project Manager will cover reporting and communication.',
    },
    pm: { points: ['DDR and morning call every day. Coordination meeting every week.', 'Communication path: Driller, then Toolpusher / Company Man, then Drilling Superintendent, then PM.'] },
  },
  15: {
    pm: {
      points: [
        'Six steps: request, risk assessment, technical review, approval, implement, close-out.',
        'MOC is required when a change affects the technical baseline or operating envelope; the sequence, service or equipment selection; or time or cost authority.',
        'Urgent MOC: verbal approval by the PM, written record within 24 hours.',
        'Key decisions (Table 11.4): spud, PM at the pre-spud meeting. Casing point, Drilling Superintendent with Subsurface. Well control response, Company Man on site. TD call, Subsurface with PM. Logging and coring, Subsurface.',
      ],
    },
  },
  16: {
    pm: {
      points: [
        'GO only if all are true: rig, services, contracts and materials ready; permits, HSE and well-control bridging closed; emergency arrangements and reporting templates in place; function, pressure and alarm tests accepted; communication checks and H2S and emergency drills done.',
        'NO-GO if any is open: a permit, document or rig acceptance gap; a readiness area not closed; a test not accepted; a drill not completed.',
        'Result: GO means the spud is authorized. NO-GO means delay the spud, close the gap, review again.',
        'Company Man and all discipline leads recommend. The PM, or delegated operator authority, authorizes.',
      ],
    },
  },
  17: {
    pm: {
      points: [
        'Before operational release the PMT must: reconcile survey, datum and KOP; validate the PPFG window and kick tolerance; approve cement and liner job details; confirm logging, coring and completion design; close rig, emergency, material, permit and commercial items.',
        'Walk through Table 11.3 in one pass: who recommends, who authorizes.',
      ],
      handover: 'We now open the floor for questions.',
    },
  },
  18: { pm: { points: ['Thank the audience.', 'Route each question to the role that owns it (see routing below).'] } },
};

export const MEMORIZE: Record<RoleId, string> = {
  pm: '9,604 ft MD / 8,561 ft TVD · KOP 700 ft · 29.74° / 222.55° · 24 hours (urgent MOC) · 42 Hz',
  sub: '55 % smectite · 14.2 ppg shoe FIT · 15.1–16.6 ppg safe window · 9,259 ft Top of Tuban · 17.7 ppg fracture limit',
  drl: '700 ft KOP · 790–910 gpm (17-1/2-in) · 800–1,000 gpm (12-1/4-in) · 51.27 bbl kick tolerance · 191 joints · 6,025 ft EOT',
  hse: '5×5 matrix · 18 activities (5 / 10 / 3) · bands 1–4, 5–9, 10–12, 15–25 · six PTW steps · 130 bbl kill mud at 16 ppg',
  log: '60 days wellhead & X-mas tree · 42 / 35 / 30 days casing · 1,200 bbl spud mud reserve · 150 bbl kill mud · 4 weeks BOP recertification',
  eco: '38 days · about USD 7.55 M base · about USD 10.79 M high · max 130 days',
};

export const BACKUP_NOTE: Record<RoleId, string> = {
  pm: 'Tidak ada slide backup. Siap menjelaskan 6 langkah MOC tanpa membaca slide.',
  sub: 'Siap menjawab pertanyaan PPFG dan Table 3.1. Pertanyaan casing atau cement dilempar ke Drilling.',
  drl: 'Slide 7, 9, 11: casing, safety factor, cementing, BOP per section. Dipakai hanya kalau ada pertanyaan.',
  hse: 'Siap menjawab pertanyaan risiko dan otoritas persetujuan. Keputusan Go / No-Go dijawab PM.',
  log: 'Slide 4: jadwal LLI. Dipakai hanya kalau ada pertanyaan soal waktu pengadaan.',
  eco: 'Siap menjawab pertanyaan asumsi biaya dan durasi.',
};

export const ROUTING: [string, string][] = [
  ['Casing, cementing, BHA, parameter pemboran, liner, ESP', 'Drilling'],
  ['Pore pressure, mud weight window, casing point, FIT, logging, TD call', 'Subsurface'],
  ['Risk matrix, PTW, BOP test, otoritas persetujuan risiko', 'HSE'],
  ['Long lead items, stok mud dan kill mud, transport', 'Logistic'],
  ['Hari pemboran, biaya, durasi proyek', 'Contract & Economist'],
  ['MOC, DDR, hierarki komunikasi, Go / No-Go, release gates, keputusan spud', 'Project Manager'],
];
