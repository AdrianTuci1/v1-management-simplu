// Minimal IndexedDB wrapper using native APIs (Dexie can be added later)

const DB_NAME = 'AppDB';
const DB_VERSION = 1;

const STORES = [
  { name: 'clients', keyPath: 'id' },
  { name: 'timeline', keyPath: 'id' },
  { name: 'packages', keyPath: 'id' },
  { name: 'members', keyPath: 'id' },
];

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach(({ name, keyPath }) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

export const db = {
  async put(storeName, value) {
    return withStore(storeName, 'readwrite', (store) => store.put(value));
  },
  async bulkPut(storeName, values) {
    return withStore(storeName, 'readwrite', (store) => {
      values.forEach((v) => store.put(v));
    });
  },
  async get(storeName, key) {
    return withStore(storeName, 'readonly', (store) => store.get(key));
  },
  async getAll(storeName) {
    return withStore(storeName, 'readonly', (store) => store.getAll());
  },
  async delete(storeName, key) {
    return withStore(storeName, 'readwrite', (store) => store.delete(key));
  },
  async clear(storeName) {
    return withStore(storeName, 'readwrite', (store) => store.clear());
  },
};


