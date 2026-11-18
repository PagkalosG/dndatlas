import { useCallback, useEffect, useRef, useState } from 'react';
import type { SyncState } from '@/types';
import type { Result } from '@/services/atlasService';

/**
 * Explicit Save / Cancel editing state.
 * - `value` is the working copy, `saved` the last persisted copy; `dirty` is derived.
 * - `save()` maps service errors to SyncState (error | conflict | offline | success).
 * - `cancel()` reverts to the last saved copy.
 */
export function useSaver<T>(initial: T, persist: (v: T) => Promise<Result<T>>) {
  const [saved, setSaved] = useState<T>(initial);
  const [value, setValue] = useState<T>(initial);
  const [sync, setSync] = useState<SyncState>('idle');
  const timer = useRef<number>();

  const dirty = JSON.stringify(saved) !== JSON.stringify(value);

  const reset = useCallback((next: T) => { setSaved(next); setValue(next); setSync('idle'); }, []);

  const save = useCallback(async () => {
    setSync('saving');
    const r = await persist(value);
    if (r.ok) {
      setSaved(r.data);
      setValue(r.data);
      setSync('success');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setSync('idle'), 3000);
    } else {
      setSync(r.error === 'offline' ? 'offline' : r.error === 'conflict' ? 'conflict' : 'error');
    }
  }, [persist, value]);

  const cancel = useCallback(() => { setValue(saved); setSync('idle'); }, [saved]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { value, setValue, saved, dirty, sync, setSync, save, cancel, reset };
}

/** Load async data with loading/error/offline states. */
export function useAsync<T>(fn: () => Promise<Result<T>>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>();
  const [state, setState] = useState<SyncState>('loading');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState('loading');
    fn().then((r) => {
      if (!live) return;
      if (r.ok) { setData(r.data); setState('idle'); } else setState(r.error === 'offline' ? 'offline' : 'error');
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, setData, state, reload: () => setTick((t) => t + 1) };
}
