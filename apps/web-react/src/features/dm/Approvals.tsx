import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useApp, can } from '@/app/AppState';
import { mockAtlasService } from '@/services/atlasService';
import { useAsync } from '@/hooks/useSaver';
import { EmptyState, Skeleton, StatusBanner } from '@/components/ui/Feedback';
import { Badge, Field, Segmented } from '@/components/ui/Controls';
import { Button } from '@/components/ui/Button';
import { CharacterSummary } from '@/features/builder/CharacterSummary';
import type { ApprovalRequest, SyncState } from '@/types';

export default function Approvals() {
  const { campaignId = 'c1' } = useParams();
  const { t, l, locale } = useI18n();
  const { roleIn } = useApp();
  const role = roleIn(campaignId);
  const { data, state, reload, setData } = useAsync(() => mockAtlasService.listApprovals(campaignId), [campaignId]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [selected, setSelected] = useState<string>();
  const pendingId=(data??[]).find(a=>a.id===selected)?.characterId ?? 'd-selene';
  const draft = useAsync(() => mockAtlasService.getPendingDraft(pendingId), [pendingId]);
  const [feedback, setFeedback] = useState('');
  const [sync, setSync] = useState<SyncState>('idle');

  if (!can.approveCharacters(role)) return <StatusBanner kind="readonly" title={t('state.forbidden')}>{t('state.forbiddenBody')}</StatusBanner>;
  if (state === 'loading') return <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;
  if (state !== 'idle') return <StatusBanner kind={state === 'offline' ? 'offline' : 'error'} title={t(state === 'offline' ? 'sync.offline' : 'sync.error')} actions={<Button size="sm" onClick={reload}>{t('common.retry')}</Button>} />;

  const list = (data ?? []).filter((a) => filter === 'all' || a.status === 'pending');
  const sel = (data ?? []).find((a) => a.id === selected);
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale === 'el' ? 'el-GR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  const decide = async (a: ApprovalRequest, d: 'approve' | 'request_changes' | 'reject') => {
    setSync('saving');
    const r = await mockAtlasService.decideApproval(a.id, d, feedback || undefined);
    if (r.ok) { setData((data ?? []).map((x) => (x.id === a.id ? r.data : x))); setSync('success'); setFeedback(''); }
    else setSync(r.error === 'offline' ? 'offline' : r.error === 'conflict' ? 'conflict' : 'error');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h-display text-3xl">{t('approvals.title')}</h1>
        <Segmented label={t('approvals.filter')} hideLabel value={filter} onChange={setFilter} options={[{ id: 'pending', label: t('approval.pending') }, { id: 'all', label: t('common.all') }]} />
      </div>
      {sync === 'success' && <StatusBanner kind="success" title={t('approvals.decided')} />}
      {sync === 'error' && <StatusBanner kind="error" title={t('sync.error')}>{t('sync.errorBody')}</StatusBanner>}
      {sync === 'conflict' && <StatusBanner kind="conflict" title={t('sync.conflict')}>{t('approvals.conflictBody')}</StatusBanner>}
      {sync === 'offline' && <StatusBanner kind="offline" title={t('sync.offline')}>{t('sync.offlineBody')}</StatusBanner>}

      {list.length === 0 ? <EmptyState title={t('approvals.empty')} /> : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <ul className="space-y-2" aria-label={t('approvals.title')}>
            {list.map((a) => (
              <li key={a.id}>
                <button type="button" aria-pressed={selected === a.id} onClick={() => setSelected(a.id)} className={`w-full rounded-2xl border p-4 text-left ${selected === a.id ? 'border-gold-500 bg-night-700' : 'border-night-500 bg-night-800 hover:border-star-400'}`}>
                  <span className="flex items-center justify-between gap-2"><span className="h-display text-lg">{a.characterName}</span><Badge tone={a.status === 'pending' ? 'info' : a.status === 'approved' ? 'ok' : a.status === 'rejected' ? 'danger' : 'warn'}>{t(`approval.${a.status}` as const)}</Badge></span>
                  <span className="block text-sm text-star-200">{t(`approvals.kind.${a.kind}` as const)} · {a.playerName}</span>
                  <span className="block text-xs text-star-400">{l(a.summary)} · {fmt(a.submittedAt)}</span>
                </button>
              </li>
            ))}
          </ul>

          <section className="surface space-y-4 p-4" aria-live="polite">
            {!sel ? <p className="py-10 text-center text-sm text-star-300">{t('approvals.select')}</p> : (
              <>
                <h2 className="h-display text-2xl">{sel.characterName}</h2>
                {sel.changes && (
                  <table className="w-full text-sm"><caption className="label mb-1 text-left">{t('approvals.changes')}</caption>
                    <thead className="sr-only"><tr><th>{t('approvals.field')}</th><th>{t('approvals.from')}</th><th>{t('approvals.to')}</th></tr></thead>
                    <tbody>{sel.changes.map((c) => <tr key={c.field.en} className="border-t border-night-500"><td className="py-2 text-star-300">{l(c.field)}</td><td className="text-danger line-through">{c.from}</td><td className="text-ok">{c.to}</td></tr>)}</tbody></table>
                )}
                {sel.kind === 'new_character' && draft.data && <CharacterSummary draft={draft.data} />}
                {sel.status === 'pending' ? (
                  <>
                    <Field label={t('approvals.feedback')} htmlFor="ap-fb" hint={t('approvals.feedbackHint')}><textarea id="ap-fb" className="input min-h-[80px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} /></Field>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary" loading={sync === 'saving'} onClick={() => decide(sel, 'approve')}>{t('approvals.approve')}</Button>
                      <Button disabled={!feedback.trim() || sync === 'saving'} onClick={() => decide(sel, 'request_changes')} title={!feedback.trim() ? t('approvals.needFeedback') : undefined}>{t('approvals.requestChanges')}</Button>
                      <Button variant="danger" disabled={!feedback.trim() || sync === 'saving'} onClick={() => decide(sel, 'reject')}>{t('approvals.reject')}</Button>
                    </div>
                  </>
                ) : <StatusBanner kind="readonly" title={t('approvals.alreadyDecided')} />}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
