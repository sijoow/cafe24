// src/axios.js
import axios from 'axios';

// ① 실제 API 호스트만 baseURL 으로 설정합니다.
//    (절대로 "/api" 를 여기 붙이지 마세요!)
const instance = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL ||
    'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app'
});

instance.interceptors.request.use(config => {
  // ② localStorage 에 저장된 mallId 를 꺼냅니다.
  const mallId = localStorage.getItem('mallId');
  if (!mallId) {
    console.warn('⚠️ mallId 가 없습니다. AuthCallback 이후에 localStorage 에 set 해 주세요.');
    return config;
  }

  // ③ 기존 URL 에 이미 "/api/{mallId}" 가 붙어 있지 않다면 한 번만 붙입니다.
  //    - config.url 이 "/coupons" 이라면 → "/api/{mallId}/coupons"
  //    - config.url 이 "events/123" 이라면 → "/api/{mallId}/events/123"
  const orig = config.url || '';
  const prefix = `/api/${mallId}/`;

  // startsWith 은 절대 대소문자 구분하니 주의
  if (!orig.startsWith(prefix)) {
    // 중복 슬래시 방지
    const path = orig.startsWith('/') ? orig.slice(1) : orig;
    config.url = prefix + path;
  }

  return config;
});

export default instance;
