import { useI18n } from '@/i18n';

/**
 * PLACEHOLDER QR graphic (deterministic pattern from the code). NOT scannable.
 * Replace with a real QR generator (e.g. `qrcode`) when wiring the backend invite URL.
 */
export function QrPlaceholder({ value, size = 160 }: { value: string; size?: number }) {
  const { t } = useI18n();
  const n = 21;
  let h = 2166136261;
  for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const cells: boolean[] = [];
  let s = h >>> 0;
  for (let i = 0; i < n * n; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; cells.push((s >>> 24) % 2 === 0); }
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const finderOn = (x: number, y: number) => { const fx = x % (n - 7 > x ? 7 : n); void fx; const lx = x < 7 ? x : x - (n - 7); const ly = y < 7 ? y : y - (n - 7); return lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4); };
  return (
    <figure className="inline-block rounded-xl bg-star-50 p-3" role="img" aria-label={t('qr.alt', { code: value })}>
      <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges">
        {Array.from({ length: n * n }, (_, i) => { const x = i % n, y = Math.floor(i / n); const on = finder(x, y) ? finderOn(x, y) : cells[i]; return on ? <rect key={i} x={x} y={y} width="1" height="1" fill="#0B0F24" /> : null; })}
      </svg>
      <figcaption className="mt-1 text-center text-[10px] text-night-700">{t('qr.placeholder')}</figcaption>
    </figure>
  );
}
