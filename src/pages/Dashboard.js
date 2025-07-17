// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import api from '../axios'           // 앞서 만든 axios 인스턴스
import { Card, List, message } from 'antd'

export default function Dashboard() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1) URL 쿼리에서 mall_id 파라미터 꺼내기
    const params = new URLSearchParams(window.location.search)
    const mallId = params.get('mall_id')      // ?mall_id=onimon 처럼 넘어온 값

    if (!mallId) {
      message.error('mall_id 파라미터가 없습니다.')
      setLoading(false)
      return
    }

    // 2) 쿠폰 API 호출: 반드시 /api/${mallId}/coupons
    api.get(`/api/${mallId}/coupons`)
      .then(res => {
        setCoupons(res.data)                  // [{ coupon_no:…, coupon_name:… }, …]
      })
      .catch(err => {
        console.error('쿠폰 조회 에러:', err)
        message.error('쿠폰 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // 3) 렌더링
  return (
    <Card title="쿠폰 목록" loading={loading}>
      <List
        dataSource={coupons}
        renderItem={c => (
          <List.Item>
            {c.coupon_no} · {c.coupon_name}
          </List.Item>
        )}
        locale={{ emptyText: '쿠폰 데이터가 없습니다.' }}
      />
    </Card>
  )
}
