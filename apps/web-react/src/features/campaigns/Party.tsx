import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useApp, can } from '@/app/AppState';
import { mockAtlasService } from '@/services/atlasService';
import { useAsync } from '@/hooks/useSaver';
import { Avatar, Modal, RoleBadge, Skeleton, StatusBanner } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Controls';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import type { Member, Role, SyncState } from '@/types';

export default function Party() {
  const { campaignId = 'c1' } = useParams();
  const { t } = useI18n();
  const { roleIn } = useApp();
  const role = roleIn(campaignId);
  const { data, state, reload, setData } = useAsync(() => mockAtlasService.listMembers(campaignId), [campaignId]);
  const [sync, setSync] = useState<SyncState>('idle');
  const [removing, setRemoving] = useState<Member>();

  const changeRole = async (m: Member, r: Role) => {
    setSync('saving');
    const res = await mockAtlasService.changeMemberRole(campaignId, m.userId, r);
    if (res.ok) { setData((data ?? []).map((x) => (x.userId === m.userId ? { ...x, role: r } : x))); setSync('success'); } else setSync(res.error === 'offline' ? 'offline' : 'error');
  };
  const remove = async () => {
    if (!removing) return;
    const res = await mockAtlasService.removeMember(campaignId, removing.userId);
    if (res.ok) { setData((data ?? []).filter((x) => x.userId !== removing.userId)); setSync('success'); } else setSync(res.error === 'offline' ? 'offline' : 'error');
    setRemoving(undefined);
  };

  if (state === 'loading') return <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>;
  if (state !== 'idle') return <StatusBanner kind={state === 'offline' ? 'offline' : 'error'} title={t(state === 'offline' ? 'sync.offline' : 'sync.error')} actions={<Button size="sm" onClick={reload}>{t('common.retry')}</Button>} />;

  const canChange = can.changeRoles(role);
  const pending = (data ?? []).filter((m) => m.role === 'pending');
  const active = (data ?? []).filter((m) => m.role !== 'pending');

  return (
    <div className="space-y-4">
      <h1 className="h-display text-3xl">{t('party.title')}</h1>
      {!canChange && can.manageCampaign(role) && <StatusBanner kind="readonly" title={t('party.coDmLimit')}>{t('party.coDmLimitBody')}</StatusBanner>}
      {sync === 'success' && <StatusBanner kind="success" title={t('sync.saved')} />}
      {sync === 'error' && <StatusBanner kind="error" title={t('sync.error')}>{t('sync.errorBody')}</StatusBanner>}
      {sync === 'offline' && <StatusBanner kind="offline" title={t('sync.offline')}>{t('sync.offlineBody')}</StatusBanner>}

      {pending.length > 0 && can.manageCampaign(role) && (
        <section className="surface border-warn/40 p-4" aria-labelledby="pm-h">
          <h2 id="pm-h" className="h-display mb-2 text-xl text-warn">{t('party.joinRequests')}</h2>
          <ul className="space-y-2">
            {pending.map((m) => (
              <li key={m.userId} className="flex flex-wrap items-center gap-3"><Avatar name={m.displayName} color={m.avatarColor} /><span className="flex-1 text-sm">{m.displayName}<span className="block text-xs text-star-400">{t('party.requested', { date: m.joinedAt })}</span></span>
                <Button size="sm" variant="primary" onClick={() => changeRole(m, 'player')}>{t('party.accept')}</Button>
                <Button size="sm" variant="danger" onClick={() => setRemoving(m)}>{t('party.decline')}</Button></li>
            ))}
          </ul>
        </section>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {active.map((m) => (
          <li key={m.userId} className="surface space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={m.displayName} color={m.avatarColor} size={44} />
              <div className="min-w-0 flex-1"><p className="font-semibold">{m.displayName}</p><p className="truncate text-xs text-star-300">{m.characterName ?? t('party.noCharacter')}</p></div>
              {m.online ? <Badge tone="ok">{t('party.online')}</Badge> : <Badge>{t('party.offline')}</Badge>}
            </div>
            {canChange && m.role !== 'dm' ? (
              <div className="flex items-end gap-2">
                <div className="flex-1"><Combobox label={t('party.role')} allowClear={false} value={m.role} onChange={(r) => r && changeRole(m, r as Role)}
                  options={[{ id: 'co_dm', label: t('role.co_dm') }, { id: 'player', label: t('role.player') }]} /></div>
                <Button variant="danger" size="sm" onClick={() => setRemoving(m)}>{t('party.remove')}</Button>
              </div>
            ) : <RoleBadge role={m.role} />}
          </li>
        ))}
      </ul>

      <Modal open={!!removing} onClose={() => setRemoving(undefined)} title={t('party.removeTitle')}
        footer={<><Button variant="ghost" onClick={() => setRemoving(undefined)}>{t('common.cancel')}</Button><Button variant="danger" onClick={remove}>{t('party.remove')}</Button></>}>
        <p>{t('party.removeBody', { name: removing?.displayName ?? '' })}</p>
      </Modal>
    </div>
  );
}
