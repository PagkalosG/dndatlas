import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Badge, Field, Segmented } from '@/components/ui/Controls';
import { Button } from '@/components/ui/Button';
import { EmptyState, PrivateBadge, Skeleton, StatusBanner } from '@/components/ui/Feedback';
import { Illustration } from '@/components/ui/Illustration';
import { mockAtlasService } from '@/services/atlasService';
import { useAsync } from '@/hooks/useSaver';
import { useApp, can } from '@/app/AppState';
import type { JournalEntry } from '@/types';

export function JournalPanel({ campaignId }: { campaignId: string }) {
  const { t } = useI18n();
  const { roleIn } = useApp();
  const role = roleIn(campaignId);
  const { data, state, reload, setData } = useAsync(() => mockAtlasService.listJournal(campaignId), [campaignId]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ title: string; body: string; visibility: JournalEntry['visibility'] }>({ title: '', body: '', visibility: 'private' });

  if (state === 'loading') return <div className="space-y-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;
  if (state === 'offline' || state === 'error') return <StatusBanner kind={state === 'offline' ? 'offline' : 'error'} title={t(state === 'offline' ? 'sync.offline' : 'sync.error')} actions={<Button size="sm" onClick={reload}>{t('common.retry')}</Button>} />;

  const visible = (data ?? []).filter((e) => e.visibility !== 'dm_only' || can.manageCampaign(role));
  const add = () => {
    if (!draft.title.trim()) return;
    setData([{ id: `j${Date.now()}`, ...draft, at: new Date().toISOString().slice(0, 10), authorName: 'George' }, ...(data ?? [])]);
    setDraft({ title: '', body: '', visibility: 'private' });
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="h-display text-2xl">{t('nav.journal')}</h2>
        {can.participate(role) && <Button variant="primary" onClick={() => setAdding((a) => !a)}>{adding ? t('common.cancel') : t('journal.new')}</Button>}
      </div>
      {adding && (
        <section className="surface space-y-3 p-4">
          <Field label={t('journal.title')} htmlFor="j-title"><input id="j-title" className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <Field label={t('journal.body')} htmlFor="j-body"><textarea id="j-body" className="input min-h-[100px]" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></Field>
          <Segmented<JournalEntry['visibility']> label={t('journal.visibility')} value={draft.visibility} onChange={(v) => setDraft({ ...draft, visibility: v })}
            options={[{ id: 'private', label: t('vis.private') }, { id: 'party', label: t('vis.party') }, ...(can.manageCampaign(role) ? [{ id: 'dm_only' as const, label: t('vis.dm_only') }] : [])]} />
          <p className="text-xs text-star-300">{t(`vis.${draft.visibility}Help` as const)}</p>
          <Button variant="primary" onClick={add} disabled={!draft.title.trim()}>{t('common.save')}</Button>
        </section>
      )}
      {visible.length === 0 ? <EmptyState title={t('journal.empty')} /> : (
        <ul className="space-y-3">
          {visible.map((e) => (
            <li key={e.id} className="surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="h-display text-xl">{e.title}</h3>
                {e.visibility === 'private' ? <PrivateBadge /> : <Badge tone={e.visibility === 'dm_only' ? 'warn' : 'info'}>{t(`vis.${e.visibility}` as const)}</Badge>}
              </div>
              <p className="mt-1 text-sm text-star-100">{e.body}</p>
              <p className="mt-2 text-xs text-star-400">{e.authorName} · {e.at}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GalleryPanel({ campaignId }: { campaignId: string }) {
  const { t } = useI18n();
  const { roleIn } = useApp();
  const role = roleIn(campaignId);
  const { data, state, reload } = useAsync(() => mockAtlasService.listMedia(campaignId), [campaignId]);
  const [kind, setKind] = useState<'all' | 'map' | 'handout' | 'portrait' | 'scene'>('all');

  if (state === 'loading') return <div className="grid grid-cols-2 gap-3 md:grid-cols-3"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (state !== 'idle') return <StatusBanner kind="error" title={t('sync.error')} actions={<Button size="sm" onClick={reload}>{t('common.retry')}</Button>} />;
  const list = (data ?? []).filter((m) => (kind === 'all' || m.kind === kind) && (m.visibility === 'party' || can.manageCampaign(role)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="h-display text-2xl">{t('nav.gallery')}</h2>
        <Segmented label={t('gallery.filter')} hideLabel value={kind} onChange={setKind}
          options={[{ id: 'all', label: t('common.all') }, { id: 'map', label: t('gallery.map') }, { id: 'handout', label: t('gallery.handout') }, { id: 'portrait', label: t('gallery.portrait') }, { id: 'scene', label: t('gallery.scene') }]} />
      </div>
      {list.length === 0 ? <EmptyState title={t('gallery.empty')} /> : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {list.map((m) => (
            <li key={m.id} className="surface overflow-hidden">
              <Illustration hue={m.hue} glyph={m.kind === 'map' ? '⌖' : m.kind === 'portrait' ? '☺' : m.kind === 'scene' ? '☄' : '✉'} className="h-32 w-full" rounded="rounded-none" alt={m.title} />
              <div className="space-y-1 p-3">
                <p className="font-medium">{m.title}</p>
                {m.caption && <p className="text-xs text-star-300">{m.caption}</p>}
                <div className="flex gap-1"><Badge>{t(`gallery.${m.kind}` as const)}</Badge>{m.visibility === 'dm_only' && <Badge tone="warn">{t('vis.dm_only')}</Badge>}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
