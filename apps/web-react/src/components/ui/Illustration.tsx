import { useId } from 'react';

export interface IllustrationProps {
  /** 0-360 hue that tints the original placeholder artwork. */
  hue: number;
  /** Single glyph shown at the center. */
  glyph: string;
  /** Only pass when the image is licensed for this app. Falls back to the generated placeholder on error. */
  artworkUrl?: string;
  alt?: string;
  className?: string;
  rounded?: string;
}

/**
 * Original, legally-safe placeholder artwork: a celestial gradient with constellation dots and a glyph.
 * Swap `artworkUrl` in once licensed art exists; this component stays the fallback.
 */
export function Illustration({ hue, glyph, artworkUrl, alt = '', className = '', rounded = 'rounded-xl' }: IllustrationProps) {
  const id = useId().replace(/:/g, '');
  if (artworkUrl) {
    return <img src={artworkUrl} alt={alt} loading="lazy" className={`${rounded} object-cover ${className}`} />;
  }
  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
      <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id={`g${id}`} cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor={`hsl(${hue} 70% 42%)`} />
            <stop offset="60%" stopColor={`hsl(${(hue + 30) % 360} 55% 18%)`} />
            <stop offset="100%" stopColor="#0B0F24" />
          </radialGradient>
        </defs>
        <rect width="200" height="140" fill={`url(#g${id})`} />
        <g stroke="rgba(244,246,255,.35)" strokeWidth=".6" fill="none">
          <path d="M20 110 L55 80 L90 95 L130 55 L175 70" />
          <circle cx="100" cy="70" r="46" strokeDasharray="2 4" />
          <circle cx="100" cy="70" r="62" strokeDasharray="1 6" />
        </g>
        <g fill="#F4F6FF">
          {[[20, 110], [55, 80], [90, 95], [130, 55], [175, 70], [40, 25], [165, 24], [150, 118]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.1} opacity=".85" />
          ))}
        </g>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-5xl text-star-50 drop-shadow-[0_2px_10px_rgba(0,0,0,.6)]" aria-hidden>
        {glyph}
      </span>
    </div>
  );
}
