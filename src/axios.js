// src/axios.js
import axios from 'axios';

axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

axios.interceptors.request.use(config => {
  // ① localStorage 에서 mallId/userId 꺼내서 헤더에 추가
  const mallId = localStorage.getItem('mallId');
  const userId = localStorage.getItem('userId');
  if (mallId) config.headers['X-Mall-Id'] = mallId;
  if (userId) config.headers['X-User-Id'] = userId;

  // ② URL 재작성 없이, config.url 그대로 서버로 전송
  return config;
}, err => Promise.reject(err));

export default axios;
