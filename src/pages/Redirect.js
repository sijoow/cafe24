// src/pages/Redirect.jsx
import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../axios'

export default function Redirect() {
  const navigate = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(search)
        // cafe24에서 오는 쿼리들: mall_id 또는 state(설치시 state로 mallId 보낸 경우)
        const mallId = params.get('mall_id') || params.get('state')
        if (!mallId) {
          console.error('mall_id가 없습니다')
          return navigate('/', { replace: true })
        }

        // (1) 우선 localStorage에 기록 (프론트에서 바로 참조 가능)
        localStorage.setItem('mallId', mallId)

        // (2) 백엔드에 설치 상태 조회
        const resp = await axios.get(`/api/${mallId}/mall`)
        const data = resp.data

        if (!data) {
          // 안전망: 응답이 없으면 대시보드로
          return navigate('/', { replace: true })
        }

        if (data.installed === false && data.installUrl) {
          // 설치되어 있지 않음 -> 카페24 설치(권한요청) 페이지로 이동
          // 새 창이 아니라 현재 창에서 진행해야 카페24 로그인/설치 플로우가 정상 동작합니다.
          window.location.href = data.installUrl
          return
        }

        // 설치되어 있다면, 백엔드가 알려준 값(있다면)으로 localStorage 갱신
        if (data.installed === true) {
          if (data.mallId)   localStorage.setItem('mallId',   data.mallId)
          if (data.userId)   localStorage.setItem('userId',   data.userId)
          if (data.userName) localStorage.setItem('userName', data.userName)
        }

        // 완료 후 대시보드로 리다이렉트
        navigate('/', { replace: true })
      } catch (err) {
        console.warn('Redirect 처리 중 오류', err)
        // fallback: 대시보드로
        navigate('/', { replace: true })
      }
    })()
  }, [search, navigate])

  return null
}
