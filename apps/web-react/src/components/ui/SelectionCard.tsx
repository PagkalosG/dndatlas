import type { ReactNode } from 'react';
import type { Availability } from '@/types';
import { useI18n } from '@/i18n';
import { ContentArtwork } from '@/components/content/ContentArtwork';

export interface SelectionCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  hue?: number;
  glyph?: string;
  artworkUrl?: string;
  selected?: boolean;
  /** 'radio' for single selection groups, 'checkbox' for multi-select. */
  mode?: 'radio' | 'checkbox';
  availability?: Availability;
  badges?: ReactNode;
  compact?: boolean;
  onSelect: () => void;
  onInfo?: () => void;
}

/**
 * Illustrated selection card. Unavailable/incompatible cards stay focusable & readable so the
 * player can always see WHY they are blocked (never silently hidden or just greyed out).
 */
export function SelectionCard({ title, subtitle, description, hue = 220, glyph = '✦', artworkUrl, selected, mode = 'radio', availability, badges, compact, onSelect, onInfo }: SelectionCardProps) {
  const { t, l } = useI18n();
  const blocked = availability && availability.state !== 'available';
  const reasonId = `${title.replace(/\W/g, '')}-reason`;

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all ${selected ? 'border-gold-500 bg-night-700 shadow-glow' : 'border-night-500/70 bg-night-800 hover:border-star-400/60'} ${blocked ? 'opacity-90' : ''}`}>
      <button
        type="button"
        role={mode}
        aria-checked={!!selected}
        aria-describedby={blocked ? reasonId : undefined}
        onClick={onSelect}
        className="flex flex-1 flex-col text-left"
      >
        <ContentArtwork alt="" assetUrl={artworkUrl} licenseStatus={artworkUrl ? 'licensed' : 'original'} fallback={{ hue, glyph }} showStatus={!compact} className={compact ? 'h-20 w-full' : 'h-32 w-full'} rounded="rounded-none" />
        <span className="flex flex-1 flex-col gap-1 p-3">
          <span className="flex items-start justify-between gap-2">
            <span className="h-display text-lg leading-tight">{title}</span>
            {selected && <span aria-hidden className="mt-0.5 rounded-full bg-gold-500 px-1.5 text-xs font-bold text-night-950">✓</span>}
          </span>
          {subtitle && <span className="text-xs text-gold-300">{subtitle}</span>}
          {description && <span className="text-sm text-star-200">{description}</span>}
          {badges && <span className="mt-1 flex flex-wrap gap-1">{badges}</span>}
        </span>
      </button>

      {blocked && (
        <p id={reasonId} className={`border-t px-3 py-2 text-xs ${availability!.state === 'incompatible' ? 'border-warn/40 bg-warn/10 text-warn' : 'border-danger/40 bg-danger/10 text-danger'}`}>
          <strong className="mr-1">{availability!.state === 'incompatible' ? t('avail.incompatible') : t('avail.unavailable')}:</strong>
          {l(availability!.reason)}
        </p>
      )}
      {!blocked && availability?.needsApproval && (
        <p className="border-t border-info/40 bg-info/10 px-3 py-2 text-xs text-info">{l(availability.reason)}</p>
      )}

      {onInfo && (
        <button type="button" onClick={onInfo} aria-label={`${t('common.details')}: ${title}`} className="absolute right-2 top-2 rounded-full bg-night-950/70 px-2 py-0.5 text-xs text-star-100 hover:bg-night-950">
          ⓘ
        </button>
      )}
    </div>
  );
}
