// src/axios.js
import axios from 'axios';

// 모든 요청 전에 mallId 를 꺼내서 URL 에 주입
axios.interceptors.request.use(config => {
  const mallId = localStorage.getItem('mallId');
  if (mallId && config.url?.startsWith('/api/')) {
    // '/api/...' → `/api/${mallId}/...`
    config.url = `/api/${mallId}${config.url.replace(/^\/api/, '')}`;
  }
  return config;
}, error => Promise.reject(error));

export default axios;
