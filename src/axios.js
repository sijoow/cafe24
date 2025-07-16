// src/axios.js
import axios from 'axios';

// ① 기본 base URL 설정
const instance = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL ||
    'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app'
});

// ② 요청 인터셉터: localStorage 또는 URL 에서 꺼낸 mallId 적용
instance.interceptors.request.use(config => {
  // localStorage 에 저장해 둔 mallId (AuthCallback 에서 set해 두었다고 가정)
  const mallId = localStorage.getItem('mallId') || 'onimon';
  // 원래 요청 URL 이 "/coupons" 였다면 → "/api/{mallId}/coupons" 로 변환
  const original = config.url || '';
  // 중복 슬래시 방지
  config.url = `/api/${mallId}${original.startsWith('/') ? '' : '/'}${original}`;
  return config;
});

export default instance;
