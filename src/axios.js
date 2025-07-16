// src/axios.js
import axios from 'axios';

axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

axios.interceptors.request.use(config => {
  const userId = localStorage.getItem('userId') || '';

  if (userId) {
    // 이미 /api/{userId} 붙여진 게 아니면 붙이기
    const prefix = `/api/${userId}`;
    if (!config.url.startsWith(prefix)) {
      // '/api/...' → rest='/...'  
      const rest = config.url.startsWith('/api')
        ? config.url.slice(4)
        : config.url;
      config.url = `${prefix}${rest}`;
    }
  }

  return config;
}, err => Promise.reject(err));

export default axios;
