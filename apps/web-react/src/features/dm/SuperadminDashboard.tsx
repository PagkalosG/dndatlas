import { useState } from 'react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/AppState';
import { mockAtlasService } from '@/services/atlasService';
import { useAsync } from '@/hooks/useSaver';
import { emitMockEvent } from '@/services/simulation';
import { Avatar, Modal, Skeleton, StatusBanner, Tabs } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Controls';
import { Button } from '@/components/ui/Button';

type Tab = 'health' | 'users' | 'campaigns' | 'audit';

export default function SuperadminDashboard() {
  const { t, l } = useI18n();
  const { isSuperadmin } = useApp();
  const { data, state, reload } = useAsync(() => mockAtlasService.adminOverview(), []);
  const [tab, setTab] = useState<Tab>('health');
  const [action, setAction] = useState<{ label: string; target: string }>();
  const [done, setDone] = useState<string>();

  if (!isSuperadmin) return <StatusBanner kind="readonly" title={t('state.forbidden')}>{t('state.forbiddenBody')}</StatusBanner>;
  if (state === 'loading') return <div className="space-y-2"><Skeleton className="h-24" /><Skeleton className="h-48" /></div>;
  if (!data) return <StatusBanner kind="error" title={t('sync.error')} actions={<Button size="sm" onClick={reload}>{t('common.retry')}</Button>} />;

  const stateTone = { ok: 'ok', degraded: 'warn', down: 'danger' } as const;

  return (
    <div className="space-y-4">
      <h1 className="h-display text-3xl">{t('admin.title')}</h1>
      {done && <StatusBanner kind="success" title={done} />}
      <Tabs<Tab> label={t('admin.title')} value={tab} onChange={setTab} tabs={[{ id: 'health', label: t('admin.health') }, { id: 'users', label: t('admin.users') }, { id: 'campaigns', label: t('nav.campaigns') }, { id: 'audit', label: t('admin.audit') }]} />

      {tab === 'health' && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.health.map((h) => (
            <li key={h.id} className="surface flex items-center justify-between p-4"><div><p className="font-semibold">{l(h.label)}</p><p className="text-xs text-star-300">{l(h.detail)}</p></div><Badge tone={stateTone[h.state]}>{t(`admin.state.${h.state}` as const)}</Badge></li>
          ))}
        </ul>
      )}

      {tab === 'users' && (
        <ul className="space-y-2">
          {data.users.map((u) => (
            <li key={u.id} className="surface flex flex-wrap items-center gap-3 p-3">
              <Avatar name={u.displayName} color={u.avatarColor} />
              <div className="min-w-0 flex-1"><p className="font-semibold">{u.displayName} {u.isSuperadmin && <Badge tone="gold">{t('role.superadmin')}</Badge>}</p><p className="truncate text-xs text-star-300">{u.email}</p></div>
              <Button size="sm" onClick={() => setAction({ label: t('admin.resetAccess'), target: u.displayName })}>{t('admin.resetAccess')}</Button>
              {!u.isSuperadmin && <Button size="sm" variant="danger" onClick={() => setAction({ label: t('admin.suspend'), target: u.displayName })}>{t('admin.suspend')}</Button>}
            </li>
          ))}
        </ul>
      )}

      {tab === 'campaigns' && (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.campaigns.map((c) => <li key={c.id} className="surface p-4"><p className="h-display text-xl">{c.name}</p><p className="text-xs text-star-300">{t('join.dm')}: {c.dmName} · {t('campaigns.members', { n: c.memberCount })}</p><p className="mt-1 font-mono text-xs text-star-400">{c.inviteCode}</p></li>)}
        </ul>
      )}

      {tab === 'audit' && (
        <div className="surface overflow-x-auto p-2">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="text-left text-xs text-star-300"><th className="p-2">{t('admin.when')}</th><th>{t('admin.actor')}</th><th>{t('admin.action')}</th><th>{t('admin.target')}</th></tr></thead>
            <tbody>{data.audit.map((a) => <tr key={a.id} className="border-t border-night-500"><td className="p-2 text-star-300">{a.at}</td><td>{a.actor}</td><td>{l(a.action)}</td><td className="text-star-200">{a.target}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <Modal open={!!action} onClose={() => setAction(undefined)} title={action?.label ?? ''}
        footer={<><Button variant="ghost" onClick={() => setAction(undefined)}>{t('common.cancel')}</Button><Button variant="primary" onClick={() => { emitMockEvent({ type: 'admin.action', payload: { action: action!.label, target: action!.target } }); setDone(`${action!.label}: ${action!.target}`); setAction(undefined); }}>{t('common.confirm')}</Button></>}>
        <p>{t('admin.confirmBody', { target: action?.target ?? '' })}</p>
      </Modal>
    </div>
  );
}
