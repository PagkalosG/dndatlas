import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useI18n } from '@/i18n';
import { useApp, can } from './AppState';
import { simulation } from '@/services/simulation';
import { Avatar, RoleBadge, StatusBanner } from '@/components/ui/Feedback';
import { Segmented } from '@/components/ui/Controls';
import { mockAtlasService } from '@/services/atlasService';
import type { Locale } from '@/types';

export function LocaleSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <Segmented<Locale> hideLabel label={t('common.language')} value={locale} onChange={setLocale} options={[{ id: 'en', label: 'EN' }, { id: 'el', label: 'ΕΛ' }]} />
  );
}

export function AppShell() {
  const { t } = useI18n();
  const { user, memberships, roleIn, rolePreview, setRolePreview } = useApp();
  const { campaignId } = useParams();
  const nav = useNavigate();
  const sim = useSyncExternalStore(simulation.subscribe, simulation.get);
  const [unread, setUnread] = useState(0);
  const [myCharacterId,setMyCharacterId] = useState('ch1');
  const role = roleIn(campaignId);
  const active = memberships.find((m) => m.campaignId === campaignId)?.campaign;

  useEffect(() => {
    mockAtlasService.listNotifications().then((r) => r.ok && setUnread(r.data.filter((n) => !n.read).length));
  }, [campaignId]);

  useEffect(()=>{if(!campaignId)return;mockAtlasService.getSavedDraft(campaignId).then(r=>setMyCharacterId(r.ok&&r.data?.status==='approved'?r.data.id:'ch1'));},[campaignId,role]);
  const base = campaignId ? `/c/${campaignId}` : '';
  const items = campaignId
    ? [
        { to: base, label: can.manageCampaign(role) ? t('nav.dashboard') : t('nav.home'), end: true, icon: '◈' },
        { to: `${base}/characters/${myCharacterId}`, label: t('nav.character'), icon: '☉', show: can.participate(role) },
        { to: `${base}/characters/new`, label: t('nav.builder'), icon: '✦', show: can.participate(role) },
        { to: `${base}/party`, label: t('nav.party'), icon: '☷', show: can.participate(role) },
        { to: `${base}/approvals`, label: t('nav.approvals'), icon: '✓', show: can.approveCharacters(role) },
        { to: `${base}/journal`, label: t('nav.journal'), icon: '✎', show: can.participate(role) },
        { to: `${base}/gallery`, label: t('nav.gallery'), icon: '▣', show: can.participate(role) },
      ].filter((i) => i.show !== false)
    : [{ to: '/campaigns', label: t('nav.campaigns'), icon: '◈', end: true }, { to: '/profile', label: t('nav.profile'), icon: '☺' }, { to: '/future', label: t('nav.future'), icon: '⌛' }, { to: '/catalog', label: t('nav.catalog'), icon: '▦' }];

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-night-600 text-gold-300' : 'text-star-200 hover:bg-night-700'}`;

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-gold-500 focus:px-3 focus:py-2 focus:text-night-950">{t('a11y.skip')}</a>

      <header className="sticky top-0 z-30 border-b border-night-500/60 bg-night-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 md:px-6">
          <button type="button" onClick={() => nav('/campaigns')} className="flex items-center gap-2 rounded-xl px-1 py-1">
            <span aria-hidden className="font-display text-2xl text-gold-400">✦</span>
            <span className="h-display hidden text-xl sm:inline">Atlas</span>
          </button>
          {active && (
            <div className="flex min-w-0 items-center gap-2 border-l border-night-500 pl-3">
              <span className="truncate text-sm font-medium">{active.name}</span>
              {role && <RoleBadge role={role} />}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitch />
            <Segmented<'player' | 'dm'> label={t('role.player') + ' / ' + t('role.dm')} hideLabel
              value={rolePreview === 'dm' ? 'dm' : 'player'} onChange={(value) => setRolePreview(value)}
              options={[{ id: 'player', label: t('role.player') }, { id: 'dm', label: t('role.dm') }]} />
            <NavLink to="/notifications" aria-label={`${t('nav.notifications')}${unread ? ` (${unread})` : ''}`} className="relative rounded-full p-2 text-lg hover:bg-night-700">
              <span aria-hidden>🔔</span>
              {unread > 0 && <span aria-hidden className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-night-950">{unread}</span>}
            </NavLink>
            {user && (
              <button type="button" onClick={() => nav('/profile')} aria-label={t('nav.profile')} title={t('nav.profile')} className="rounded-full">
                <Avatar name={user.displayName} color={user.avatarColor} />
              </button>
            )}
          </div>
        </div>
        {sim.offline && (
          <div className="mx-auto max-w-7xl px-3 pb-2 md:px-6"><StatusBanner kind="offline" title={t('sync.offline')}>{t('sync.offlineBody')}</StatusBanner></div>
        )}
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-3 pb-28 pt-5 md:grid-cols-[220px_minmax(0,1fr)] md:px-6 md:pb-10">
        <aside className="hidden md:block">
          <nav aria-label={t('nav.main')} className="sticky top-20 space-y-1">
            {campaignId && <NavLink to="/campaigns" className={linkCls}><span aria-hidden>←</span>{t('nav.allCampaigns')}</NavLink>}
            {items.map((i) => <NavLink key={i.to} to={i.to} end={i.end} className={linkCls}><span aria-hidden className="w-5 text-center">{i.icon}</span>{i.label}</NavLink>)}
          </nav>
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 outline-none"><Outlet /></main>
      </div>

      {/* Mobile bottom navigation */}
      <nav aria-label={t('nav.main')} className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-night-500/60 bg-night-950/95 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur md:hidden">
        {items.slice(0, 5).map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] ${isActive ? 'text-gold-300' : 'text-star-300'}`}>
            <span aria-hidden className="text-lg leading-none">{i.icon}</span>{i.label}
          </NavLink>
        ))}
      </nav>
      {/* No authentication, debug toolbar or synchronization in the functional prototype. */}
    </div>
  );
}
