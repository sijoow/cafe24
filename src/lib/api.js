// src/lib/api.js
import axios from 'axios';

function getMallId() {
  return localStorage.getItem('mallId');
}

const api = axios.create();
api.interceptors.request.use(config => {
  const mallId = getMallId();
  if (!mallId) throw new Error('mallId가 없습니다');
  // ─── 여기가 헤더를 붙여주는 부분
  config.headers['X-Mall-Id'] = mallId;
  // ─── 그리고 baseURL에도 mallId를 prefix
  config.baseURL = `/api/${mallId}`;
  return config;
});

export default api;
