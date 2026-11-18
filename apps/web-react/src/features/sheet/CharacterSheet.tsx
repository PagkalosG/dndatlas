import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { abilityNames, items as allItems, skills as allSkills, spells as allSpells } from '@/mock/reference';
import { ABILITY_KEYS, type SheetCharacter } from '@/types';
import { mockAtlasService } from '@/services/atlasService';
import { useAsync, useSaver } from '@/hooks/useSaver';
import { useApp, can } from '@/app/AppState';
import { ApprovalBadge, Modal, PrivateBadge, SaveBar, Skeleton, StatusBanner, SyncBanner, Tabs } from '@/components/ui/Feedback';
import { Badge, Chip, Field, NumberStepper, Toggle } from '@/components/ui/Controls';
import { Combobox } from '@/components/ui/Combobox';
import { Button } from '@/components/ui/Button';
import { Illustration } from '@/components/ui/Illustration';
import { ItemThumb } from '@/components/ItemThumb';
import { JournalPanel, GalleryPanel } from './panels';
import { itemAvailability } from '@/services/rules.mock';
import { emptyDraft } from '@/mock/campaignData';
import { emitMockEvent } from '@/services/simulation';

type Tab = 'overview' | 'combat' | 'spellbook' | 'inventory' | 'journal' | 'gallery';
const CONDITIONS = ['blinded', 'charmed', 'frightened', 'grappled', 'poisoned', 'prone', 'restrained', 'stunned'] as const;

export default function CharacterSheet() {
  const { campaignId = 'c2', characterId = 'ch1' } = useParams();
  const { data, state, reload } = useAsync(() => mockAtlasService.getCharacter(characterId), [characterId]);
  const { t } = useI18n();
  if (state === 'loading') return <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;
  if (!data || state !== 'idle') return <StatusBanner kind={state === 'offline' ? 'offline' : 'error'} title={t(state === 'offline' ? 'sync.offline' : 'sync.error')} actions={<Button size="sm" onClick={reload}>{t('common.retry')}</Button>} />;
  return <SheetView key={data.id} initial={data} campaignId={campaignId} />;
}

function SheetView({ initial, campaignId }: { initial: SheetCharacter; campaignId: string }) {
  const { t, l, locale } = useI18n();
  const { user, roleIn } = useApp();
  const role = roleIn(campaignId);
  const persist = useCallback((c: SheetCharacter) => mockAtlasService.saveCharacter(c), []);
  const { value: c, setValue, dirty, sync, save, cancel, reset } = useSaver<SheetCharacter>(initial, persist);
  const [tab, setTab] = useState<Tab>('overview');
  const [approvalModal, setApprovalModal] = useState<string>();
  const [requested, setRequested] = useState<string[]>([]);
  const [rest, setRest] = useState<'short' | 'long'>();

  const isOwner = c.ownerId === user?.id;
  const readOnly = !(isOwner || can.manageCampaign(role)) || role === 'pending';
  // Private story/notes: visible to the owner only (DMs see the public story, never private notes).
  const canSeePrivate = isOwner;

  const patch = (p: Partial<SheetCharacter>) => setValue((v) => ({ ...v, ...p }));
  const applyRest = (kind: 'short' | 'long') => {
    emitMockEvent({ type: 'character.rest', payload: { characterId: c.id, kind } });
    // MOCK effect only: which resources recover is decided by the rules engine in production.
    patch(kind === 'long'
      ? { vitals: { ...c.vitals, hpCurrent: c.vitals.hpMax }, spellSlots: c.spellSlots.map((s) => ({ ...s, current: s.max })), resources: c.resources.map((r) => ({ ...r, current: r.max })) }
      : { resources: c.resources.map((r) => (r.recharge === 'short' ? { ...r, current: r.max } : r)) });
    setRest(undefined);
  };
  const hpPct = Math.round((c.vitals.hpCurrent / c.vitals.hpMax) * 100);

  return (
    <div className="space-y-4">
      <header className="surface flex flex-wrap items-center gap-4 p-4">
        <Illustration hue={225} glyph="✧" className="h-20 w-20 shrink-0" alt={c.name} />
        <div className="min-w-0 flex-1">
          <h1 className="h-display break-words text-2xl sm:text-3xl">{c.name}</h1>
          <p className="text-sm text-star-200">{[l(c.speciesName), l(c.className), c.subclassName && l(c.subclassName), l(c.backgroundName)].filter(Boolean).join(' · ')} · {t('summary.level', { n: c.level })}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2"><ApprovalBadge status={c.status} /><span className="text-xs text-star-400">{c.ownerName}</span></div>
        </div>
        {!readOnly && (
          <div className="flex w-full gap-2 sm:w-auto">
            <Button size="sm" onClick={() => setRest('short')} icon={<span aria-hidden>🪑</span>}>{t('rest.short')}</Button>
            <Button size="sm" onClick={() => setRest('long')} icon={<span aria-hidden>🛏</span>}>{t('rest.long')}</Button>
          </div>
        )}
        <div className="w-full sm:w-56">
          <div className="mb-1 flex justify-between text-xs"><span>{t('sheet.hp')}</span><span>{c.vitals.hpCurrent}/{c.vitals.hpMax}{c.vitals.hpTemp ? ` (+${c.vitals.hpTemp})` : ''}</span></div>
          <div role="progressbar" aria-label={t('sheet.hp')} aria-valuenow={c.vitals.hpCurrent} aria-valuemin={0} aria-valuemax={c.vitals.hpMax} className="h-2.5 overflow-hidden rounded-full bg-night-600">
            <div className={`h-full ${hpPct > 50 ? 'bg-ok' : hpPct > 25 ? 'bg-warn' : 'bg-danger'}`} style={{ width: `${hpPct}%` }} />
          </div>
        </div>
      </header>

      {readOnly && <StatusBanner kind="readonly" title={t('state.readOnly')}>{t('state.readOnlyBody')}</StatusBanner>}
      <SyncBanner state={sync} onRetry={save} onReload={() => reset(initial)} onKeepMine={save} />

      <Tabs<Tab> label={t('sheet.tabs')} value={tab} onChange={setTab} tabs={[
        { id: 'overview', label: t('sheet.overview') }, { id: 'combat', label: t('sheet.combat') }, { id: 'spellbook', label: t('sheet.spellbook') },
        { id: 'inventory', label: t('nav.inventory') }, { id: 'journal', label: t('nav.journal') }, { id: 'gallery', label: t('nav.gallery') },
      ]} />

      <fieldset disabled={readOnly} className="min-w-0 border-0 p-0">
        {tab === 'overview' && (
          <div className="space-y-4">
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ABILITY_KEYS.map((k) => (
                <li key={k} className="surface p-3 text-center">
                  <p className="label">{abilityNames[k].abbr}</p>
                  <p className="font-display text-3xl text-gold-300">{c.abilities[k].score}</p>
                  <p className="text-xs text-star-200" title={t('sheet.modifier')}>{c.abilities[k].modifier}</p>
                  <p className="text-[11px] text-star-400">{t('sheet.save')} {c.abilities[k].save}</p>
                  <span className="sr-only">{abilityNames[k][locale]}</span>
                </li>
              ))}
            </ul>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[[t('sheet.ac'), c.vitals.ac], [t('sheet.speed'), c.vitals.speed], [t('sheet.initiative'), c.vitals.initiative], [t('sheet.proficiency'), c.vitals.proficiency], [t('sheet.passive'), c.vitals.passivePerception]].map(([k, v]) => (
                <li key={String(k)} className="surface p-3 text-center"><p className="label">{k}</p><p className="text-xl font-semibold">{v}</p></li>
              ))}
            </ul>
            <p className="text-xs text-star-400">{t('sheet.backendValues')}</p>

            <section className="surface p-4">
              <h3 className="h-display mb-2 text-xl">{t('sheet.skills')}</h3>
              <ul className="grid gap-1 sm:grid-cols-2">
                {c.skills.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-lg bg-night-900 px-3 py-1.5 text-sm">
                    <span>{s.proficient ? '●' : '○'} {l(allSkills.find((k) => k.id === s.id)?.name)}</span><span className="text-star-200">{s.bonus}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="surface space-y-3 border-nebula-400/40 p-4">
              <div className="flex items-center gap-2"><h3 className="h-display text-xl">{t('step.details.story')}</h3><PrivateBadge /></div>
              {canSeePrivate ? (
                <>
                  <Field label={t('step.details.story')} htmlFor="sh-story"><textarea id="sh-story" className="input min-h-[90px]" value={c.story} onChange={(e) => patch({ story: e.target.value })} /></Field>
                  <Field label={t('step.details.notes')} htmlFor="sh-notes"><textarea id="sh-notes" className="input min-h-[90px]" value={c.privateNotes} onChange={(e) => patch({ privateNotes: e.target.value })} /></Field>
                </>
              ) : <p className="text-sm text-star-300">🔒 {t('private.hiddenFromYou')}</p>}
            </section>
          </div>
        )}

        {tab === 'combat' && (
          <div className="space-y-4">
            <StatusBanner kind="info" title={t('combat.noDice')}>{t('combat.noDiceBody')}</StatusBanner>
            <section className="surface grid gap-4 p-4 sm:grid-cols-2">
              <div>
                <p className="label mb-1">{t('sheet.hp')}</p>
                <NumberStepper label={t('sheet.hp')} value={c.vitals.hpCurrent} min={0} max={c.vitals.hpMax} onChange={(n) => patch({ vitals: { ...c.vitals, hpCurrent: n } })} />
              </div>
              <div>
                <p className="label mb-1">{t('sheet.tempHp')}</p>
                <NumberStepper label={t('sheet.tempHp')} value={c.vitals.hpTemp} min={0} max={99} onChange={(n) => patch({ vitals: { ...c.vitals, hpTemp: n } })} />
              </div>
            </section>
            <section className="surface p-4">
              <h3 className="h-display mb-2 text-xl">{t('combat.conditions')}</h3>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((k) => <Chip key={k} active={c.conditions.includes(k)} onClick={() => patch({ conditions: c.conditions.includes(k) ? c.conditions.filter((x) => x !== k) : [...c.conditions, k] })}>{t(`cond.${k}` as const)}</Chip>)}
              </div>
            </section>
            {(['attack', 'action', 'bonus', 'reaction'] as const).map((kind) => {
              const rows = c.actions.filter((a) => a.kind === kind);
              if (!rows.length) return null;
              return (
                <section key={kind} className="surface p-4">
                  <h3 className="h-display mb-2 text-xl">{t(`combat.${kind}` as const)}</h3>
                  <ul className="space-y-1.5">{rows.map((a) => <li key={a.id} className="flex items-center justify-between rounded-lg bg-night-900 px-3 py-2 text-sm"><span>{l(a.name)}</span><span className="text-star-300">{a.detail}</span></li>)}</ul>
                </section>
              );
            })}
            {c.resources.length > 0 && (
              <section className="surface p-4">
                <h3 className="h-display mb-2 text-xl">{t('combat.resources')}</h3>
                {c.resources.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm">{l(r.name)} <Badge>{t(`recharge.${r.recharge}` as const)}</Badge></span>
                    <NumberStepper label={l(r.name)} value={r.current} min={0} max={r.max} onChange={(n) => patch({ resources: c.resources.map((x) => (x.id === r.id ? { ...x, current: n } : x)) })} />
                  </div>
                ))}
              </section>
            )}
          </div>
        )}

        {tab === 'spellbook' && (
          <div className="space-y-4">
            {c.spellSlots.length === 0 ? <StatusBanner kind="info" title={t('step.spells.nonCaster', { cls: l(c.className) })} /> : (
              <>
                <section className="surface p-4">
                  <h3 className="h-display mb-2 text-xl">{t('spellbook.slots')}</h3>
                  <ul className="grid gap-3 sm:grid-cols-3">
                    {c.spellSlots.map((s) => (
                      <li key={s.level} className="flex items-center justify-between rounded-xl bg-night-900 p-3">
                        <span className="text-sm">{t('step.spells.lvl')} {s.level}</span>
                        <NumberStepper label={`${t('step.spells.lvl')} ${s.level}`} value={s.current} min={0} max={s.max} onChange={(n) => patch({ spellSlots: c.spellSlots.map((x) => (x.level === s.level ? { ...x, current: n } : x)) })} />
                        <span className="text-xs text-star-400">/{s.max}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="surface p-4">
                  <h3 className="h-display mb-1 text-xl">{t('spellbook.known')}</h3>
                  <p className="mb-3 text-xs text-star-300">{t('spellbook.preparedHelp', { n: c.spellsPrepared.length })}</p>
                  {[0, 1, 2, 3, 4, 5].map((lv) => {
                    const rows = allSpells.filter((s) => s.level === lv && c.spellsKnown.includes(s.id));
                    if (!rows.length) return null;
                    return (
                      <div key={lv} className="mb-3">
                        <p className="label mb-1">{lv === 0 ? t('step.spells.cantrip') : `${t('step.spells.lvl')} ${lv}`}</p>
                        <ul className="grid gap-2 lg:grid-cols-2">
                          {rows.map((s) => {
                            const prepared = c.spellsPrepared.includes(s.id);
                            return (
                              <li key={s.id} className="rounded-xl bg-night-900 p-3">
                                <Toggle label={l(s.name)} description={l(s.summary)} checked={prepared || lv === 0} disabled={lv === 0}
                                  onChange={(v) => patch({ spellsPrepared: v ? [...c.spellsPrepared, s.id] : c.spellsPrepared.filter((x) => x !== s.id) })} />
                                <div className="mt-1 flex flex-wrap gap-1"><Badge>{t(`school.${s.school}` as const)}</Badge>{s.usage.map((u) => <Badge key={u} tone="nebula">{t(`usage.${u}` as const)}</Badge>)}</div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </section>
              </>
            )}
          </div>
        )}

        {tab === 'inventory' && (
          <div className="space-y-4">
            <section className="surface p-4">
              <h3 className="h-display mb-2 text-xl">{t('inv.currency')}</h3>
              <div className="flex flex-wrap gap-4">
                {(['gp', 'sp', 'cp'] as const).map((k) => (
                  <div key={k}><p className="label mb-1">{k.toUpperCase()}</p><NumberStepper label={k.toUpperCase()} value={c.currency[k]} min={0} max={99999} onChange={(n) => patch({ currency: { ...c.currency, [k]: n } })} /></div>
                ))}
              </div>
            </section>
            <section className="surface p-4">
              <h3 className="h-display mb-2 text-xl">{t('nav.inventory')}</h3>
              <ul className="space-y-2">
                {c.inventory.map((row) => {
                  const it = allItems.find((i) => i.id === row.itemId)!;
                  return (
                    <li key={row.itemId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-night-900 p-3">
                      <ItemThumb item={it} showName />
                      <div className="flex flex-wrap items-center gap-3">
                        {it.attunement && <Badge tone={row.attuned ? 'ok' : 'warn'}>{row.attuned ? t('inv.attuned') : t('item.attunement')}</Badge>}
                        <Toggle label={t('inv.equipped')} checked={row.equipped} onChange={(v) => patch({ inventory: c.inventory.map((x) => (x.itemId === row.itemId ? { ...x, equipped: v } : x)) })} />
                        <NumberStepper label={t('inv.qty')} value={row.qty} min={1} max={99} onChange={(n) => patch({ inventory: c.inventory.map((x) => (x.itemId === row.itemId ? { ...x, qty: n } : x)) })} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="surface space-y-2 p-4">
              <h3 className="h-display text-xl">{t('inv.request')}</h3>
              <p className="text-xs text-star-300">{t('inv.requestHelp')}</p>
              <Combobox label={t('inv.addItem')} placeholder={t('common.searchPlaceholder')}
                options={allItems.filter((i) => !c.inventory.some((r) => r.itemId === i.id)).map((i) => { const av = itemAvailability({ ...emptyDraft(campaignId), classId: 'wizard' }, i); return { id: i.id, label: l(i.name), hint: av.needsApproval ? t('inv.needsApproval') : i.category, disabled: av.state === 'unavailable', disabledReason: av.state === 'unavailable' ? l(av.reason) : undefined }; })}
                onChange={(id) => id && setApprovalModal(id)} />
              {requested.map((id) => <StatusBanner key={id} kind="pending" title={t('inv.requested', { name: l(allItems.find((i) => i.id === id)?.name) })} />)}
            </section>
          </div>
        )}
      </fieldset>

      {tab === 'journal' && <JournalPanel campaignId={campaignId} />}
      {tab === 'gallery' && <GalleryPanel campaignId={campaignId} />}

      {['overview', 'combat', 'spellbook', 'inventory'].includes(tab) && <SaveBar dirty={dirty} saving={sync === 'saving'} readOnly={readOnly} onSave={save} onCancel={cancel} />}

      <Modal open={!!rest} onClose={() => setRest(undefined)} title={rest ? t('rest.confirm', { kind: t(`rest.${rest}` as const).toLowerCase() }) : ''}
        footer={<><Button variant="ghost" onClick={() => setRest(undefined)}>{t('common.cancel')}</Button><Button variant="primary" onClick={() => rest && applyRest(rest)}>{t('common.confirm')}</Button></>}>
        <p>{t('rest.confirmBody')}</p>
      </Modal>

      <Modal open={!!approvalModal} onClose={() => setApprovalModal(undefined)} title={t('inv.requestTitle')}
        footer={<><Button variant="ghost" onClick={() => setApprovalModal(undefined)}>{t('common.cancel')}</Button><Button variant="primary" onClick={() => { setRequested((r) => [...r, approvalModal!]); setApprovalModal(undefined); }}>{t('inv.sendRequest')}</Button></>}>
        <p>{t('inv.requestBody', { name: l(allItems.find((i) => i.id === approvalModal)?.name) })}</p>
      </Modal>
    </div>
  );
}
