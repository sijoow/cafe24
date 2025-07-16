// src/axios.js
import axios from 'axios';

axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

axios.interceptors.request.use(config => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    // 이미 /api/{userId} 로 시작하지 않는 호출만 가로채서
    if (!config.url.startsWith(`/api/${userId}`)) {
      // '/api/...' 이면 '...' 부분만 남기고 아니면 전체 그대로
      const rest = config.url.startsWith('/api')
        ? config.url.slice(4)
        : config.url;
      // 최종: /api/{userId}{rest}
      config.url = `/api/${userId}${rest}`;
    }
  }
  return config;
}, err => Promise.reject(err));

export default axios;
