// src/pages/Redirect.jsx
import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../axios' // 기존에 export default 한 axios 인스턴스

export default function Redirect() {
  const navigate = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(search)
      const mallId = params.get('mall_id') || params.get('state')
      const authError = params.get('auth_error')

      if (!mallId) {
        console.error('mall_id가 없습니다')
        return navigate('/', { replace: true })
      }

      // (1) 우선 로컬에 mallId 저장 (다른 컴포넌트에서 사용)
      localStorage.setItem('mallId', mallId)

      try {
        // (2) 백엔드에서 설치 상태 확인
        const { data } = await api.get(`/api/${mallId}/mall`)

        // 설치되지 않으면 설치 URL로 브라우저 리디렉션
        if (data.installed === false && data.installUrl) {
          // replace로 이동하여 뒤로가기 방지
          window.location.replace(data.installUrl)
          return
        }

        // 설치된 경우: 받은 메타정보로 로컬스토리지 덮어쓰기
        if (data.mallId)   localStorage.setItem('mallId',   data.mallId)
        if (data.userId)   localStorage.setItem('userId',   data.userId)
        if (data.userName) localStorage.setItem('userName', data.userName)

        // (선택) 설치 성공 표시가 쿼리로 붙어 있으면 제거하고 루트로 이동
        navigate('/', { replace: true })
      } catch (err) {
        console.warn('mall 체크 실패', err)

        // 백엔드가 에러로 installUrl을 던진 경우(throw한 객체에 포함시켰다면)
        const installUrl = err?.response?.data?.installUrl || err?.installUrl
        if (installUrl) {
          window.location.replace(installUrl)
          return
        }

        // 그 외: 일단 대시보드로 이동 (사용자에게 에러표시를 별도 처리해도 좋음)
        if (authError) {
          navigate(`/?auth_error=${encodeURIComponent(authError)}`, { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      }
    })()
  }, [search, navigate])

  return null
}
