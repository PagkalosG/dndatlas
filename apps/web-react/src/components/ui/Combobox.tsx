import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n';

export interface ComboOption { id: string; label: string; hint?: string; disabled?: boolean; disabledReason?: string }

export interface ComboboxProps {
  label: string;
  options: ComboOption[];
  value?: string;
  onChange: (id: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  allowClear?: boolean;
}

/** Searchable single-select following the WAI-ARIA combobox pattern (arrow keys, Enter, Esc). */
export function Combobox({ label, options, value, onChange, placeholder, disabled, readOnly, error, allowClear = true }: ComboboxProps) {
  const { t } = useI18n();
  const uid = useId();
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = (o: ComboOption) => { if (o.disabled) return; onChange(o.id); setQuery(''); setOpen(false); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && open && filtered[active]) { e.preventDefault(); pick(filtered[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={`${uid}-input`} className="label mb-1 block">{label}</label>
      <div className="relative">
        <input
          id={`${uid}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${uid}-opt-${filtered[active].id}` : undefined}
          aria-invalid={!!error}
          className={`input pr-16 ${error ? 'border-danger' : ''}`}
          placeholder={selected ? selected.label : placeholder ?? t('common.searchPlaceholder')}
          value={open ? query : selected?.label ?? ''}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={() => !readOnly && setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={onKey}
        />
        {allowClear && selected && !disabled && !readOnly && (
          <button type="button" aria-label={t('common.clear')} onClick={() => onChange(undefined)} className="absolute right-8 top-1/2 -translate-y-1/2 rounded px-1 text-star-300 hover:text-star-50">×</button>
        )}
        <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-star-300">▾</span>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
      {open && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-night-500 bg-night-800 p-1 shadow-2xl">
          {filtered.length === 0 && <li className="px-3 py-2 text-sm text-star-300">{t('common.noResults')}</li>}
          {filtered.map((o, i) => (
            <li
              key={o.id}
              id={`${uid}-opt-${o.id}`}
              role="option"
              aria-selected={o.id === value}
              aria-disabled={o.disabled}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(o)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${i === active ? 'bg-night-600' : ''} ${o.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{o.label}</span>
                {o.hint && <span className="text-xs text-star-300">{o.hint}</span>}
              </div>
              {o.disabled && o.disabledReason && <div className="text-xs text-danger">{o.disabledReason}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
