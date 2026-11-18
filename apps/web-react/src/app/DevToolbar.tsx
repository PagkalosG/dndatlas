import { useState, useSyncExternalStore } from 'react';
import type { Role } from '@/types';
import { eventLog, simulation } from '@/services/simulation';
import { useApp } from './AppState';
import { useI18n } from '@/i18n';
import { Segmented, Toggle } from '@/components/ui/Controls';

/** Prototype-only panel: simulate offline/errors/conflicts, preview roles, inspect emitted mock events. */
export function DevToolbar() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const sim = useSyncExternalStore(simulation.subscribe, simulation.get);
  const log = useSyncExternalStore(eventLog.subscribe, eventLog.get);
  const { rolePreview, setRolePreview, loggedIn } = useApp();

  return (
    <div className="fixed bottom-[9.5rem] right-3 z-40 md:bottom-4">
      {open && (
        <div role="region" aria-label={t('dev.title')} className="surface mb-2 w-[min(92vw,360px)] space-y-4 p-4 text-sm shadow-2xl">
          <p className="h-display text-lg">{t('dev.title')}</p>
          <Toggle label={t('dev.offline')} checked={sim.offline} onChange={(v) => simulation.set({ offline: v })} />
          <Segmented label={t('dev.nextSave')} value={sim.nextSave} onChange={(v) => simulation.set({ nextSave: v })}
            options={[{ id: 'success', label: t('dev.success') }, { id: 'error', label: t('dev.error') }, { id: 'conflict', label: t('dev.conflict') }]} />
          {loggedIn && (
            <Segmented<Role | 'real'> label={t('dev.rolePreview')} value={rolePreview ?? 'real'} onChange={(v) => setRolePreview(v === 'real' ? undefined : v)}
              options={[{ id: 'real', label: t('dev.real') }, { id: 'dm', label: t('role.dm') }, { id: 'co_dm', label: t('role.co_dm') }, { id: 'player', label: t('role.player') }, { id: 'pending', label: t('role.pending') }]} />
          )}
          <div>
            <p className="label mb-1">{t('dev.events')}</p>
            <ul className="max-h-40 space-y-1 overflow-auto rounded-lg bg-night-950 p-2 font-mono text-[11px] text-star-200">
              {log.items.length === 0 && <li className="text-star-400">—</li>}
              {log.items.map((e) => <li key={e.id}><span className="text-star-400">{e.at}</span> <span className="text-gold-300">{e.event.type}</span></li>)}
            </ul>
          </div>
        </div>
      )}
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="ml-auto flex items-center gap-2 rounded-full border border-night-500 bg-night-950 px-3 py-2 text-xs text-star-200 shadow-xl hover:bg-night-800">
        <span aria-hidden>🛠</span> {t('dev.toggle')}
        {sim.offline && <span className="rounded bg-warn px-1 text-night-950">OFF</span>}
      </button>
    </div>
  );
}
