// src/lib/api.js

import axios from 'axios';

// localStorage에서 한 번만 꺼내서 사용
function getMallId() {
  return localStorage.getItem('mallId');
}

const api = axios.create();

// 요청 인터셉터 등록
api.interceptors.request.use(config => {
  const mallId = getMallId();
  if (!mallId) {
    console.warn('💡 mallId가 설정되지 않았습니다.');
    return config;
  }

  // ① baseURL을 /api/{mallId} 로 바꿔치기
  config.baseURL = `/api/${mallId}`;
  // ② 서버 로그(Middleware)용 헤더에도 mallId 추가
  config.headers['X-Mall-Id'] = mallId;

  return config;
});

export default api;
