import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/** QR code drawn as one SVG path (crisp on a projector, no image files). */
export function Qr({ text, size = '9rem' }: { text: string; size?: string }) {
  const { d, n } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { d, n };
  }, [text]);
  return (
    <svg className="qr" viewBox={`-2 -2 ${n + 4} ${n + 4}`} style={{ width: size, height: size }} role="img" aria-label={`QR code: ${text}`}>
      <rect x={-2} y={-2} width={n + 4} height={n + 4} fill="#fff" />
      <path d={d} fill="#1A2340" shapeRendering="crispEdges" />
    </svg>
  );
}
