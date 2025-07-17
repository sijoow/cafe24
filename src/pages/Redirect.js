// src/pages/Redirect.jsx
import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../axios'   // axios.defaults.baseURL 이 설정된 인스턴스

export default function Redirect() {
  const navigate = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    // 1) 쿼리에서 mallId(userId, userName) 파라미터 꺼내기
    const params   = new URLSearchParams(search)
    const mallId   = params.get('mallId')   || params.get('state')
    // userId/userName 은 콜백에서 프론트로 내려줄 수도 있지만,
    // 여기서는 API를 통해 한 번에 불러오기 때문에 생략해도 됩니다.

    if (!mallId) {
      console.error('🚨 OAuth 콜백에 mallId가 없습니다.')
      navigate('/', { replace: true })
      return
    }

    // 2) 백엔드 호출: MongoDB 에 저장된 토큰/설치 정보 가져오기
    axios
      .get(`/api/${mallId}/mall`)
      .then(({ data }) => {
        // data = { mallId, userId, userName }
        // 3) localStorage 또는 Context 에 저장
        localStorage.setItem('mallId',   data.mallId)
        if (data.userId)   localStorage.setItem('userId',   data.userId)
        if (data.userName) localStorage.setItem('userName', data.userName)
      })
      .catch(err => {
        console.error('❌ /api/:mallId/mall 호출 실패', err.response?.status, err.response?.data)
        // 필요하면 에러 화면으로 보낼 수도 있습니다.
      })
      .finally(() => {
        // 4) 루트로 리다이렉트
        navigate('/', { replace: true })
      })
  }, [search, navigate])

  return null
}
