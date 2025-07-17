// src/components/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Dashboard() {
  const [mallInfo, setMallInfo] = useState(null)
  const [error, setError]     = useState(null)

  useEffect(() => {
    // 1) URLSearchParams 로 mall_id 파라미터 추출
    const params = new URLSearchParams(window.location.search)
    const mallId = params.get('mall_id')
    console.log('🟢 mall_id 파라미터:', mallId)

    if (!mallId) {
      setError('❌ mall_id 파라미터가 없습니다.')
      return
    }

    // 2) API_BASE 설정
    const API_BASE =
      process.env.REACT_APP_API_BASE_URL ||
      'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app'

    const url = `${API_BASE}/api/${mallId}/mall`
    console.log('🟢 호출 URL:', url)

    // 3) axios GET 요청
    axios
      .get(url)
      .then(response => {
        console.log('✅ 응답 데이터:', response.data)
        setMallInfo(response.data)
      })
      .catch(err => {
        console.error('❌ 요청 에러:', err.response?.status, err.response?.data || err.message)
        setError(
          err.response?.data?.error ||
            `알 수 없는 에러: ${err.message}`
        )
      })
  }, [])

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>
  }
  if (!mallInfo) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>앱 설치 정보</h2>
      <p>
        <strong>mallId:</strong> {mallInfo.mallId}
      </p>
      <p>
        <strong>userId:</strong> {mallInfo.userId || '–'}
      </p>
      <p>
        <strong>userName:</strong> {mallInfo.userName || '–'}
      </p>
      {/* 여기에 추가 UI를 넣으세요 */}
    </div>
  )
}
