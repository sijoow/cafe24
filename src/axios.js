// src/lib/api.js
import axios from 'axios'

// 1) 기본 인스턴스 생성
const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL ||
    'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// 2) 요청 인터셉터 (토큰 자동 포함 등)
api.interceptors.request.use(
  config => {
    // 예: 로컬스토리지에서 토큰을 꺼내서 헤더에 붙이기
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error),
)

// 3) 응답 인터셉터 (에러 공통 처리 등)
api.interceptors.response.use(
  response => response,
  error => {
    // 예: 401 Unauthorized 처리
    if (error.response?.status === 401) {
      // 자동 로그아웃 로직 등
      console.warn('🚨 Unauthorized - 로그아웃 처리 필요')
    }
    return Promise.reject(error)
  },
)

export default api
