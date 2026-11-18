import { useId, useRef, useState, type ReactNode } from 'react';

/* ---------------- Segmented control (radiogroup, arrow-key navigation) ---------------- */
export interface SegmentedProps<T extends string> {
  label: string;
  options: { id: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
  hideLabel?: boolean;
}
export function Segmented<T extends string>({ label, options, value, onChange, hideLabel }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    let n = i;
    do { n = (n + dir + options.length) % options.length; } while (options[n].disabled && n !== i);
    onChange(options[n].id);
    refs.current[n]?.focus();
  };
  return (
    <div>
      <span className={hideLabel ? 'sr-only' : 'label mb-1 block'} id={`seg-${label}`}>{label}</span>
      <div role="radiogroup" aria-labelledby={`seg-${label}`} className={`inline-flex max-w-full rounded-xl border border-night-500 bg-night-900 p-1 ${hideLabel ? "flex-nowrap" : "flex-wrap"}`}>
        {options.map((o, i) => (
          <button
            key={o.id}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            tabIndex={value === o.id ? 0 : -1}
            disabled={o.disabled}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(o.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${value === o.id ? 'bg-gold-500 font-semibold text-night-950' : 'text-star-200 hover:bg-night-700'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Toggle switch ---------------- */
export function Toggle({ label, checked, onChange, disabled, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; description?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <label htmlFor={id} className="text-sm text-star-100">{label}</label>
        {description && <p className="text-xs text-star-300">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-gold-500' : 'bg-night-500'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-star-50 transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

/* ---------------- Toggle chip (multi-select filter) ---------------- */
export function Chip({ children, active, onClick, disabled, title }: { children: ReactNode; active?: boolean; onClick?: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-gold-500 bg-gold-500/15 text-gold-300' : 'border-night-500 text-star-200 hover:border-star-400'}`}
    >
      {children}
    </button>
  );
}

/* ---------------- Info tooltip (hover, focus AND tap) ---------------- */
export function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="h-5 w-5 rounded-full border border-star-400 text-[11px] leading-none text-star-200 hover:bg-night-600"
      >
        ?
      </button>
      {open && (
        <span id={id} role="tooltip" className="absolute left-1/2 top-full z-40 mt-2 w-60 -translate-x-1/2 rounded-xl border border-night-500 bg-night-950 p-3 text-xs text-star-100 shadow-2xl">
          {text}
        </span>
      )}
    </span>
  );
}

/* ---------------- Badge ---------------- */
type Tone = 'neutral' | 'gold' | 'ok' | 'warn' | 'danger' | 'info' | 'nebula';
const tones: Record<Tone, string> = {
  neutral: 'bg-night-600 text-star-100', gold: 'bg-gold-500/15 text-gold-300 border border-gold-500/40', ok: 'bg-ok/15 text-ok border border-ok/40',
  warn: 'bg-warn/15 text-warn border border-warn/40', danger: 'bg-danger/15 text-danger border border-danger/40', info: 'bg-info/15 text-info border border-info/40', nebula: 'bg-nebula-500/20 text-star-100 border border-nebula-400/50',
};
export function Badge({ children, tone = 'neutral', title }: { children: ReactNode; tone?: Tone; title?: string }) {
  return <span title={title} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

/* ---------------- Field wrapper (label + hint + error) ---------------- */
export function Field({ label, hint, error, children, htmlFor, optional }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string; optional?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label mb-1 flex items-center gap-2">
        {label}
        {optional && <span className="normal-case tracking-normal text-star-400">({optional})</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-star-300">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

/* ---------------- Number stepper (used in visual ability controls) ---------------- */
export function NumberStepper({ label, value, min, max, onChange, disabled }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-2">
      <button type="button" aria-label={`${label} −`} disabled={disabled || value <= min} onClick={() => onChange(value - 1)} className="h-9 w-9 rounded-lg border border-night-500 text-lg hover:bg-night-600 disabled:opacity-40">−</button>
      <output aria-live="polite" className="w-8 text-center text-lg font-semibold">{value}</output>
      <button type="button" aria-label={`${label} +`} disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className="h-9 w-9 rounded-lg border border-night-500 text-lg hover:bg-night-600 disabled:opacity-40">+</button>
    </div>
  );
}
