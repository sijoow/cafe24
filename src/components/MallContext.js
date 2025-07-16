// src/axios.js
import axios from 'axios';

axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

axios.interceptors.request.use(config => {
  // ① /api/mall 은 mallContext 호출용이니 그대로 통과시킵니다
  if (config.url.startsWith('/api/mall')) {
    return config;
  }

  const userId = localStorage.getItem('userId');
  if (userId) {
    const prefix = `/api/${userId}`;
    // 이미 붙어 있지 않다면
    if (!config.url.startsWith(prefix)) {
      // '/api/...' 이면 그 뒤만 잘라서 붙이고, 아니라면 그대로
      const rest = config.url.startsWith('/api')
        ? config.url.slice(4)
        : config.url;
      config.url = `${prefix}${rest}`;
    }
  }
  return config;
}, err => Promise.reject(err));

export default axios;
