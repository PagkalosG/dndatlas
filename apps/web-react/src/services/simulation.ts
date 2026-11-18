/**
 * Prototype-only controls: lets reviewers force offline / error / conflict states and watch emitted mock events.
 * NOT part of the production contract.
 */
import type { AtlasEvent } from '@/types';

export interface SimulationFlags {
  offline: boolean;
  nextSave: 'success' | 'error' | 'conflict';
  latencyMs: number;
}

type Listener = () => void;

class Store<T> {
  private listeners = new Set<Listener>();
  constructor(private value: T) {}
  get = () => this.value;
  set = (patch: Partial<T> | ((v: T) => T)) => {
    this.value = typeof patch === 'function' ? (patch as (v: T) => T)(this.value) : { ...this.value, ...patch };
    this.listeners.forEach((l) => l());
  };
  subscribe = (l: Listener) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
}

export const simulation = new Store<SimulationFlags>({ offline: false, nextSave: 'success', latencyMs: 600 });

export interface LoggedEvent { id: number; at: string; event: AtlasEvent }
let seq = 0;
export const eventLog = new Store<{ items: LoggedEvent[] }>({ items: [] });

/** Every UI intent that the real backend must handle goes through here. */
export function emitMockEvent(event: AtlasEvent) {
  const entry: LoggedEvent = { id: ++seq, at: new Date().toLocaleTimeString(), event };
  eventLog.set((v) => ({ items: [entry, ...v.items].slice(0, 50) }));
  // eslint-disable-next-line no-console
  console.debug('[atlas:event]', event.type, event.payload);
}
