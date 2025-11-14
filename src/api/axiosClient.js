// src/api/axiosClient.js
import axios from 'axios';
import useStore from '../store/useStore';
import { Alert } from 'react-native';

const API_BASE = 'https://catalog-management-system-dev-ak3ogf6zea-uc.a.run.app';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    try {
      const state = useStore.getState();
      const token = state?.user?.idToken || state?.user?.accessToken || state?.token;
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Axios request interceptor error', e?.message || e);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try { useStore.getState().logout(); } catch (e) {}
      Alert.alert('Session', 'Authentication required. Please login again.');
    }
    return Promise.reject(error);
  }
);

export default api;
