import apiClient from '../services/apiClient.js';

const TIMERS_ENDPOINT = '/timers';
const CATEGORIES_ENDPOINT = '/categories';

const TIMERS_UPDATED_EVENT = 'timers:updated';
const CATEGORIES_UPDATED_EVENT = 'categories:updated';

function normalizeArrayPayload(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && Array.isArray(value.items)) {
    return value.items;
  }

  return [];
}

function dispatchDataEvent(eventName) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(eventName));
  }
}

async function readTimersFromStorage() {
  try {
    const response = await apiClient.get(TIMERS_ENDPOINT);
    return normalizeArrayPayload(response?.data);
  } catch (error) {
    console.warn('Unable to read timers from IndexedDB', error);
    return [];
  }
}

async function writeTimersToStorage(timers) {
  const payload = normalizeArrayPayload(timers);

  try {
    await apiClient.put(TIMERS_ENDPOINT, payload);
    dispatchDataEvent(TIMERS_UPDATED_EVENT);
    return payload;
  } catch (error) {
    console.warn('Unable to write timers to IndexedDB', error);
    throw error;
  }
}

async function readCategoriesFromStorage() {
  try {
    const response = await apiClient.get(CATEGORIES_ENDPOINT);
    return normalizeArrayPayload(response?.data)
      .map((value) => {
        if (typeof value === 'string') {
          return value;
        }

        if (
          typeof value === 'object' &&
          value !== null &&
          (typeof value.label === 'string' ||
            typeof value.name === 'string' ||
            typeof value.value === 'string')
        ) {
          return value.label ?? value.name ?? value.value;
        }

        return null;
      })
      .filter((value) => typeof value === 'string' && value.trim().length > 0);
  } catch (error) {
    console.warn('Unable to read categories from IndexedDB', error);
    return [];
  }
}

async function writeCategoriesToStorage(categories) {
  const payload = normalizeArrayPayload(
    (Array.isArray(categories) ? categories : []).filter(
      (value) => typeof value === 'string'
    )
  );

  try {
    await apiClient.put(CATEGORIES_ENDPOINT, payload);
    dispatchDataEvent(CATEGORIES_UPDATED_EVENT);
    return payload;
  } catch (error) {
    console.warn('Unable to write categories to IndexedDB', error);
    throw error;
  }
}

export {
  readTimersFromStorage,
  writeTimersToStorage,
  readCategoriesFromStorage,
  writeCategoriesToStorage,
  TIMERS_ENDPOINT,
  CATEGORIES_ENDPOINT,
  TIMERS_UPDATED_EVENT,
  CATEGORIES_UPDATED_EVENT,
};
