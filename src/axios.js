// src/axios.js
import axios from 'axios';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'https://onimon.shop';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  config => {
    const mallId = localStorage.getItem('mallId');
    const userId = localStorage.getItem('userId');

    if (mallId) config.headers['X-Mall-Id'] = mallId;
    if (userId) config.headers['X-User-Id'] = userId;

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // 디버그 로그 (개발시만)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[API REQ]', config.method?.toUpperCase(), config.baseURL + (config.url||''), config);
    }

    return config;
  },
  error => Promise.reject(error)
);

// 응답 인터셉터
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    if (status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
