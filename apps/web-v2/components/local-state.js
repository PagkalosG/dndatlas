/* D&D Atlas v2 local-only prototype persistence. No network, accounts or sync. */
(() => {
  'use strict';
  const DB_NAME = 'dnd-atlas-v2-prototype';
  const STORE = 'snapshots';
  const KEY = 'campaign-and-character-v1';
  let openPromise;
  function open() {
    if (openPromise) return openPromise;
    openPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { reject(new Error('IndexedDB unavailable')); return; }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open local data'));
      request.onblocked = () => reject(new Error('Local data is open in another tab'));
    }).catch(error => { openPromise = null; throw error; });
    return openPromise;
  }
  async function transact(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let value;
      const req = action(store);
      req.onsuccess = () => { value = req.result; };
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error || new Error('Local storage transaction failed'));
      tx.onabort = () => reject(tx.error || new Error('Local storage transaction aborted'));
    });
  }
  async function load() {
    const result = await transact('readonly', store => store.get(KEY));
    return result && result.schema === 1 ? result : null;
  }
  async function save(payload) {
    const snapshot = structuredClone({ schema: 1, savedAt: new Date().toISOString(), ...payload });
    return transact('readwrite', store => store.put(snapshot, KEY));
  }
  async function clear() { return transact('readwrite', store => store.delete(KEY)); }
  window.ATLAS_V2_LOCAL = Object.freeze({ load, save, clear });
})();
