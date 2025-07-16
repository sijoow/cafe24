import axios from 'axios';

/* localStorage 에 저장된 mallId 직접 사용 */
function getMallId() {
  return localStorage.getItem('mallId') || '';
}

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL ||
    'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app',
});

/* 요청 인터셉터 */
api.interceptors.request.use(config => {
  const mallId = getMallId();
  if (!mallId) return config;          // 로그인前·설치前 등

  // 이미 /api/{mallId}/ 로 시작하면 그대로 둠
  if (/\/api\/[^/]+/.test(config.url)) return config;

  // 그렇지 않으면 자동으로 mallId 삽입
  config.url = `/api/${mallId}${config.url.startsWith('/') ? '' : '/'}${config.url}`;
  return config;
});

export default api;
