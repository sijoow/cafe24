// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import dayjs from 'dayjs'
import { Card, Row, Col, Select, DatePicker, Button } from 'antd'
import ReactECharts from 'echarts-for-react'
const { RangePicker } = DatePicker
const { Option } = Select

export default function Dashboard() {
  // ────────────────────────────────────────────
  // 1) 상태 선언
  const [mallInfo, setMallInfo]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [dateRange, setDateRange]     = useState([
    dayjs().subtract(6, 'day'),
    dayjs()
  ])
  const [newReturningData, setNewReturningData] = useState([])
  const [clickTrendData, setClickTrendData]     = useState([])

  // ────────────────────────────────────────────
  // 2) 마운트 시 mall 정보 & 차트 데이터 불러오기
  useEffect(() => {
    // (1) URL 에서 mall_id 추출
    const params = new URLSearchParams(window.location.search)
    const mallId = params.get('mall_id')
    console.log('🟢 mall_id:', mallId)

    if (!mallId) {
      setError('mall_id 파라미터가 없습니다.')
      setLoading(false)
      return
    }

    // (2) mall 정보 요청
    axios.get(`/api/${mallId}/mall`)
      .then(res => {
        console.log('✅ /api/:mallId/mall 응답:', res.data)
        setMallInfo(res.data)
      })
      .catch(err => {
        console.error('❌ mall 호출 에러:', err.response?.status, err.response?.data)
        setError(err.response?.data?.error || '앱 설치 정보를 불러올 수 없습니다.')
      })
      .finally(() => {
        setLoading(false)
      })

    // (3) 예시 — 날짜 범위에 따른 차트 데이터 요청
    const [from, to] = dateRange.map(d => d.format('YYYY-MM-DD'))
    axios.get(`/api/${mallId}/stats/pageview?from=${from}&to=${to}`)
      .then(res => {
        console.log('✅ /stats/pageview 응답:', res.data)
        // res.data를 newReturningData 생성 포맷에 맞춰 가공
        setNewReturningData(
          res.data.map(item => [ item.date, item.newUsers, item.returningUsers ])
        )
      })
      .catch(err => console.warn('📉 페이지뷰 차트 에러:', err))
    axios.get(`/api/${mallId}/stats/clicks?from=${from}&to=${to}`)
      .then(res => {
        console.log('✅ /stats/clicks 응답:', res.data)
        setClickTrendData(
          res.data.map(item => [ item.date, item.urlClicks, item.couponClicks ])
        )
      })
      .catch(err => console.warn('📉 클릭 차트 에러:', err))

  }, [dateRange])

  // ────────────────────────────────────────────
  // 3) 로딩 / 에러 처리
  if (loading) {
    return <div className="dashboard-loading">로딩 중…</div>
  }
  if (error) {
    return <div className="dashboard-error">{error}</div>
  }

  // ────────────────────────────────────────────
  // 4) ECharts 옵션 정의 (예시)
  const optionNewReturning = {
    title: { text: '신규 vs 재방문' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['신규', '재방문'] },
    xAxis: {
      type: 'category',
      data: newReturningData.map(d => d[0])
    },
    yAxis: { type: 'value' },
    series: [
      { name: '신규', type: 'line', data: newReturningData.map(d => d[1]) },
      { name: '재방문', type: 'line', data: newReturningData.map(d => d[2]) }
    ]
  }

  const optionClickTrend = {
    title: { text: '클릭 추이' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['URL 클릭', '쿠폰 클릭'] },
    xAxis: {
      type: 'category',
      data: clickTrendData.map(d => d[0])
    },
    yAxis: { type: 'value' },
    series: [
      { name: 'URL 클릭', type: 'line', data: clickTrendData.map(d => d[1]) },
      { name: '쿠폰 클릭', type: 'line', data: clickTrendData.map(d => d[2]) }
    ]
  }

  // ────────────────────────────────────────────
  // 5) 렌더링
  return (
    <div className="dashboard-container">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <RangePicker
            value={dateRange}
            onChange={vals => setDateRange(vals)}
            allowClear={false}
          />
        </Col>
        <Col>
          <Button type="primary" onClick={() => setDateRange([...dateRange])}>
            조회
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 앱 설치 정보 */}
        <Col span={24}>
          <Card title="앱 설치 정보">
            <p><strong>mallId:</strong>   {mallInfo.mallId}</p>
            <p><strong>userId:</strong>   {mallInfo.userId   || '–'}</p>
            <p><strong>userName:</strong> {mallInfo.userName || '–'}</p>
          </Card>
        </Col>

        {/* 신규 vs 재방문 차트 */}
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts
              option={optionNewReturning}
              notMerge={true}
              lazyUpdate={true}
              style={{ height: '300px' }}
            />
          </Card>
        </Col>

        {/* 클릭 추이 차트 */}
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts
              option={optionClickTrend}
              notMerge={true}
              lazyUpdate={true}
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
