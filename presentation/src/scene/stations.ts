/**
 * Camera stations. Each is a target point and the camera position, derived
 * from the trajectory so they follow the well (world units: ft depth, schematic
 * surface at 12x).
 */
import { posAt } from '../data/trajectory.ts';
import type { StationId } from '../data/content.ts';

export interface Station { target: [number, number, number]; position: [number, number, number] }

const at = (md: number, dx = 0, dy = 0): [number, number, number] => {
  const [x, y] = posAt(md);
  return [x + dx, y + dy, 0];
};
const from = (t: [number, number, number], off: [number, number, number]): [number, number, number] => [t[0] + off[0], t[1] + off[1], t[2] + off[2]];

export function station(id: StationId): Station {
  switch (id) {
    case 'rig-overview': { const t: [number, number, number] = [150, 950, 0]; return { target: t, position: from(t, [2300, 350, 3700]) }; }
    case 'full-well': { const t: [number, number, number] = [1650, -3900, 0]; return { target: t, position: from(t, [2600, 1400, 18500]) }; }
    case 'location-staging': { const t: [number, number, number] = [900, 150, 700]; return { target: t, position: from(t, [1500, 1500, 3000]) }; }
    case 'rig-diverter': { const t: [number, number, number] = [0, 110, 0]; return { target: t, position: from(t, [330, 170, 900]) }; }
    case 'surface-section': { const t = at(1050, 40, 0); return { target: t, position: from(t, [800, 380, 2900]) }; }
    case 'intermediate-section': { const t = at(3500, 0, 0); return { target: t, position: from(t, [900, 300, 4300]) }; }
    case 'production-section': { const t = at(7130, 0, 0); return { target: t, position: from(t, [1100, 400, 5600]) }; }
    case 'reservoir-td': { const t = at(9420, 0, 0); return { target: t, position: from(t, [420, 160, 1300]) }; }
    case 'liner': { const t = at(9356, 0, 0); return { target: t, position: from(t, [480, 200, 1450]) }; }
    case 'liner-lap': { const t = at(9330, 0, 0); return { target: t, position: from(t, [-380, 160, 1250]) }; }
    case 'esp': { const t = at(6000, 0, 0); return { target: t, position: from(t, [330, 150, 900]) }; }
    case 'surface-test': { const t: [number, number, number] = [-700, 220, 500]; return { target: t, position: from(t, [1700, 900, 2600]) }; }
    case 'hazard-deep': { const t = at(8300, 380, -150); return { target: t, position: from(t, [700, 250, 3300]) }; }
    case 'panel': { const t: [number, number, number] = [1700, -3200, 0]; return { target: t, position: from(t, [-5200, 7800, 15000]) }; }
  }
}
