const DB_NAME = 'timo-client';
const DB_VERSION = 1;
const KEY_VALUE_STORE = 'kv';

const TIMERS_KEY = 'timers';
const CATEGORIES_KEY = 'categories';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB'));
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_VALUE_STORE)) {
        db.createObjectStore(KEY_VALUE_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function getStore(db, mode = 'readonly') {
  return db.transaction(KEY_VALUE_STORE, mode).objectStore(KEY_VALUE_STORE);
}

async function readValue(db, key) {
  return new Promise((resolve, reject) => {
    const store = getStore(db);
    const request = store.get(key);

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to read value from IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result?.value);
    };
  });
}

async function writeValue(db, key, value) {
  return new Promise((resolve, reject) => {
    const store = getStore(db, 'readwrite');
    const request = store.put({ key, value });

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to write value to IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function normalizeArrayPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
}

function parseData(data) {
  if (data == null) {
    return null;
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  return data;
}

function combineUrl(baseURL = '', requestUrl = '') {
  if (!requestUrl) {
    return baseURL || 'indexeddb://local';
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(requestUrl)) {
    return requestUrl;
  }

  const base = baseURL || 'indexeddb://local';
  if (base.endsWith('/') && requestUrl.startsWith('/')) {
    return base + requestUrl.slice(1);
  }

  if (!base.endsWith('/') && !requestUrl.startsWith('/')) {
    return `${base}/${requestUrl}`;
  }

  return base + requestUrl;
}

function buildResponse(config, status, data, statusText = 'OK') {
  return {
    data,
    status,
    statusText,
    headers: config.headers ?? {},
    config,
    request: null,
  };
}

export default function createIndexedDbAdapter() {
  return async function indexedDbAdapter(config) {
    const method = (config.method ?? 'get').toLowerCase();
    const fullUrl = combineUrl(config.baseURL, config.url);
    const url = new URL(fullUrl);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const db = await openDatabase();

    try {
      if (path === '/timers') {
        if (method === 'get') {
          const value = (await readValue(db, TIMERS_KEY)) ?? [];
          return buildResponse(config, 200, value);
        }

        if (method === 'put') {
          const payload = normalizeArrayPayload(parseData(config.data));
          await writeValue(db, TIMERS_KEY, payload);
          return buildResponse(config, 200, payload);
        }
      }

      if (path === '/categories') {
        if (method === 'get') {
          const value = (await readValue(db, CATEGORIES_KEY)) ?? [];
          return buildResponse(config, 200, value);
        }

        if (method === 'put') {
          const payload = normalizeArrayPayload(parseData(config.data));
          await writeValue(db, CATEGORIES_KEY, payload);
          return buildResponse(config, 200, payload);
        }
      }

      return buildResponse(config, 404, { message: 'Not Found' }, 'Not Found');
    } finally {
      db.close();
    }
  };
}

export { TIMERS_KEY, CATEGORIES_KEY };

