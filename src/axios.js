// src/axios.js
import axios from 'axios';

axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

axios.interceptors.request.use(config => {
  // 1) 항상 localStorage 에서 mallId 가져와서 헤더에 실어 보냅니다
  const mallId = localStorage.getItem('mallId');
  if (mallId) {
    config.headers['X-Mall-Id'] = mallId;
  }

  // 2) /api/mall 은 userId prefix 없이, 바로 서버의 /api/mall 로 가야 하므로
  if (config.url.startsWith('/api/mall')) {
    return config;
  }

  // 3) 그 외 모든 /api 요청에는 userId prefix를 붙입니다
  const userId = localStorage.getItem('userId');
  if (userId) {
    const prefix = `/api/${userId}`;
    if (!config.url.startsWith(prefix)) {
      const rest = config.url.startsWith('/api')
        ? config.url.slice(4)
        : config.url;
      config.url = `${prefix}${rest}`;
    }
    // 그리고 userId 도 헤더로 전달하고 싶으면:
    config.headers['X-User-Id'] = userId;
  }

  return config;
}, err => Promise.reject(err));

export default axios;
