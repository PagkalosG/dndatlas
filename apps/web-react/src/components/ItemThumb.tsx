import type { Item } from '@/types';
import { useI18n } from '@/i18n';

const hueByCategory: Record<Item['category'], number> = { weapon: 10, armor: 210, gear: 150, consumable: 330, magic: 285 };

/** Item thumbnail: licensed image when provided, otherwise generated glyph fallback. */
export function ItemThumb({ item, size = 40, showName }: { item: Item; size?: number; showName?: boolean }) {
  const { l } = useI18n();
  const h = hueByCategory[item.category];
  return (
    <span className="inline-flex items-center gap-2">
      {item.thumbUrl ? (
        <img src={item.thumbUrl} alt="" width={size} height={size} className="rounded-lg object-cover" />
      ) : (
        <span aria-hidden className="inline-flex items-center justify-center rounded-lg border border-night-500" style={{ width: size, height: size, background: `radial-gradient(circle at 30% 25%, hsl(${h} 60% 38%), hsl(${h} 50% 14%))`, fontSize: size * 0.5 }}>
          {item.thumb}
        </span>
      )}
      {showName && <span className="text-sm">{l(item.name)}</span>}
    </span>
  );
}
