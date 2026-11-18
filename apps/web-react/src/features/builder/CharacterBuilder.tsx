import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { emptyDraft } from '@/mock/campaignData';
import { mockAtlasService } from '@/services/atlasService';
import { useSaver } from '@/hooks/useSaver';
import { Button } from '@/components/ui/Button';
import { Modal, SaveBar, Stepper, StatusBanner, SyncBanner, type StepInfo } from '@/components/ui/Feedback';
import { useApp } from '@/app/AppState';
import { CharacterSummary } from './CharacterSummary';
import { STEP_IDS, validate, type StepId } from './builderModel';
import { SpeciesStep } from './steps/SpeciesStep';
import { ClassStep } from './steps/ClassStep';
import { BackgroundStep } from './steps/BackgroundStep';
import { SubclassStep } from './steps/SubclassStep';
import { AbilitiesStep } from './steps/AbilitiesStep';
import { ProficienciesStep } from './steps/ProficienciesStep';
import { ChoicesStep } from './steps/ChoicesStep';
import { SpellsStep } from './steps/SpellsStep';
import { EquipmentStep } from './steps/EquipmentStep';
import { DetailsStep } from './steps/DetailsStep';
import { ReviewStep } from './steps/ReviewStep';
import type { CharacterDraft } from '@/types';
import { borruk, luna } from '@/mock/demoCharacters';

const stepComponents = {
  species: SpeciesStep, class: ClassStep, subclass: SubclassStep, background: BackgroundStep, abilities: AbilitiesStep, proficiencies: ProficienciesStep,
  choices: ChoicesStep, spells: SpellsStep, equipment: EquipmentStep, details: DetailsStep, review: ReviewStep,
} as const;

export default function CharacterBuilder() {
  const { t } = useI18n();
  const { campaignId = 'c2' } = useParams();
  const nav = useNavigate();
  const { roleIn } = useApp();
  const role = roleIn(campaignId);

  const persist = useCallback((d: CharacterDraft) => mockAtlasService.saveDraft(d), []);
  const { value: draft, setValue, dirty, sync, setSync, save, cancel, reset } = useSaver<CharacterDraft>(emptyDraft(campaignId), persist);
  const [loaded,setLoaded] = useState(false);
  useEffect(() => {let alive=true;mockAtlasService.getSavedDraft(campaignId).then(r=>{
    if(!alive)return;
    if(r.ok&&r.data)reset(r.data);
    setLoaded(true);
  });return ()=>{alive=false};},[campaignId,reset]);

  const [step, setStep] = useState<StepId>('species');
  const [visited, setVisited] = useState<Set<StepId>>(new Set(['species']));
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const readOnly = draft.status === 'pending' || draft.status === 'approved' || role === 'pending';
  const issues = useMemo(() => validate(draft), [draft]);

  const go = (s: StepId) => { setStep(s); setVisited((v) => new Set(v).add(s)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const update = (patch: Partial<CharacterDraft>) => setValue((d) => ({ ...d, ...patch }));

  const activeSteps=STEP_IDS.filter(id=>id!=='subclass'||draft.level>=3);
  const currentStep=activeSteps.includes(step)?step:(step==='subclass'?'background':step);
  const steps: StepInfo[] = activeSteps.map((id) => {
    const hasIssue = issues.some((i) => i.step === id);
    const status = id === currentStep ? 'current' : !visited.has(id) ? 'todo' : hasIssue ? 'error' : 'done';
    return { id, label: id==='subclass'?(t('step.choices.subclass')):t(`builder.step.${id}` as const), status };
  });

  const idx = activeSteps.indexOf(currentStep);
  const Step = stepComponents[currentStep];

  const submit = async () => {
    setSubmitting(true);
    const r = await mockAtlasService.submitDraft(draft);
    setSubmitting(false);
    setConfirm(false);
    if (r.ok) { reset(r.data); setSync('success'); } else setSync(r.error === 'offline' ? 'offline' : r.error === 'conflict' ? 'conflict' : 'error');
  };

  if(!loaded)return <div className="surface p-6 text-star-200">{t('sync.loading')}</div>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h-display text-3xl">{t('builder.title')}</h1>
        <Button variant="ghost" onClick={() => (dirty && !window.confirm(t('save.discardConfirm')) ? undefined : nav(`/c/${campaignId}`))}>{t('common.exit')}</Button>
      </div>

      {role === 'pending' && <StatusBanner kind="readonly" title={t('state.pendingMember')}>{t('state.pendingMemberBody')}</StatusBanner>}
      {draft.status === 'pending' && <StatusBanner kind="pending" title={t('step.review.pendingTitle')}>{t('state.lockedWhilePending')}</StatusBanner>}
      <SyncBanner state={sync} onRetry={save} onReload={cancel} onKeepMine={save} />

      {!readOnly && (
        <details className="surface p-3 text-sm">
          <summary className="cursor-pointer font-medium">{t('demo.title')}</summary>
          <p className="mt-2 text-xs text-star-300">{t('demo.help')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { setValue(borruk(campaignId)); setVisited(new Set(STEP_IDS)); }}>{t('demo.borruk')}</Button>
            <Button size="sm" onClick={() => { setValue(luna(campaignId)); setVisited(new Set(STEP_IDS)); }}>{t('demo.luna')}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setValue(emptyDraft(campaignId)); setVisited(new Set(['species'])); setStep('species'); }}>{t('demo.clear')}</Button>
          </div>
        </details>
      )}

      <Stepper steps={steps} onGo={(id) => go(id as StepId)} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <details className="surface p-3 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium">{t('summary.title')}</summary>
            <div className="mt-3"><CharacterSummary draft={draft} /></div>
          </details>

          {/* fieldset[disabled] makes every control read-only for pending/approved/pending-member states */}
          <fieldset disabled={readOnly} className="min-w-0 border-0 p-0">
            <Step draft={draft} update={update} readOnly={readOnly} goTo={go} />
          </fieldset>

          <div className="flex items-center justify-between">
            <Button onClick={() => go(activeSteps[idx - 1])} disabled={idx === 0}>← {t('common.back')}</Button>
            {idx < activeSteps.length - 1 ? (
              <Button variant="primary" onClick={() => go(activeSteps[idx + 1])}>{t('common.next')} →</Button>
            ) : (
              <Button variant="primary" disabled={issues.length > 0 || readOnly || draft.status === 'pending'} onClick={() => setConfirm(true)}>{t('builder.submit')}</Button>
            )}
          </div>

          <SaveBar dirty={dirty} saving={sync === 'saving'} readOnly={false} disabled={readOnly} onSave={save} onCancel={cancel} saveLabel={t('builder.saveDraft')} />
        </div>

        <div className="hidden lg:block"><div className="sticky top-20"><CharacterSummary draft={draft} /></div></div>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={t('builder.submitTitle')}
        footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>{t('common.cancel')}</Button><Button variant="primary" loading={submitting} onClick={submit}>{t('builder.submit')}</Button></>}>
        <p>{t('builder.submitBody')}</p>
      </Modal>
    </div>
  );
}
