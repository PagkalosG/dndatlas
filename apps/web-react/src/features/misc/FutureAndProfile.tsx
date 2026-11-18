import { useI18n } from '@/i18n';
import { useApp } from '@/app/AppState';
import { Badge } from '@/components/ui/Controls';
import { Avatar, StatusBanner } from '@/components/ui/Feedback';
import { LocaleSwitch } from '@/app/AppShell';

export function Future() {
  const { t } = useI18n();
  const cards = [['⚗', 'future.homebrew', 'future.homebrewBody'], ['⌂', 'future.bastions', 'future.bastionsBody'], ['⚑', 'future.dmTools', 'future.dmToolsBody'], ['★', 'future.premium', 'future.premiumBody']] as const;
  return (
    <div className="space-y-4">
      <div><h1 className="h-display text-3xl">{t('future.title')}</h1><p className="text-sm text-star-300">{t('future.help')}</p></div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {cards.map(([icon, title, body]) => (
          <li key={title} aria-disabled="true" className="surface space-y-2 p-4 opacity-80">
            <div className="flex items-center justify-between"><span aria-hidden className="font-display text-3xl text-gold-400">{icon}</span><Badge tone="neutral">{t('future.soon')}</Badge></div>
            <h2 className="h-display text-xl">{t(title)}</h2><p className="text-sm text-star-200">{t(body)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Profile() {
  const { t } = useI18n();
  const { user } = useApp();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="h-display text-3xl">{t('profile.title')}</h1>
      {user && <div className="surface flex items-center gap-3 p-4"><Avatar name={user.displayName} color={user.avatarColor} size={48} /><div><p className="font-semibold">{user.displayName}</p><p className="text-xs text-star-300">{user.email}</p></div></div>}
      <section className="surface space-y-2 p-4"><h2 className="h-display text-xl">{t('profile.language')}</h2><LocaleSwitch /><p className="text-xs text-star-300">{t('profile.languageHelp')}</p><p className="text-xs text-star-400">{t('profile.motion')}</p></section>
      <StatusBanner kind="info" title={t('profile.privacy')}>{t('profile.privacyBody')}</StatusBanner>
    </div>
  );
}
