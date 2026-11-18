import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale, LocalizedString } from '@/types';
import { en, type TKey } from './en';
import { el } from './el';

const dictionaries: Record<Locale, Record<TKey, string>> = { en, el };

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Translate a UI key. Supports {param} interpolation. */
  t: (key: TKey, params?: Record<string, string | number>) => string;
  /** Pick the active-language string from backend/mock content. */
  l: (s: LocalizedString | undefined) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('atlas.locale') as Locale | null;
      if (saved === 'en' || saved === 'el') return saved;
    } catch { /* storage unavailable */ }
    return navigator.language?.toLowerCase().startsWith('el') ? 'el' : 'en';
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem('atlas.locale', locale); } catch { /* noop */ }
  }, [locale]);

  const t = useCallback<I18nValue['t']>(
    (key, params) => {
      let s = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
      if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
      return s;
    },
    [locale],
  );
  const l = useCallback<I18nValue['l']>((s) => (s ? s[locale] ?? s.en : ''), [locale]);

  const value = useMemo(() => ({ locale, setLocale: setLocaleState, t, l }), [locale, t, l]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

/** Shorthand for creating localized mock content. */
export const L = (en: string, el: string): LocalizedString => ({ en, el });
