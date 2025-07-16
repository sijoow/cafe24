import axios from 'axios';

axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

// 기존 userId → URL prefix 로직 위에 삽입
axios.interceptors.request.use(config => {
  // localStorage에서 mallId/userId 가져오기
  const mallId = localStorage.getItem('mallId');
  const userId = localStorage.getItem('userId');
  if (mallId) {
    config.headers['X-Mall-Id'] = mallId;
  }
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }

  // (기존 URL prefix 로직)
  if (userId) {
    if (!config.url.startsWith(`/api/${userId}`)) {
      const rest = config.url.startsWith('/api')
        ? config.url.slice(4)
        : config.url;
      config.url = `/api/${userId}${rest}`;
    }
  }

  return config;
}, err => Promise.reject(err));

export default axios;
