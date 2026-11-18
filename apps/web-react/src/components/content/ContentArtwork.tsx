import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Illustration } from '@/components/ui/Illustration';

export type LicenseStatus = 'licensed' | 'original' | 'pending_license' | 'missing';

export interface ContentArtworkProps {
  /** Image URL from the legal media catalog (later: Cloudflare/Drive). Never hotlink unapproved media. */
  assetUrl?: string;
  alt: string;
  sourceTitle?: string;
  artist?: string;
  licenseStatus?: LicenseStatus;
  /** True only for licensed official publisher artwork. Placeholders are NEVER official. */
  isOfficial?: boolean;
  /** Generated, original placeholder used when no licensed asset is available or the image fails. */
  fallback: { hue: number; glyph: string };
  className?: string;
  rounded?: string;
  /** 0-100 focus point for object-position (crop/zoom support). */
  focusX?: number;
  focusY?: number;
  /** Show the license/credit chip on the art. */
  showStatus?: boolean;
}

/**
 * Artwork with explicit licensing state. If `assetUrl` is missing or fails to load, an original placeholder
 * is drawn and labelled as such, so placeholder art can never be mistaken for official illustration.
 */
export function ContentArtwork({ assetUrl, alt, sourceTitle, artist, licenseStatus = 'original', isOfficial = false, fallback, className = '', rounded = 'rounded-xl', focusX = 50, focusY = 30, showStatus = true }: ContentArtworkProps) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const usable = !!assetUrl && !failed && licenseStatus === 'licensed';
  const status: LicenseStatus = usable ? 'licensed' : failed || (!assetUrl && licenseStatus === 'licensed') ? 'missing' : licenseStatus === 'licensed' ? 'original' : licenseStatus;

  const label =
    status === 'licensed' ? (isOfficial ? t('art.official') : t('art.licensed'))
    : status === 'pending_license' ? t('art.pending')
    : status === 'missing' ? t('art.missing')
    : t('art.placeholder');

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      {usable ? (
        <img src={assetUrl} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" style={{ objectPosition: `${focusX}% ${focusY}%` }} />
      ) : (
        <Illustration hue={fallback.hue} glyph={fallback.glyph} alt={alt} className="h-full w-full" rounded="rounded-none" />
      )}
      {showStatus && (
        <span
          title={usable ? [sourceTitle, artist].filter(Boolean).join(' — ') : t('art.officialWhenLicensed')}
          className={`absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${status === 'licensed' ? 'bg-ok/90 text-night-950' : 'bg-night-950/85 text-star-100'}`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/** Compact, accessible license line for detail panels. */
export function SourceLicenseIndicator({ licenseStatus = 'original', isOfficial, sourceTitle, artist }: Pick<ContentArtworkProps, 'licenseStatus' | 'isOfficial' | 'sourceTitle' | 'artist'>) {
  const { t } = useI18n();
  return (
    <p className="rounded-lg bg-night-900 px-3 py-2 text-xs text-star-200">
      <strong>{licenseStatus === 'licensed' ? (isOfficial ? t('art.official') : t('art.licensed')) : licenseStatus === 'pending_license' ? t('art.pending') : t('art.placeholder')}</strong>
      {sourceTitle && <> · {sourceTitle}</>}{artist && <> · {artist}</>}
      <span className="block text-star-300">{t('art.officialWhenLicensed')}</span>
    </p>
  );
}
