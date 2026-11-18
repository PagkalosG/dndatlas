import { useI18n } from '@/i18n';
import { abilityNames, backgrounds, skills } from '@/mock/reference';
import { Badge } from '@/components/ui/Controls';
import { Combobox } from '@/components/ui/Combobox';
import type { StepProps } from '../builderModel';

export function BackgroundStep({ draft, update }: StepProps) {
  const { t, l, locale } = useI18n();
  const bg = backgrounds.find((b) => b.id === draft.backgroundId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="h-display text-2xl">{t('builder.step.background')}</h2>
        <p className="text-sm text-star-300">{t('step.background.help')}</p>
      </div>

      <div className="max-w-md">
        <Combobox
          label={t('builder.step.background')}
          options={backgrounds.map((b) => ({ id: b.id, label: l(b.name), hint: b.skills.map((s) => l(skills.find((k) => k.id === s)!.name)).join(' · ') }))}
          value={draft.backgroundId}
          onChange={(id) => update({ backgroundId: id, backgroundBoosts: {}, skills: [], languages: ['common'] })}
        />
      </div>

      {bg ? (
        <section className="surface space-y-4 p-4" aria-live="polite">
          <div>
            <h3 className="h-display text-xl">{l(bg.name)}</h3>
            <p className="text-sm text-star-200">{l(bg.description)}</p>
          </div>
          <p className="label">{t('step.background.implications')}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            <li className="rounded-xl bg-night-900 p-3 text-sm"><span className="label block">{t('step.background.skills')}</span>{bg.skills.map((s) => <Badge key={s} tone="gold">{l(skills.find((k) => k.id === s)!.name)}</Badge>)}</li>
            <li className="rounded-xl bg-night-900 p-3 text-sm"><span className="label block">{t('step.background.tool')}</span>{l(bg.tool)}</li>
            <li className="rounded-xl bg-night-900 p-3 text-sm"><span className="label block">{t('step.background.feat')}</span>{l(bg.feat)}</li>
            <li className="rounded-xl bg-night-900 p-3 text-sm"><span className="label block">{t('step.background.boosts')}</span>{bg.abilityBoostOptions.map((a) => abilityNames[a][locale]).join(' · ')}<span className="mt-1 block text-xs text-star-300">{t('step.background.boostsHelp')}</span></li>
          </ul>
          <p className="text-xs text-star-400">{t('common.mockContent')}</p>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-night-500 p-6 text-center text-sm text-star-300">{t('step.background.empty')}</p>
      )}
    </div>
  );
}
