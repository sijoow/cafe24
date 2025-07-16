// src/axios.js

import axios from 'axios';

let _mallId = null;

// Axios 인스턴스 생성
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || ''
});

// 요청 인터셉터: URL이 '/api/...' 로 시작하면 자동으로 '/api/{mallId}/...' 로 변환
instance.interceptors.request.use(config => {
  if (config.url && config.url.startsWith('/api/')) {
    if (!_mallId) {
      console.warn('mallId가 설정되지 않았습니다.');
    }
    // '/api/foo' → `/api/${mallId}/foo`
    config.url = config.url.replace(
      /^\/api\//,
      `/api/${_mallId || ''}/`
    );
  }
  return config;
});

// Context 에서 호출할 setter
export function setMallId(id) {
  _mallId = id;
}

export default instance;
