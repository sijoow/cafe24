import React, { useEffect, useState } from 'react'
import api from '../axios'
import { Card, List, message } from 'antd'

export default function Coupons() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1) 어디선가 저장된 mallId 읽기
    const mallId = localStorage.getItem('mallId')
    console.log('[Coupons] mallId=', mallId)

    if (!mallId) {
      message.error('매장 아이디가 없습니다.')
      setLoading(false)
      return
    }

    // 2) mallId를 경로에 포함시켜 호출
    api.get(`/api/${mallId}/coupons`)
      .then(res => setList(res.data))
      .catch(err => {
        console.error('쿠폰 조회 에러:', err.response?.data || err.message)
        message.error('쿠폰을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card title="쿠폰 목록" loading={loading}>
      <List
        dataSource={list}
        renderItem={c => <List.Item>{c.coupon_name}</List.Item>}
        locale={{ emptyText: '쿠폰이 없습니다.' }}
      />
    </Card>
  )
}
