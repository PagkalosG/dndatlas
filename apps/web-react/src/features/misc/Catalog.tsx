import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Badge, Chip, NumberStepper, Segmented, Toggle } from '@/components/ui/Controls';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState, Skeleton, StatusBanner, ApprovalBadge, RoleBadge, PrivateBadge } from '@/components/ui/Feedback';
import { SelectionCard } from '@/components/ui/SelectionCard';
import { ContentArtwork } from '@/components/content/ContentArtwork';
import { L } from '@/i18n';
import type { ApprovalStatus, Role } from '@/types';

/** Storybook-style catalog of the shared components and every required state. */
export default function Catalog() {
  const { t, l } = useI18n();
  const [seg, setSeg] = useState<'a' | 'b'>('a');
  const [n, setN] = useState(2);
  const [tg, setTg] = useState(true);
  const [cb, setCb] = useState<string>();
  const S = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="surface space-y-3 p-4"><h2 className="h-display text-xl">{title}</h2>{children}</section>;

  return (
    <div className="space-y-4">
      <div><h1 className="h-display text-3xl">{t('catalog.title')}</h1><p className="text-sm text-star-300">{t('catalog.help')}</p></div>

      <S title={t('catalog.states')}>
        <div className="grid gap-3 md:grid-cols-2">
          <StatusBanner kind="loading" title={t('sync.loading')} />
          <StatusBanner kind="success" title={t('sync.saved')}>{t('catalog.successBody')}</StatusBanner>
          <StatusBanner kind="error" title={t('sync.error')} actions={<Button size="sm">{t('common.retry')}</Button>}>{t('sync.errorBody')}</StatusBanner>
          <StatusBanner kind="conflict" title={t('sync.conflict')} actions={<><Button size="sm">{t('sync.loadTheirs')}</Button><Button size="sm" variant="primary">{t('sync.keepMine')}</Button></>}>{t('sync.conflictBody')}</StatusBanner>
          <StatusBanner kind="offline" title={t('sync.offline')}>{t('sync.offlineBody')}</StatusBanner>
          <StatusBanner kind="pending" title={t('approval.pending')}>{t('catalog.pendingBody')}</StatusBanner>
          <StatusBanner kind="readonly" title={t('state.readOnly')}>{t('state.readOnlyBody')}</StatusBanner>
          <StatusBanner kind="info" title={t('catalog.infoTitle')}>{t('common.mockContent')}</StatusBanner>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div><p className="label mb-1">{t('catalog.loading')}</p><div className="space-y-2"><Skeleton className="h-6" /><Skeleton className="h-16" /></div></div>
          <div><p className="label mb-1">{t('catalog.empty')}</p><EmptyState title={t('catalog.empty')} body={t('catalog.emptyBody')} /></div>
          <div><p className="label mb-1">{t('catalog.disabled')}</p><div className="flex flex-wrap gap-2"><Button disabled>{t('common.save')}</Button><Button variant="primary" disabled>{t('common.next')}</Button><input className="input" disabled value={t('state.readOnly')} readOnly aria-label={t('catalog.disabled')} /></div></div>
        </div>
      </S>

      <S title={t('catalog.cards')}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SelectionCard title={t('catalog.availableCard')} subtitle="Subtitle" description={t('common.mockContent')} hue={210} glyph="✦" selected onSelect={() => undefined} />
          <SelectionCard title={t('catalog.approvalCard')} hue={285} glyph="◎" availability={{ state: 'available', needsApproval: true, reason: L(t('catalog.reasonApproval'), t('catalog.reasonApproval')) }} onSelect={() => undefined} />
          <SelectionCard title={t('catalog.incompatibleCard')} hue={30} glyph="⚔" availability={{ state: 'incompatible', reason: L(t('catalog.reasonIncompat'), t('catalog.reasonIncompat')) }} onSelect={() => undefined} />
          <SelectionCard title={t('catalog.unavailableCard')} hue={0} glyph="☠" availability={{ state: 'unavailable', reason: L(t('catalog.reasonUnavail'), t('catalog.reasonUnavail')) }} onSelect={() => undefined} />
        </div>
      </S>

      <S title={t('catalog.artwork')}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ContentArtwork alt="" fallback={{ hue: 220, glyph: '✧' }} licenseStatus="original" className="h-28" />
          <ContentArtwork alt="" fallback={{ hue: 45, glyph: '☀' }} licenseStatus="pending_license" className="h-28" />
          <ContentArtwork alt="" assetUrl="about:blank" fallback={{ hue: 330, glyph: '✦' }} licenseStatus="licensed" className="h-28" />
          <ContentArtwork alt="" fallback={{ hue: 150, glyph: '❦' }} licenseStatus="missing" className="h-28" />
        </div>
        <p className="text-xs text-star-300">{t('art.officialWhenLicensed')}</p>
      </S>

      <S title={t('catalog.badges')}>
        <div className="flex flex-wrap gap-2">
          {(['draft', 'pending', 'approved', 'changes_requested', 'rejected'] as ApprovalStatus[]).map((s) => <ApprovalBadge key={s} status={s} />)}
          {(['superadmin', 'dm', 'co_dm', 'player', 'pending'] as Role[]).map((r) => <RoleBadge key={r} role={r} />)}
          <PrivateBadge /><Badge tone="info">{t('inv.needsApproval')}</Badge>
        </div>
      </S>

      <S title={t('catalog.controls')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Segmented label="Segmented" value={seg} onChange={setSeg} options={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]} />
          <NumberStepper label="Stepper" value={n} min={0} max={9} onChange={setN} />
          <Toggle label="Toggle" checked={tg} onChange={setTg} />
          <div className="flex gap-2"><Chip active>Chip</Chip><Chip>Chip</Chip><Chip disabled>Chip</Chip></div>
          <Combobox label="Combobox" value={cb} onChange={setCb} options={[{ id: '1', label: l(L('Alpha', 'Άλφα')) }, { id: '2', label: l(L('Beta', 'Βήτα')) }, { id: '3', label: l(L('Gamma (disabled)', 'Γάμμα (απενεργοποιημένο)')), disabled: true, disabledReason: t('catalog.reasonUnavail') }]} />
        </div>
      </S>
    </div>
  );
}
