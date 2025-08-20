// src/pages/Redirect.jsx
import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../axios'

export default function Redirect() {
  const navigate = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(search)
      const mallId = params.get('mall_id') || params.get('state')
      const installedFlag = params.get('installed')
      const authError = params.get('auth_error')

      if (!mallId) {
        console.error('mall_id가 없습니다')
        return navigate('/', { replace: true })
      }

      // (guard) 반복 리다이렉트 방지: 마지막 설치 시도 타임스탬프
      const attemptKey = `install_attempt_${mallId}`
      const lastAttempt = sessionStorage.getItem(attemptKey)
      const now = Date.now()
      const ATTEMPT_WINDOW = 60 * 1000 // 60초 동안 재시도 방지

      // (1) installed=1 파라가 있는 경우: 이미 서버에서 토큰 저장 성공으로 판단
      if (installedFlag === '1') {
        localStorage.setItem('mallId', mallId)
        // optional: 추가 메타를 /api/:mallId/mall 로부터 덮어쓰기할 수 있음 (비동기)
        try {
          const { data } = await api.get(`/api/${mallId}/mall`)
          if (data && data.installed) {
            if (data.mallId)   localStorage.setItem('mallId', data.mallId)
            if (data.userId)   localStorage.setItem('userId', data.userId)
            if (data.userName) localStorage.setItem('userName', data.userName)
          }
        } catch (e) {
          console.warn('installed=1 이나 /api/mall 호출 실패', e)
        }
        return navigate('/', { replace: true })
      }

      // (2) session guard: 만약 최근에 설치 시도를 했고 아직도 같은 installUrl 흐름이면 루프 방지
      if (lastAttempt && now - Number(lastAttempt) < ATTEMPT_WINDOW) {
        console.warn('최근에 설치 시도를 했습니다 — 루프 방지로 대시보드로 이동')
        return navigate('/', { replace: true })
      }

      // (3) 기본: 확인 API 호출
      try {
        const { data } = await api.get(`/api/${mallId}/mall`)
        if (!data) throw new Error('no data')

        if (data.installed === false) {
          const installUrl = data.installUrl
          if (installUrl) {
            // 세션에 설치시도 시간 기록 -> 루프 방지
            sessionStorage.setItem(attemptKey, String(now))
            window.location.replace(installUrl)
            return
          } else {
            console.error('installUrl 없음')
            return navigate('/', { replace: true })
          }
        }

        // installed === true
        if (data.mallId)   localStorage.setItem('mallId',   data.mallId)
        if (data.userId)   localStorage.setItem('userId',   data.userId)
        if (data.userName) localStorage.setItem('userName', data.userName)

        return navigate('/', { replace: true })
      } catch (err) {
        console.warn('mall 체크 실패', err)

        // 서버가 예외로 installUrl 을 던졌을 수도 있음 (err.installUrl)
        const installUrl = err?.response?.data?.installUrl || err?.installUrl
        if (installUrl) {
          sessionStorage.setItem(attemptKey, String(now))
          window.location.replace(installUrl)
          return
        }

        // 그 외: 에러 표시 후 대시보드로 복귀
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
