import { useI18n } from '@/i18n';
import { mockAtlasService } from '@/services/atlasService';
import { useAsync } from '@/hooks/useSaver';
import { EmptyState, Skeleton, StatusBanner } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Controls';
import { Button } from '@/components/ui/Button';

const icon = { approval: '✓', invite: '✉', session: '☾', system: '⚙', journal: '✎' } as const;

export default function Notifications() {
  const { t, l, locale } = useI18n();
  const { data, state, reload, setData } = useAsync(() => mockAtlasService.listNotifications(), []);
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale === 'el' ? 'el-GR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  const read = async (id: string) => {
    setData((data ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)));
    await mockAtlasService.markNotificationRead(id);
  };

  if (state === 'loading') return <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>;
  if (state !== 'idle') return <StatusBanner kind={state === 'offline' ? 'offline' : 'error'} title={t(state === 'offline' ? 'sync.offline' : 'sync.error')} actions={<Button size="sm" onClick={reload}>{t('common.retry')}</Button>} />;
  if (!data?.length) return <EmptyState title={t('notif.empty')} />;

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="h-display text-3xl">{t('nav.notifications')}</h1>
      <ul className="space-y-2">
        {data.map((n) => (
          <li key={n.id} className={`surface flex items-start gap-3 p-4 ${n.read ? 'opacity-80' : 'border-gold-500/50'}`}>
            <span aria-hidden className="mt-0.5 text-xl text-gold-300">{icon[n.kind]}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{l(n.title)} {!n.read && <Badge tone="gold">{t('notif.new')}</Badge>}</p>
              <p className="text-sm text-star-200">{l(n.body)}</p>
              <p className="text-xs text-star-400">{fmt(n.at)}</p>
            </div>
            {!n.read && <Button size="sm" onClick={() => read(n.id)}>{t('notif.markRead')}</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
