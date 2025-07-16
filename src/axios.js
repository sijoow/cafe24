// src/axios.js
import axios from 'axios';

// 1) 기본 baseURL 설정
axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

// 2) 요청 전 interceptor: localStorage 에 저장된 mallId, userId 를 URL 경로에 자동 삽입
axios.interceptors.request.use(config => {
  const mallId = localStorage.getItem('mallId');
  const userId = localStorage.getItem('userId');

  if (mallId && userId) {
    // 이미 /api/{mallId}/users/{userId} 가 포함되어 있지 않다면 삽입
    const prefix = `/api/${mallId}/users/${userId}`;
    if (!config.url.startsWith(prefix)) {
      // config.url 이 '/api/...' 으로 시작하면, '/api' 이후 부분만 잘라서 붙이고
      const rest = config.url.startsWith('/api')
        ? config.url.slice(4)
        : config.url;
      config.url = `${prefix}${rest}`;
    }
  }

  return config;
}, error => {
  return Promise.reject(error);
});

export default axios;
