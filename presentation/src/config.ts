/**
 * Public address of the deployed presentation. QR codes point here so phones
 * can open the detail pages even when the deck itself runs offline. Live once
 * the branch is merged to main and GitHub Pages serves /dwop/.
 */
export const PUBLIC_BASE = 'https://muhammadfakhri-helmi.github.io/alpha05-drilling-3d/dwop/';

export const detailUrl = (topic: string, step?: number) =>
  `${PUBLIC_BASE}?view=detail&topic=${topic}${step ? `&step=${step}` : ''}`;
