import axios from 'axios';
import createIndexedDbAdapter from './indexedDbAdapter.js';

const DEFAULT_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ?? 'indexeddb://local';

const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (DEFAULT_BASE_URL.startsWith('indexeddb://')) {
  apiClient.defaults.adapter = createIndexedDbAdapter();
}

export default apiClient;

