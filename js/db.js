import { DB_NAME, DB_VERSION, STORES } from './utils/constants.js';

let dbInstance = null;
let openPromise = null;

function upgrade(db) {
  if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
    const store = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id', autoIncrement: true });
    store.createIndex('sortOrder', 'sortOrder');
    store.createIndex('deleted', 'deleted');
  }

  if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
    const store = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id', autoIncrement: true });
    store.createIndex('categoryId', 'categoryId');
    store.createIndex('favorite', 'favorite');
    store.createIndex('deleted', 'deleted');
    store.createIndex('sortOrder', 'sortOrder');
    store.createIndex('normalizedName', 'normalizedName');
  }

  

  
  if (!db.objectStoreNames.contains(STORES.SHOPPING_LISTS)) {
    const store = db.createObjectStore(STORES.SHOPPING_LISTS, { keyPath: 'id', autoIncrement: true });
    store.createIndex('createdAt', 'createdAt');
    store.createIndex('updatedAt', 'updatedAt');
    store.createIndex('name', 'name');
  }

  if (!db.objectStoreNames.contains(STORES.SHOPPING_LIST_ITEMS)) {
    const store = db.createObjectStore(STORES.SHOPPING_LIST_ITEMS, { keyPath: 'id', autoIncrement: true });
    store.createIndex('listId', 'listId');
    store.createIndex('productId', 'productId');
    store.createIndex('productName', 'productName');
    store.createIndex('categoryName', 'categoryName');
    store.createIndex('purchasedAt', 'purchasedAt');
    store.createIndex('checked', 'checked');
    store.createIndex('sortOrder', 'sortOrder');
  }

  if (!db.objectStoreNames.contains(STORES.HISTORY)) {
    const store = db.createObjectStore(STORES.HISTORY, { keyPath: 'id', autoIncrement: true });
    store.createIndex('date', 'date');
  }

  if (!db.objectStoreNames.contains(STORES.PURCHASE_ITEMS)) {
    const store = db.createObjectStore(STORES.PURCHASE_ITEMS, { keyPath: 'id', autoIncrement: true });
    store.createIndex('historyId', 'historyId');
    store.createIndex('productId', 'productId');
    store.createIndex('productName', 'productName');
    store.createIndex('categoryName', 'categoryName');
    store.createIndex('purchasedAt', 'purchasedAt');
  }

  if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
  }
}

export function openDB() {
  if (openPromise) return openPromise;
  openPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => upgrade(event.target.result);
    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => dbInstance.close();
      resolve(dbInstance);
    };
    request.onerror = () => reject(new Error('تعذر فتح قاعدة البيانات المحلية: ' + request.error?.message));
    request.onblocked = () => reject(new Error('قاعدة البيانات مفتوحة في نافذة أخرى. أغلق النوافذ الأخرى للتطبيق ثم أعد المحاولة.'));
  });
  return openPromise;
}

function withStore(storeName, mode, executor) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    Promise.resolve(executor(store))
      .then((r) => { result = r; })
      .catch(reject);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(new Error('خطأ في قاعدة البيانات: ' + tx.error?.message));
    tx.onabort = () => reject(new Error('تم إلغاء العملية على قاعدة البيانات'));
  }));
}

function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const db = {
  add(storeName, data) {
    return withStore(storeName, 'readwrite', (store) => reqToPromise(store.add(data)));
  },
  put(storeName, data) {
    return withStore(storeName, 'readwrite', (store) => reqToPromise(store.put(data)));
  },
  get(storeName, key) {
    return withStore(storeName, 'readonly', (store) => reqToPromise(store.get(key)));
  },
  getAll(storeName) {
    return withStore(storeName, 'readonly', (store) => reqToPromise(store.getAll()));
  },
  getAllByIndex(storeName, indexName, query) {
    return withStore(storeName, 'readonly', (store) => reqToPromise(store.index(indexName).getAll(query)));
  },
  delete(storeName, key) {
    return withStore(storeName, 'readwrite', (store) => reqToPromise(store.delete(key)));
  },
  clear(storeName) {
    return withStore(storeName, 'readwrite', (store) => reqToPromise(store.clear()));
  },
  count(storeName) {
    return withStore(storeName, 'readonly', (store) => reqToPromise(store.count()));
  },
};




