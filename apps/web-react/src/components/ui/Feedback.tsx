import { useEffect, useRef, type ReactNode } from 'react';
import type { SyncState, ApprovalStatus, Role } from '@/types';
import { useI18n } from '@/i18n';
import { Badge } from './Controls';
import { Button } from './Button';

/* ---------------- StatusBanner: success / error / conflict / offline / pending / readonly / info ---------------- */
export type BannerKind = 'success' | 'error' | 'conflict' | 'offline' | 'pending' | 'readonly' | 'info' | 'loading';

const bannerStyle: Record<BannerKind, string> = {
  success: 'border-ok/50 bg-ok/10 text-ok', error: 'border-danger/50 bg-danger/10 text-danger', conflict: 'border-warn/50 bg-warn/10 text-warn',
  offline: 'border-warn/50 bg-warn/10 text-warn', pending: 'border-info/50 bg-info/10 text-info', readonly: 'border-star-400/40 bg-night-700 text-star-200',
  info: 'border-info/50 bg-info/10 text-info', loading: 'border-night-500 bg-night-700 text-star-200',
};
const bannerIcon: Record<BannerKind, string> = { success: '✓', error: '⚠', conflict: '⇄', offline: '⌁', pending: '◔', readonly: '🔒', info: 'ⓘ', loading: '…' };

export function StatusBanner({ kind, title, children, actions }: { kind: BannerKind; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div role={kind === 'error' || kind === 'conflict' ? 'alert' : 'status'} className={`flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 text-sm ${bannerStyle[kind]}`}>
      <span aria-hidden className="mt-0.5 text-base">{bannerIcon[kind]}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 text-star-100">{children}</div>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

/** Maps a SyncState to the right banner + recovery actions. */
export function SyncBanner({ state, onRetry, onReload, onKeepMine }: { state: SyncState; onRetry?: () => void; onReload?: () => void; onKeepMine?: () => void }) {
  const { t } = useI18n();
  if (state === 'idle' || state === 'saving') return null;
  if (state === 'success') return <StatusBanner kind="success" title={t('sync.saved')} />;
  if (state === 'loading') return <StatusBanner kind="loading" title={t('sync.loading')} />;
  if (state === 'offline')
    return <StatusBanner kind="offline" title={t('sync.offline')} actions={onRetry && <Button size="sm" onClick={onRetry}>{t('common.retry')}</Button>}>{t('sync.offlineBody')}</StatusBanner>;
  if (state === 'conflict')
    return (
      <StatusBanner kind="conflict" title={t('sync.conflict')} actions={<>{onReload && <Button size="sm" onClick={onReload}>{t('sync.loadTheirs')}</Button>}{onKeepMine && <Button size="sm" variant="primary" onClick={onKeepMine}>{t('sync.keepMine')}</Button>}</>}>
        {t('sync.conflictBody')}
      </StatusBanner>
    );
  return <StatusBanner kind="error" title={t('sync.error')} actions={onRetry && <Button size="sm" onClick={onRetry}>{t('common.retry')}</Button>}>{t('sync.errorBody')}</StatusBanner>;
}

/* ---------------- SaveBar: explicit Save / Cancel with unsaved indicator ---------------- */
export interface SaveBarProps {
  dirty: boolean;
  saving?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onSave: () => void;
  onCancel: () => void;
  extra?: ReactNode;
  saveLabel?: string;
}
export function SaveBar({ dirty, saving, disabled, readOnly, onSave, onCancel, extra, saveLabel }: SaveBarProps) {
  const { t } = useI18n();
  if (readOnly) return <StatusBanner kind="readonly" title={t('state.readOnly')}>{t('state.readOnlyBody')}</StatusBanner>;
  return (
    <div className="sticky bottom-16 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-night-500 bg-night-950/95 px-4 py-3 shadow-2xl backdrop-blur md:bottom-4">
      <span className="flex items-center gap-2 text-sm" aria-live="polite">
        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${dirty ? 'bg-warn' : 'bg-ok'}`} />
        {dirty ? t('save.unsaved') : t('save.allSaved')}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {extra}
        <Button variant="ghost" onClick={onCancel} disabled={!dirty || saving}>{t('common.cancel')}</Button>
        <Button variant="primary" onClick={onSave} loading={saving} disabled={!dirty || disabled}>{saveLabel ?? t('common.save')}</Button>
      </div>
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/80 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="surface max-h-[90vh] w-full max-w-lg overflow-auto rounded-b-none p-5 sm:rounded-b-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="h-display text-2xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="rounded-lg px-2 text-xl text-star-300 hover:bg-night-700">×</button>
        </div>
        <div className="space-y-3 text-sm">{children}</div>
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Misc small components ---------------- */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-night-700 ${className}`} />;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center gap-2 p-8 text-center">
      <span aria-hidden className="font-display text-4xl text-gold-400">✦</span>
      <p className="h-display text-xl">{title}</p>
      {body && <p className="max-w-sm text-sm text-star-300">{body}</p>}
      {action}
    </div>
  );
}

export function PrivateBadge() {
  const { t } = useI18n();
  return <Badge tone="nebula" title={t('private.tooltip')}>🔒 {t('private.label')}</Badge>;
}

const approvalTone: Record<ApprovalStatus, 'neutral' | 'info' | 'ok' | 'warn' | 'danger'> = { draft: 'neutral', pending: 'info', approved: 'ok', changes_requested: 'warn', rejected: 'danger' };
export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const { t } = useI18n();
  return <Badge tone={approvalTone[status]}>{t(`approval.${status}` as const)}</Badge>;
}

const roleTone: Record<Role, 'gold' | 'nebula' | 'info' | 'ok' | 'warn'> = { superadmin: 'gold', dm: 'gold', co_dm: 'nebula', player: 'info', pending: 'warn' };
export function RoleBadge({ role }: { role: Role }) {
  const { t } = useI18n();
  return <Badge tone={roleTone[role]}>{t(`role.${role}` as const)}</Badge>;
}

export function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-night-950" style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/* ---------------- Tabs ---------------- */
export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string; badge?: ReactNode }[]; value: T; onChange: (v: T) => void; label: string }) {
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + tabs.length) % tabs.length;
    onChange(tabs[n].id);
    (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto rounded-xl border border-night-500 bg-night-900 p-1">
      {tabs.map((tb, i) => (
        <button
          key={tb.id}
          role="tab"
          aria-selected={value === tb.id}
          tabIndex={value === tb.id ? 0 : -1}
          onKeyDown={(e) => onKey(e, i)}
          onClick={() => onChange(tb.id)}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${value === tb.id ? 'bg-night-600 text-gold-300' : 'text-star-200 hover:bg-night-700'}`}
        >
          {tb.label}{tb.badge}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Stepper (Character Builder progress) ---------------- */
export interface StepInfo { id: string; label: string; status: 'todo' | 'current' | 'done' | 'error' }
export function Stepper({ steps, onGo }: { steps: StepInfo[]; onGo: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t('builder.progress')}>
      <ol className="relative flex gap-1 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <li key={s.id} className="shrink-0">
            <button
              type="button"
              aria-current={s.status === 'current' ? 'step' : undefined}
              onClick={() => onGo(s.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${s.status === 'current' ? 'bg-night-600 text-gold-300' : 'text-star-200 hover:bg-night-700'}`}
            >
              <span aria-hidden className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${s.status === 'done' ? 'bg-ok text-night-950' : s.status === 'error' ? 'bg-danger text-night-950' : s.status === 'current' ? 'bg-gold-500 text-night-950' : 'border border-night-500'}`}>
                {s.status === 'done' ? '✓' : s.status === 'error' ? '!' : i + 1}
              </span>
              <span className="whitespace-nowrap">{s.label}</span>
              <span className="sr-only">
                {s.status === 'done' ? t('builder.stepDone') : s.status === 'error' ? t('builder.stepError') : ''}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
