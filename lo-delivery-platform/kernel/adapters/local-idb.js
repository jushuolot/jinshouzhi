/**
 * Tier-0 免费链环：浏览器 IndexedDB（永远可用，零云费用）
 */

const DB_NAME = 'lot_nucleus_v1';
const DB_VER = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains('los')) db.createObjectStore('los', { keyPath: 'loId' });
      if (!db.objectStoreNames.contains('events')) {
        const es = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
        es.createIndex('loId_seq', ['loId', 'seq'], { unique: true });
      }
      if (!db.objectStoreNames.contains('spatial')) db.createObjectStore('spatial', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
  });
}

function txStore(db, name, mode) {
  return db.transaction(name, mode).objectStore(name);
}

export const localIdbAdapter = {
  id: 'local-idb',
  tier: 0,
  label: 'Browser IndexedDB',

  async isAvailable() {
    return typeof indexedDB !== 'undefined';
  },

  async init() {
    this._db = await openDb();
    return true;
  },

  async putLO(lo) {
    await new Promise((res, rej) => {
      const r = txStore(this._db, 'los', 'readwrite').put(lo);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  },

  async getLO(loId) {
    return new Promise((res, rej) => {
      const r = txStore(this._db, 'los', 'readonly').get(loId);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    });
  },

  async listLOs() {
    return new Promise((res, rej) => {
      const r = txStore(this._db, 'los', 'readonly').getAll();
      r.onsuccess = () => res(r.result || []);
      r.onerror = () => rej(r.error);
    });
  },

  async putEvent(evt) {
    const row = { ...evt };
    delete row.id;
    await new Promise((res, rej) => {
      const r = txStore(this._db, 'events', 'readwrite').put(row);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  },

  async getEvents(loId) {
    return new Promise((res, rej) => {
      const idx = txStore(this._db, 'events', 'readonly').index('loId_seq');
      const range = IDBKeyRange.bound([loId, 0], [loId, Infinity]);
      const r = idx.getAll(range);
      r.onsuccess = () => res((r.result || []).sort((a, b) => a.seq - b.seq));
      r.onerror = () => rej(r.error);
    });
  },

  async putSpatial(cells) {
    const store = txStore(this._db, 'spatial', 'readwrite');
    for (const c of cells) {
      await new Promise((res, rej) => {
        const r = store.put(c);
        r.onsuccess = () => res();
        r.onerror = () => rej(r.error);
      });
    }
  },

  async getSpatial(id) {
    return new Promise((res, rej) => {
      const r = txStore(this._db, 'spatial', 'readonly').get(id);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    });
  },

  async listSpatial() {
    return new Promise((res, rej) => {
      const r = txStore(this._db, 'spatial', 'readonly').getAll();
      r.onsuccess = () => res(r.result || []);
      r.onerror = () => rej(r.error);
    });
  },

  async getMeta(key) {
    return new Promise((res, rej) => {
      const r = txStore(this._db, 'meta', 'readonly').get(key);
      r.onsuccess = () => res(r.result?.value ?? null);
      r.onerror = () => rej(r.error);
    });
  },

  async setMeta(key, value) {
    await new Promise((res, rej) => {
      const r = txStore(this._db, 'meta', 'readwrite').put({ key, value });
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  },
};
