import { useState } from 'react';
import { useI18n } from '@/i18n';
import { abilityNames, classes } from '@/mock/reference';
import { SelectionCard } from '@/components/ui/SelectionCard';
import { Badge, Segmented, NumberStepper, InfoTip } from '@/components/ui/Controls';
import { Modal } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Illustration } from '@/components/ui/Illustration';
import type { StepProps } from '../builderModel';

type RoleFilter = 'all' | 'martial' | 'caster' | 'hybrid' | 'skill';

export function ClassStep({ draft, update }: StepProps) {
  const { t, l, locale } = useI18n();
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [info, setInfo] = useState<string>();
  const detail = classes.find((c) => c.id === info);
  const list = classes.filter((c) => filter === 'all' || c.role === filter);

  const choose = (id: string) => draft.classId !== id && update({ classId: id, subclassId: undefined, skills: [], choices: {}, spells: [], equipment: [] });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="h-display text-2xl">{t('builder.step.class')}</h2>
        <p className="text-sm text-star-300">{t('step.class.help')}</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Segmented<RoleFilter> label={t('step.class.filter')} value={filter} onChange={setFilter}
          options={[{ id: 'all', label: t('common.all') }, { id: 'martial', label: t('role.martial') }, { id: 'caster', label: t('role.caster') }, { id: 'hybrid', label: t('role.hybrid') }, { id: 'skill', label: t('role.skill') }]} />
        <div className="flex items-end gap-2">
          <div>
            <span className="label mb-1 block">{t('step.class.level')}</span>
            <NumberStepper label={t('step.class.level')} value={draft.level} min={1} max={20} onChange={(v) => update({ level: v, subclassId: v < (classes.find((c) => c.id === draft.classId)?.subclassLevel ?? 3) ? undefined : draft.subclassId })} />
          </div>
          <InfoTip label={t('common.moreInfo')} text={t('step.class.levelHelp')} />
        </div>
      </div>

      <div role="radiogroup" aria-label={t('builder.step.class')} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {list.map((c) => (
          <SelectionCard
            key={c.id}
            title={l(c.name)}
            subtitle={l(c.tagline)}
            hue={c.hue}
            glyph={c.glyph}
            artworkUrl={c.artworkUrl}
            selected={draft.classId === c.id}
            badges={<><Badge tone="gold">d{c.hitDie}</Badge><Badge>{c.primary.map((p) => abilityNames[p].abbr).join('/')}</Badge>{c.spellcaster && <Badge tone="nebula">{t('step.class.caster')}</Badge>}<Badge title={t('step.class.complexity')}>{'●'.repeat(c.complexity)}{'○'.repeat(3 - c.complexity)}</Badge></>}
            onSelect={() => choose(c.id)}
            onInfo={() => setInfo(c.id)}
          />
        ))}
      </div>

      <Modal open={!!detail} onClose={() => setInfo(undefined)} title={detail ? l(detail.name) : ''}
        footer={detail && <Button variant="primary" onClick={() => { choose(detail.id); setInfo(undefined); }}>{t('common.choose')}</Button>}>
        {detail && (
          <>
            <Illustration hue={detail.hue} glyph={detail.glyph} className="h-40 w-full" alt={l(detail.name)} />
            <p>{l(detail.description)}</p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div><dt className="label">{t('step.class.hitDie')}</dt><dd>d{detail.hitDie}</dd></div>
              <div><dt className="label">{t('step.class.primary')}</dt><dd>{detail.primary.map((p) => abilityNames[p][locale]).join(', ')}</dd></div>
              <div><dt className="label">{t('step.class.subclassAt')}</dt><dd>{detail.subclassLevel}</dd></div>
              <div><dt className="label">{t('step.class.complexity')}</dt><dd>{'●'.repeat(detail.complexity)}{'○'.repeat(3 - detail.complexity)}</dd></div>
            </dl>
            <p className="text-xs text-star-400">{t('common.mockContent')}</p>
          </>
        )}
      </Modal>
    </div>
  );
}
