// src/lib/api.js
import axios from 'axios';

let mallId = null;

/**
 * 앱이 초기화되거나, 라우터가 바뀔 때 호출해 주세요.
 * @param {string} id 현재 mallId
 */
export function setMallId(id) {
  mallId = id;
}

// 기본 베이스 URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app'
});

// 모든 요청에 interceptor를 걸어서 /api/… → /api/{mallId}/… 로 바꿔 줌
api.interceptors.request.use(config => {
  if (mallId && config.url?.startsWith('/api/')) {
    // "/api/events" → `/api/${mallId}/events`
    config.url = `/api/${encodeURIComponent(mallId)}${config.url.slice(4)}`;
  }
  return config;
});

export default api;
