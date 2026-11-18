import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { classes, spells } from '@/mock/reference';
import { mockMaxSpellLevel, spellAvailability } from '@/services/rules.mock';
import { Badge, Chip, Toggle } from '@/components/ui/Controls';
import type { Spell } from '@/types';
import type { StepProps } from '../builderModel';

const SCHOOLS: Spell['school'][] = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];

export function SpellsStep({ draft, update }: StepProps) {
  const { t, l } = useI18n();
  const cls = classes.find((c) => c.id === draft.classId);
  const [q, setQ] = useState('');
  const [levels, setLevels] = useState<number[]>([]);
  const [schools, setSchools] = useState<Spell['school'][]>([]);
  const [comps, setComps] = useState<('V' | 'S' | 'M')[]>([]);
  const [usage, setUsage] = useState<('ritual' | 'concentration')[]>([]);
  const [mineOnly, setMineOnly] = useState(true);

  const flip = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const rows = useMemo(() => spells
    .filter((s) => (!q || l(s.name).toLowerCase().includes(q.toLowerCase())))
    .filter((s) => !levels.length || levels.includes(s.level))
    .filter((s) => !schools.length || schools.includes(s.school))
    .filter((s) => !comps.length || comps.every((c) => s.components.includes(c)))
    .filter((s) => !usage.length || usage.every((u) => s.usage.includes(u)))
    .filter((s) => !mineOnly || !cls || s.classes.includes(cls.id))
    .map((s) => ({ s, av: spellAvailability(draft, s) })),
  [q, levels, schools, comps, usage, mineOnly, cls, draft, l]);

  if (!cls) return <p className="rounded-xl border border-dashed border-night-500 p-6 text-center text-sm text-star-300">{t('step.choices.needClass')}</p>;
  if (!cls.spellcaster) return <div className="space-y-3"><h2 className="h-display text-2xl">{t('builder.step.spells')}</h2><p className="surface p-6 text-sm text-star-200">{t('step.spells.nonCaster', { cls: l(cls.name) })}</p></div>;

  const maxLvl = mockMaxSpellLevel(cls, draft.level);
  const levelChips = Array.from({ length: Math.min(9, Math.max(maxLvl, 1) + 1) }, (_, i) => i);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="h-display text-2xl">{t('builder.step.spells')}</h2>
        <p className="text-sm text-star-300">{t('step.spells.help')}</p>
      </div>

      <section className="surface space-y-3 p-4" aria-label={t('step.spells.filters')}>
        <input className="input max-w-sm" type="search" placeholder={t('step.spells.search')} aria-label={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <div>
          <p className="label mb-1">{t('step.spells.level')}</p>
          <div className="flex flex-wrap gap-1.5">{levelChips.map((lv) => <Chip key={lv} active={levels.includes(lv)} onClick={() => setLevels(flip(levels, lv))}>{lv === 0 ? t('step.spells.cantrip') : lv}</Chip>)}</div>
        </div>
        <div>
          <p className="label mb-1">{t('step.spells.school')}</p>
          <div className="flex flex-wrap gap-1.5">{SCHOOLS.map((s) => <Chip key={s} active={schools.includes(s)} onClick={() => setSchools(flip(schools, s))}>{t(`school.${s}` as const)}</Chip>)}</div>
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="label mb-1">{t('step.spells.components')}</p>
            <div className="flex gap-1.5">{(['V', 'S', 'M'] as const).map((c) => <Chip key={c} active={comps.includes(c)} onClick={() => setComps(flip(comps, c))} title={t(`comp.${c}` as const)}>{c}</Chip>)}</div>
          </div>
          <div>
            <p className="label mb-1">{t('step.spells.usage')}</p>
            <div className="flex gap-1.5">{(['ritual', 'concentration'] as const).map((u) => <Chip key={u} active={usage.includes(u)} onClick={() => setUsage(flip(usage, u))}>{t(`usage.${u}` as const)}</Chip>)}</div>
          </div>
        </div>
        <Toggle label={t('step.spells.classOnly', { cls: l(cls.name) })} checked={mineOnly} onChange={setMineOnly} />
      </section>

      <div className="flex items-center justify-between text-sm">
        <span aria-live="polite">{t('step.spells.count', { n: rows.length })}</span>
        <Badge tone="gold">{t('step.spells.selected', { n: draft.spells.length })}</Badge>
      </div>
      <p className="text-xs text-star-400">{t('step.spells.noLimits')}</p>

      {rows.length === 0 ? <p className="rounded-xl border border-dashed border-night-500 p-6 text-center text-sm text-star-300">{t('common.noResults')}</p> : (
        <ul className="grid gap-2 lg:grid-cols-2">
          {rows.map(({ s, av }) => {
            const on = draft.spells.includes(s.id);
            const blocked = av.state !== 'available';
            return (
              <li key={s.id}>
                <button type="button" role="checkbox" aria-checked={on} disabled={blocked && !on} onClick={() => update({ spells: on ? draft.spells.filter((x) => x !== s.id) : [...draft.spells, s.id] })}
                  className={`w-full rounded-xl border p-3 text-left ${on ? 'border-gold-500 bg-gold-500/10' : 'border-night-500 bg-night-800 hover:border-star-400'} disabled:cursor-not-allowed disabled:opacity-70`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{l(s.name)}</span>
                    <span className="flex gap-1"><Badge tone="nebula">{s.level === 0 ? t('step.spells.cantrip') : `${t('step.spells.lvl')} ${s.level}`}</Badge><Badge>{t(`school.${s.school}` as const)}</Badge></span>
                  </span>
                  <span className="mt-1 block text-xs text-star-200">{l(s.summary)}</span>
                  <span className="mt-1 flex flex-wrap gap-1 text-[11px] text-star-300">
                    {s.components.map((c) => <span key={c} className="rounded bg-night-600 px-1.5">{c}</span>)}
                    {s.usage.map((u) => <span key={u} className="rounded bg-night-600 px-1.5">{t(`usage.${u}` as const)}</span>)}
                  </span>
                  {blocked && <span className={`mt-2 block text-xs ${av.state === 'incompatible' ? 'text-warn' : 'text-danger'}`}><strong>{av.state === 'incompatible' ? t('avail.incompatible') : t('avail.unavailable')}:</strong> {l(av.reason)}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
