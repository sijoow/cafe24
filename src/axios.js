// src/axios.js
import axios from 'axios';

// (1) 로컬스토리지나, Context에서 mallId를 꺼내오는 함수
function getMallId() {
  return localStorage.getItem('mallId') || '';
}

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || ''
});

// (2) 모든 요청 전에 mallId를 URL에 붙여준다
api.interceptors.request.use(config => {
  const mallId = getMallId();
  if (mallId) {
    // 예: /categories/all  →  /api/onimon/categories/all
    config.url = `/api/${mallId}${config.url}`;
  }
  return config;
});

export default api;
