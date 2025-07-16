// src/axios.js
import axios from 'axios';

<<<<<<< HEAD
// 1) 기본 baseURL 설정
=======
>>>>>>> origin/main
axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

<<<<<<< HEAD
// 2) 요청 전 interceptor: localStorage 에 저장된 mallId, userId 를 URL 경로에 자동 삽입
axios.interceptors.request.use(config => {
  const mallId = localStorage.getItem('mallId');
  const userId = localStorage.getItem('userId');

  if (mallId && userId) {
    // 이미 /api/{mallId}/users/{userId} 가 포함되어 있지 않다면 삽입
    const prefix = `/api/${mallId}/users/${userId}`;
    if (!config.url.startsWith(prefix)) {
      // config.url 이 '/api/...' 으로 시작하면, '/api' 이후 부분만 잘라서 붙이고
=======
axios.interceptors.request.use(config => {
  const userId = localStorage.getItem('userId') || '';

  if (userId) {
    // 이미 /api/{userId} 붙여진 게 아니면 붙이기
    const prefix = `/api/${userId}`;
    if (!config.url.startsWith(prefix)) {
      // '/api/...' → rest='/...'  
>>>>>>> origin/main
      const rest = config.url.startsWith('/api')
        ? config.url.slice(4)
        : config.url;
      config.url = `${prefix}${rest}`;
    }
  }

  return config;
<<<<<<< HEAD
}, error => {
  return Promise.reject(error);
});
=======
}, err => Promise.reject(err));
>>>>>>> origin/main

export default axios;
