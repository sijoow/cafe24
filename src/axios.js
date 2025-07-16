// src/axios.js
import axios from 'axios';

axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

// 요청 전 interceptor: localStorage 에 저장된 mallId 를 URL 앞에 자동 삽입
axios.interceptors.request.use(config => {
  const mallId = localStorage.getItem('mallId');
  if (mallId) {
    // 아직 붙지 않았다면
    if (!config.url.startsWith(`/api/${mallId}`)) {
      // '/api/...' 이면 그 뒤를 path 로 보고
      const rest = config.url.startsWith('/api')
        ? config.url.slice(4)
        : config.url;
      config.url = `/api/${mallId}${rest}`;
    }
  }
  return config;
});

export default axios;
