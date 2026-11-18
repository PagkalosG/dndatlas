import { useState } from 'react';
import { useI18n } from '@/i18n';
import { species } from '@/mock/reference';
import { speciesAvailability } from '@/services/rules.mock';
import { SelectionCard } from '@/components/ui/SelectionCard';
import { Chip, Badge } from '@/components/ui/Controls';
import { Modal } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Illustration } from '@/components/ui/Illustration';
import type { StepProps } from '../builderModel';

export function SpeciesStep({ draft, update }: StepProps) {
  const { t, l } = useI18n();
  const [info, setInfo] = useState<string>();
  const [q, setQ] = useState('');
  const current = species.find((s) => s.id === draft.speciesId);
  const detail = species.find((s) => s.id === info);
  const list = species.filter((s) => l(s.name).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="h-display text-2xl">{t('builder.step.species')}</h2>
        <p className="text-sm text-star-300">{t('step.species.help')}</p>
      </div>
      <input className="input max-w-xs" type="search" placeholder={t('common.searchPlaceholder')} aria-label={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div role="radiogroup" aria-label={t('builder.step.species')} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {list.map((s) => (
          <SelectionCard
            key={s.id}
            title={l(s.name)}
            subtitle={l(s.tagline)}
            hue={s.hue}
            glyph={s.glyph}
            artworkUrl={s.artworkUrl}
            selected={draft.speciesId === s.id}
            availability={speciesAvailability(draft.campaignId, s.id)}
            badges={<Badge>{s.size === 'Small' ? t('size.small') : t('size.medium')}</Badge>}
            onSelect={() => speciesAvailability(draft.campaignId, s.id).state === 'available' && update({ speciesId: s.id, lineageId: undefined })}
            onInfo={() => setInfo(s.id)}
          />
        ))}
      </div>

      {current?.lineages && (
        <section className="surface p-4" aria-labelledby="lineage-h">
          <h3 id="lineage-h" className="h-display text-xl">{t('step.species.lineage')}</h3>
          <p className="mb-3 text-sm text-star-300">{t('step.species.lineageHelp')}</p>
          <div className="flex flex-wrap gap-2">
            {current.lineages.map((li) => (
              <Chip key={li.id} active={draft.lineageId === li.id} onClick={() => update({ lineageId: li.id })} title={l(li.note)}>
                {l(li.name)} · <span className="text-star-300">{l(li.note)}</span>
              </Chip>
            ))}
          </div>
        </section>
      )}

      <Modal open={!!detail} onClose={() => setInfo(undefined)} title={detail ? l(detail.name) : ''}
        footer={detail && <Button variant="primary" onClick={() => { if (speciesAvailability(draft.campaignId, detail.id).state === 'available') update({ speciesId: detail.id, lineageId: undefined }); setInfo(undefined); }}>{t('common.choose')}</Button>}>
        {detail && (
          <>
            <Illustration hue={detail.hue} glyph={detail.glyph} className="h-40 w-full" alt={l(detail.name)} />
            <p>{l(detail.description)}</p>
            <ul className="flex flex-wrap gap-2">{detail.traits.map((tr, i) => <Badge key={i} tone="gold">{l(tr)}</Badge>)}</ul>
            <p className="text-xs text-star-400">{t('common.mockContent')}</p>
          </>
        )}
      </Modal>
    </div>
  );
}
