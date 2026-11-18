import { useI18n } from '@/i18n';
import { abilityNames, backgrounds, classes, items, species } from '@/mock/reference';
import { ABILITY_KEYS, type CharacterDraft } from '@/types';
import { Illustration } from '@/components/ui/Illustration';
import { ApprovalBadge, PrivateBadge } from '@/components/ui/Feedback';
import { completeness, validate } from './builderModel';

/** Live Character Summary: updates on every selection. Shows raw selections only — never computed rules values. */
export function CharacterSummary({ draft }: { draft: CharacterDraft }) {
  const { t, l, locale } = useI18n();
  const sp = species.find((s) => s.id === draft.speciesId);
  const cls = classes.find((c) => c.id === draft.classId);
  const bg = backgrounds.find((b) => b.id === draft.backgroundId);
  const sub = cls?.subclasses.find((s) => s.id === draft.subclassId);
  const pct = completeness(draft);
  const issues = validate(draft);

  return (
    <aside aria-label={t('summary.title')} className="surface space-y-3 p-4">
      <div className="flex items-center gap-3">
        <Illustration hue={cls?.hue ?? sp?.hue ?? 230} glyph={cls?.glyph ?? sp?.glyph ?? '?'} className="h-16 w-16 shrink-0" />
        <div className="min-w-0">
          <p className="h-display truncate text-xl">{draft.name || t('summary.unnamed')}</p>
          <p className="truncate text-xs text-star-300">
            {[sp && l(sp.name), cls && l(cls.name), t('summary.level', { n: draft.level })].filter(Boolean).join(' · ')}
          </p>
          <ApprovalBadge status={draft.status} />
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs"><span>{t('summary.completeness')}</span><span>{pct}%</span></div>
        <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('summary.completeness')} className="h-2 overflow-hidden rounded-full bg-night-600">
          <div className="h-full bg-gold-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <dl className="space-y-1.5 text-sm">
        <Row k={t('builder.step.species')} v={sp ? `${l(sp.name)}${draft.lineageId ? ` — ${l(sp.lineages?.find((x) => x.id === draft.lineageId)?.name)}` : ''}` : undefined} />
        <Row k={t('builder.step.class')} v={cls ? `${l(cls.name)}${sub ? ` — ${l(sub.name)}` : ''}` : undefined} />
        <Row k={t('builder.step.background')} v={bg ? l(bg.name) : undefined} />
        <Row k={t('summary.skills')} v={draft.skills.length ? String(draft.skills.length) : undefined} />
        <Row k={t('summary.spells')} v={draft.spells.length ? String(draft.spells.length) : undefined} />
        <Row k={t('summary.items')} v={draft.equipment.length ? draft.equipment.map((id) => l(items.find((i) => i.id === id)?.name)).join(', ') : undefined} />
      </dl>

      <div>
        <p className="label mb-1">{t('builder.step.abilities')}</p>
        <ul className="grid grid-cols-6 gap-1 text-center">
          {ABILITY_KEYS.map((k) => (
            <li key={k} className="rounded-lg bg-night-900 py-1.5">
              <span className="block text-[10px] text-star-300" title={abilityNames[k][locale]}>{abilityNames[k].abbr}</span>
              <span className="font-semibold">{draft.abilities[k] ?? '–'}</span>
              {!!draft.backgroundBoosts[k] && <span className="block text-[10px] text-gold-300">+{draft.backgroundBoosts[k]}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-[11px] text-star-400">{t('summary.noMath')}</p>
      </div>

      {(() => {
        const g: { key: Parameters<typeof t>[0]; src?: string }[] = [];
        if (draft.speciesId === 'aasimar') { g.push({ key: 'granted.resist', src: sp && l(sp.name) }, { key: 'granted.light', src: sp && l(sp.name) }, { key: 'granted.healingHands', src: sp && l(sp.name) }); }
        if (draft.choices.fighting_style?.includes('protection')) g.push({ key: 'granted.protection', src: cls && l(cls.name) });
        if (draft.choices.origin_feat?.includes('tough')) g.push({ key: 'granted.tough', src: bg && l(bg.name) });
        if (draft.tools.includes('smith')) g.push({ key: 'granted.smith', src: bg && l(bg.name) });
        return g.length ? (
          <div>
            <p className="label mb-1">{t('granted.title')}</p>
            <ul className="space-y-1 text-xs text-star-100">{g.map((x) => <li key={x.key} className="rounded-lg bg-night-900 px-2 py-1.5">{t(x.key)}{x.src && <span className="block text-star-300">{t('granted.from', { src: x.src })}</span>}</li>)}</ul>
          </div>
        ) : null;
      })()}

      {(draft.story || draft.privateNotes) && <div className="flex items-center gap-2 text-xs text-star-300"><PrivateBadge />{t('summary.privateKept')}</div>}

      {issues.length > 0 && (
        <details className="rounded-xl bg-night-900 p-2 text-xs">
          <summary className="cursor-pointer text-warn">{t('summary.todo', { n: issues.length })}</summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-star-200">{issues.map((i, n) => <li key={n}>{t(i.key)}</li>)}</ul>
        </details>
      )}
    </aside>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-star-300">{k}</dt>
      <dd className={`truncate text-right ${v ? 'text-star-50' : 'text-star-400'}`}>{v ?? '—'}</dd>
    </div>
  );
}
