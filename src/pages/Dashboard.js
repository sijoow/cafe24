// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import api from '../axios'
import { message, Spin } from 'antd'

export default function Dashboard() {
  const [mallInfo, setMallInfo] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    // 1) URL 쿼리에서 mall_id 꺼내기
    const params  = new URLSearchParams(window.location.search)
    const qMallId = params.get('mall_id') || params.get('state')  // state 도 fallback
    // 2) localStorage 에 없으면, 쿼리값으로 채워주기
    if (qMallId) {
      localStorage.setItem('mallId', qMallId)
    }
    // 3) 저장된 값을 최종 mallId 로 결정
    const mallId = qMallId || localStorage.getItem('mallId')

    if (!mallId) {
      message.error('mall_id 파라미터가 없습니다.')
      setLoading(false)
      return
    }

    console.log('▶ mallId 최종 결정:', mallId)

    // 4) 백엔드에서 진짜 설치 정보 가져오기
    api.get(`/api/${mallId}/mall`)
      .then(res => {
        setMallInfo(res.data)
      })
      .catch(err => {
        console.error('앱 정보 조회 실패', err)
        message.error('앱 설치 정보를 불러올 수 없습니다.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) return <Spin style={{ margin: '100px auto', display: 'block' }} />
  if (!mallInfo) return null

  return (
    <div>
      <h1>앱 설치 정보</h1>
      <p>mallId: {mallInfo.mallId}</p>
      <p>userId: {mallInfo.userId}</p>
      <p>userName: {mallInfo.userName}</p>
      {/* 나머지 대시보드 UI */}
    </div>
  )
}
