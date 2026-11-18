import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { mockAtlasService } from '@/services/atlasService';
import { useApp } from '@/app/AppState';
import { Button } from '@/components/ui/Button';
import { Field, NumberStepper, Segmented, Toggle } from '@/components/ui/Controls';
import { Stepper, StatusBanner, type StepInfo } from '@/components/ui/Feedback';
import { QrPlaceholder } from '@/components/QrPlaceholder';
import type { Campaign, SyncState } from '@/types';

const STEPS = ['basics', 'rules', 'approval', 'invite'] as const;
type S = (typeof STEPS)[number];

export default function CampaignWizard() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { refreshMemberships } = useApp();
  const [step, setStep] = useState<S>('basics');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(1);
  const [sources, setSources] = useState<string[]>(['Core Rules 2024']);
  const [policy, setPolicy] = useState<'restricted' | 'all' | 'none'>('restricted');
  const [created, setCreated] = useState<Campaign>();
  const [sync, setSync] = useState<SyncState>('idle');

  const idx = STEPS.indexOf(step);
  const nameErr = name.trim().length < 3 ? t('wizard.nameErr') : undefined;
  const stepInfo: StepInfo[] = STEPS.map((id, i) => ({ id, label: t(`wizard.step.${id}` as const), status: id === step ? 'current' : i < idx || created ? 'done' : 'todo' }));
  const toggleSource = (s: string) => setSources((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const create = async () => {
    setSync('saving');
    const r = await mockAtlasService.createCampaign({ name, description, startingLevel: level, contentSources: sources, approvalPolicy: policy });
    if (r.ok) { setCreated(r.data); setSync('success'); refreshMemberships(); setStep('invite'); } else setSync(r.error === 'offline' ? 'offline' : 'error');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="h-display text-3xl">{t('wizard.title')}</h1>
      <Stepper steps={stepInfo} onGo={(id) => !created && setStep(id as S)} />

      {sync === 'error' && <StatusBanner kind="error" title={t('sync.error')} actions={<Button size="sm" onClick={create}>{t('common.retry')}</Button>}>{t('sync.errorBody')}</StatusBanner>}
      {sync === 'offline' && <StatusBanner kind="offline" title={t('sync.offline')} actions={<Button size="sm" onClick={create}>{t('common.retry')}</Button>}>{t('sync.offlineBody')}</StatusBanner>}

      <section className="surface space-y-5 p-5">
        {step === 'basics' && (
          <>
            <Field label={t('wizard.name')} htmlFor="cw-name" error={name && nameErr ? nameErr : undefined}><input id="cw-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></Field>
            <Field label={t('wizard.description')} htmlFor="cw-desc" optional={t('common.optional')}><textarea id="cw-desc" className="input min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          </>
        )}
        {step === 'rules' && (
          <>
            <div><p className="label mb-1">{t('wizard.startLevel')}</p><NumberStepper label={t('wizard.startLevel')} value={level} min={1} max={20} onChange={setLevel} /></div>
            <div className="space-y-3">
              <p className="label">{t('wizard.sources')}</p>
              <Toggle label="Core Rules 2024" description={t('wizard.coreHelp')} checked disabled onChange={() => undefined} />
              <Toggle label={t('wizard.homebrew')} description={t('wizard.homebrewHelp')} checked={sources.includes('Homebrew')} onChange={() => toggleSource('Homebrew')} />
              <Toggle label={t('wizard.licensedArt')} description={t('wizard.licensedArtHelp')} checked={sources.includes('Licensed Art')} onChange={() => toggleSource('Licensed Art')} />
            </div>
          </>
        )}
        {step === 'approval' && (
          <>
            <Segmented label={t('wizard.policy')} value={policy} onChange={setPolicy} options={[{ id: 'restricted', label: t('wizard.policy.restricted') }, { id: 'all', label: t('wizard.policy.all') }, { id: 'none', label: t('wizard.policy.none') }]} />
            <p className="text-sm text-star-200">{t(`wizard.policy.${policy}Help` as const)}</p>
          </>
        )}
        {step === 'invite' && (
          created ? (
            <div className="space-y-3 text-center">
              <StatusBanner kind="success" title={t('wizard.created', { name: created.name })} />
              <QrPlaceholder value={created.inviteCode} />
              <p className="label">{t('wizard.inviteCode')}</p>
              <p className="font-mono text-3xl tracking-widest text-gold-300">{created.inviteCode}</p>
              <Button onClick={() => navigator.clipboard?.writeText(created.inviteCode)}>{t('common.copy')}</Button>
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-star-300">{t('wizard.name')}</dt><dd>{name}</dd></div>
              <div className="flex justify-between"><dt className="text-star-300">{t('wizard.startLevel')}</dt><dd>{level}</dd></div>
              <div className="flex justify-between"><dt className="text-star-300">{t('wizard.sources')}</dt><dd>{sources.join(', ')}</dd></div>
              <div className="flex justify-between"><dt className="text-star-300">{t('wizard.policy')}</dt><dd>{t(`wizard.policy.${policy}` as const)}</dd></div>
              <p className="pt-2 text-xs text-star-300">{t('wizard.inviteAfter')}</p>
            </dl>
          )
        )}
      </section>

      <div className="flex justify-between">
        {created ? <span /> : <Button onClick={() => (idx === 0 ? nav('/campaigns') : setStep(STEPS[idx - 1]))}>{idx === 0 ? t('common.cancel') : `← ${t('common.back')}`}</Button>}
        {created ? <Button variant="primary" onClick={() => nav(`/c/${created.id}`)}>{t('wizard.open')}</Button>
          : idx < STEPS.length - 1 ? <Button variant="primary" disabled={step === 'basics' && !!nameErr} onClick={() => setStep(STEPS[idx + 1])}>{t('common.next')} →</Button>
          : <Button variant="primary" loading={sync === 'saving'} disabled={!!nameErr} onClick={create}>{t('wizard.createBtn')}</Button>}
      </div>
    </div>
  );
}
