// src/api.js
import axios from 'axios';

const api = axios.create({
  // 절대경로 대신 상대경로를 쓰면, CRA 환경에선 자동으로 origin을 따라갑니다.
  // baseURL: '/api' 로 잡아도 좋고, 여기선 빈 문자열로 둡니다.
  baseURL: '',
});

// 요청 시마다 로컬스토리지에서 mallId 꺼내서 헤더에 추가
api.interceptors.request.use(config => {
  const mallId = localStorage.getItem('mallId');
  if (mallId) {
    config.headers['X-Mall-Id'] = mallId;
  }
  return config;
});

export default api;
