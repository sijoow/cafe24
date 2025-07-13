// src/pages/RedirectHandler.jsx
import React, { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function RedirectHandler() {
  const [qs]     = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    // 디버그 로그
    console.log('🔔 Redirect params:', Object.fromEntries(qs.entries()))

    const installed = qs.get('installed')
    const shop      = qs.get('shop')
    const error     = qs.get('error_description')

    if (installed === 'true' && shop) {
      alert(`${shop} 쇼핑몰에 앱 설치가 완료되었습니다!`)
    } else {
      alert(`앱 설치에 실패했습니다:\n${error || 'Unknown error'}`)
    }

    navigate('/', { replace: true })
  }, [qs, navigate])

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>앱 설치 처리 중… 잠시만 기다려 주세요.</p>
    </div>
  )
}
