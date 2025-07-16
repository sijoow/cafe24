// src/axios.js
import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL;

axios.interceptors.request.use(config => {
  const mallId = localStorage.getItem('mallId');
  const userId = localStorage.getItem('userId');

  // ① /api/mall 은 그대로 두고
  if (config.url === '/api/mall') {
    // 헤더만 붙이고 리턴
    if (mallId) config.headers['X-Mall-Id'] = mallId;
    if (userId) config.headers['X-User-Id'] = userId;
    return config;
  }

  // ② 그 외 /api/** 호출만 userId prefix
  if (userId && config.url.startsWith('/api')) {
    const rest = config.url.slice(4);
    config.url = `/api/${userId}${rest}`;
  }

  // 공통 헤더
  if (mallId) config.headers['X-Mall-Id'] = mallId;
  if (userId) config.headers['X-User-Id'] = userId;
  return config;
});
export default axios;
