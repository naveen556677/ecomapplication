// src/api/axiosClient.js
import axios from 'axios';

// adjust baseURL if needed
const api = axios.create({
  baseURL: 'https://catalog-management-system-dev-ak3ogf6zea-uc.a.run.app',
  timeout: 15000,
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
    'x-internal-call': 'true'
  }
});

// attach token if you store auth somewhere (mmkv/zustand)
api.interceptors.request.use(async (cfg) => {
  // example: add bearer if available
  // const token = await getTokenFromStore();
  // if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
