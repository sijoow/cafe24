// src/axios.js
import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL;

// 모든 /api 요청에 mallId/userId 헤더만 붙이고 URL 재작성 제거
axios.interceptors.request.use(config => {
  const mallId = localStorage.getItem('mallId');
  const userId = localStorage.getItem('userId');

  if (mallId) config.headers['X-Mall-Id'] = mallId;
  if (userId) config.headers['X-User-Id'] = userId;

  return config;
}, err => Promise.reject(err));

export default axios;
