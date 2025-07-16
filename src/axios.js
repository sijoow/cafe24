// src/axios.js
import axios from 'axios';

axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

axios.interceptors.request.use(config => {
  // ① Allow /api/mall to go through without prefixing userId or adding mall header.
  if (config.url.startsWith('/api/mall')) {
    const mallId = localStorage.getItem('mallId');
    if (mallId) {
      config.headers['X-Mall-Id'] = mallId;
    }
    return config;
  }

  // ② For all other /api calls, include the header
  const mallId = localStorage.getItem('mallId');
  if (mallId) {
    config.headers['X-Mall-Id'] = mallId;
  }

  // …your existing userId‐prefix logic…
  return config;
}, err => Promise.reject(err));

export default axios;
