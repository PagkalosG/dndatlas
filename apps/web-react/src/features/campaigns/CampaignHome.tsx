import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useApp, can } from '@/app/AppState';
import { mockAtlasService } from '@/services/atlasService';
import { useAsync } from '@/hooks/useSaver';
import { Avatar, ApprovalBadge, EmptyState, RoleBadge, Skeleton, StatusBanner } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Controls';
import { Button } from '@/components/ui/Button';
import { QrPlaceholder } from '@/components/QrPlaceholder';
import { Illustration } from '@/components/ui/Illustration';

export default function CampaignHome() {
  const { campaignId = 'c1' } = useParams();
  const { t, l, locale } = useI18n();
  const { roleIn, memberships } = useApp();
  const nav = useNavigate();
  const role = roleIn(campaignId);
  const campaign = memberships.find((m) => m.campaignId === campaignId)?.campaign;
  const approvals = useAsync(() => mockAtlasService.listApprovals(campaignId), [campaignId]);
  const members = useAsync(() => mockAtlasService.listMembers(campaignId), [campaignId]);
  const sessions = useAsync(() => mockAtlasService.listSessions(), []);
  const chars = useAsync(() => mockAtlasService.listCharacters(campaignId), [campaignId]);
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale === 'el' ? 'el-GR' : 'en-GB', { dateStyle: 'full', timeStyle: 'short' });

  if (!campaign) return <Skeleton className="h-40" />;

  if (role === 'pending')
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="h-display text-3xl">{campaign.name}</h1>
        <StatusBanner kind="pending" title={t('state.pendingMember')}>{t('state.pendingMemberBody')}</StatusBanner>
        <EmptyState title={t('pending.title')} body={t('pending.body', { dm: campaign.dmName })} action={<Button onClick={() => nav('/campaigns')}>{t('join.backToCampaigns')}</Button>} />
      </div>
    );

  const manage = can.manageCampaign(role);
  const open = (approvals.data ?? []).filter((a) => a.status === 'pending');
  const pendingMembers = (members.data ?? []).filter((m) => m.role === 'pending');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3"><h1 className="h-display text-3xl">{manage ? t('dm.title') : t('home.title')}</h1>{role && <RoleBadge role={role} />}</div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface p-4"><p className="label">{t('dm.nextSession')}</p>{sessions.data?.[0] ? (<><p className="mt-1 font-semibold">{sessions.data[0].title}</p><p className="text-sm text-star-300">{fmt(sessions.data[0].at)}</p>{sessions.data[0].note && <p className="mt-1 text-xs text-star-400">{sessions.data[0].note}</p>}</>) : <Skeleton className="mt-2 h-10" />}</div>
        {manage && <div className="surface p-4"><p className="label">{t('dm.pendingApprovals')}</p><p className="font-display text-4xl text-gold-300">{approvals.state === 'loading' ? '…' : open.length}</p><Link className="text-sm text-gold-300 underline" to={`/c/${campaignId}/approvals`}>{t('dm.review')}</Link></div>}
        {manage && <div className="surface p-4"><p className="label">{t('dm.joinRequests')}</p><p className="font-display text-4xl text-gold-300">{members.state === 'loading' ? '…' : pendingMembers.length}</p><Link className="text-sm text-gold-300 underline" to={`/c/${campaignId}/party`}>{t('dm.manageParty')}</Link></div>}
        {!manage && <div className="surface p-4 md:col-span-2"><p className="label">{t('home.yourStatus')}</p><p className="mt-1 text-sm">{t(`role.${role ?? 'player'}Help` as const)}</p></div>}
      </section>

      <section className="surface p-4">
        <div className="mb-3 flex items-center justify-between"><h2 className="h-display text-2xl">{t('dm.characters')}</h2>{can.participate(role) && <Button size="sm" variant="primary" onClick={() => nav(`/c/${campaignId}/characters/new`)}>{t('home.newCharacter')}</Button>}</div>
        {chars.state === 'loading' ? <Skeleton className="h-20" /> : (chars.data ?? []).length === 0 ? <p className="text-sm text-star-300">{t('home.noCharacters')}</p> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {chars.data!.map((c) => (
              <li key={c.id}>
                <Link to={`/c/${campaignId}/characters/${c.id}`} className="flex items-center gap-3 rounded-xl bg-night-900 p-3 hover:bg-night-700">
                  <Illustration hue={225} glyph="✧" className="h-14 w-14 shrink-0" />
                  <div className="min-w-0"><p className="h-display truncate text-lg">{c.name}</p><p className="truncate text-xs text-star-300">{l(c.speciesName)} {l(c.className)} · {t('summary.level', { n: c.level })}</p><ApprovalBadge status={c.status} /></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {manage && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="surface p-4">
            <h2 className="h-display mb-2 text-2xl">{t('dm.party')}</h2>
            <ul className="space-y-2">
              {(members.data ?? []).map((m) => (
                <li key={m.userId} className="flex items-center gap-3"><Avatar name={m.displayName} color={m.avatarColor} /><span className="flex-1 text-sm">{m.displayName}{m.characterName && <span className="text-star-400"> · {m.characterName}</span>}</span>{m.online && <Badge tone="ok">{t('party.online')}</Badge>}<RoleBadge role={m.role} /></li>
              ))}
            </ul>
          </div>
          <div className="surface flex flex-col items-center gap-2 p-4 text-center">
            <h2 className="h-display text-2xl">{t('dm.invite')}</h2>
            <QrPlaceholder value={campaign.inviteCode} />
            <p className="font-mono text-2xl tracking-widest text-gold-300">{campaign.inviteCode}</p>
            <Button size="sm" onClick={() => navigator.clipboard?.writeText(campaign.inviteCode)}>{t('common.copy')}</Button>
          </div>
        </section>
      )}
    </div>
  );
}
