import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { mockAtlasService } from '@/services/atlasService';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Controls';
import { StatusBanner } from '@/components/ui/Feedback';
import { QrPlaceholder } from '@/components/QrPlaceholder';
import type { Campaign } from '@/types';

export default function JoinFlow() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { code: urlCode } = useParams();
  const [code, setCode] = useState(urlCode ?? '');
  const [found, setFound] = useState<Campaign>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [joined, setJoined] = useState(false);

  const lookup = async () => {
    setBusy(true); setErr(undefined);
    const r = await mockAtlasService.joinByCode(code);
    setBusy(false);
    if (r.ok) setFound(r.data); else setErr(r.error === 'not_found' ? t('join.notFound') : t('sync.error'));
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="h-display text-3xl">{t('join.title')}</h1>

      {joined && found ? (
        <>
          <StatusBanner kind="pending" title={t('join.requested')}>{t('join.requestedBody', { dm: found.dmName })}</StatusBanner>
          <Button variant="primary" onClick={() => nav('/campaigns')}>{t('join.backToCampaigns')}</Button>
        </>
      ) : !found ? (
        <section className="surface space-y-4 p-5">
          <p className="text-sm text-star-300">{t('join.help')}</p>
          <Field label={t('join.code')} htmlFor="join-code" error={err} hint={t('join.hint')}>
            <input id="join-code" className="input font-mono uppercase tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXX-XXXX" aria-invalid={!!err} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={busy} disabled={code.trim().length < 4} onClick={lookup}>{t('join.find')}</Button>
            <Button onClick={() => { setCode('STAR-7K2Q'); }}>{t('join.simulateScan')}</Button>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-night-900 p-3 text-xs text-star-300"><QrPlaceholder value="scan" size={56} />{t('join.qrHelp')}</div>
        </section>
      ) : (
        <section className="surface space-y-3 p-5">
          <p className="label">{t('join.preview')}</p>
          <h2 className="h-display text-2xl">{found.name}</h2>
          <p className="text-sm text-star-200">{found.description}</p>
          <p className="text-xs text-star-300">{t('join.dm')}: {found.dmName} · {t('campaigns.members', { n: found.memberCount })}</p>
          <StatusBanner kind="info" title={t('join.approvalNeeded')}>{t('join.approvalNeededBody')}</StatusBanner>
          <div className="flex gap-2"><Button onClick={() => setFound(undefined)}>{t('common.back')}</Button><Button variant="primary" onClick={() => setJoined(true)}>{t('join.request')}</Button></div>
        </section>
      )}
    </div>
  );
}
