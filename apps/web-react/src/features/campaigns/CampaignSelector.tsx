import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/AppState';
import { Button } from '@/components/ui/Button';
import { EmptyState, RoleBadge, Skeleton } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Controls';
import { Illustration } from '@/components/ui/Illustration';
import { emitMockEvent } from '@/services/simulation';

const hue = { gold: 45, nebula: 260, info: 210, ok: 150 } as const;

export default function CampaignSelector() {
  const { t, locale } = useI18n();
  const { memberships, user } = useApp();
  const nav = useNavigate();
  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleString(locale === 'el' ? 'el-GR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h-display text-3xl">{t('campaigns.title')}</h1>
          <p className="text-sm text-star-300">{user ? t('campaigns.welcome', { name: user.displayName }) : ''} {t('campaigns.multiRole')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => nav('/join')}>{t('campaigns.join')}</Button>
          <Button variant="primary" onClick={() => nav('/campaigns/new')}>{t('campaigns.create')}</Button>
        </div>
      </div>

      {memberships.length === 0 ? (
        user ? <EmptyState title={t('campaigns.empty')} body={t('campaigns.emptyBody')} /> : <div className="grid gap-3 md:grid-cols-2"><Skeleton className="h-44" /><Skeleton className="h-44" /></div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {memberships.map(({ campaign: c, role }) => {
            const pending = role === 'pending';
            return (
              <li key={c.id} className="surface overflow-hidden">
                <Illustration hue={hue[c.accent]} glyph="✦" className="h-24 w-full" rounded="rounded-none" />
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="h-display text-2xl leading-tight">{c.name}</h2>
                    <RoleBadge role={role} />
                  </div>
                  <p className="text-sm text-star-200">{c.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-star-300">
                    <Badge>{t('campaigns.members', { n: c.memberCount })}</Badge>
                    {c.nextSession && <Badge tone="info">{t('campaigns.next')}: {fmt(c.nextSession)}</Badge>}
                    {(role === 'dm' || role === 'co_dm') && c.pendingCount > 0 && <Badge tone="warn">{t('campaigns.pendingCount', { n: c.pendingCount })}</Badge>}
                  </div>
                  <Button variant={pending ? 'secondary' : 'primary'} className="w-full" onClick={() => { emitMockEvent({ type: 'campaign.select', payload: { campaignId: c.id } }); nav(`/c/${c.id}`); }}>
                    {pending ? t('campaigns.viewPending') : t('campaigns.enter')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
