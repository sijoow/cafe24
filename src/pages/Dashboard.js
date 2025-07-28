// src/pages/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Statistic,
  message,
  Space,
  Button
} from 'antd';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import api from '../axios';
import './NormalSection.css';

const { RangePicker } = DatePicker;

export default function Dashboard() {
  // ─── mallId 결정 ───────────────────────────────────────────
  const [mallId, setMallId] = useState(null);
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const qMallId = params.get('mall_id') || params.get('state') || params.get('mallId');
    if (qMallId) {
      localStorage.setItem('mallId', qMallId);
      setMallId(qMallId);
    } else {
      const stored = localStorage.getItem('mallId');
      if (stored) setMallId(stored);
      else message.error('mall_id 파라미터가 없습니다.');
    }
  }, []);

  // ─── 상태 선언 ───────────────────────────────────────────────
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [urls, setUrls]                   = useState([]);
  const [selectedUrl, setSelectedUrl]     = useState(null);

  const [range, setRange]     = useState([dayjs().subtract(6, 'day'), dayjs()]);
  const [minDate, setMinDate] = useState(null);
  const [dates, setDates]     = useState([]);

  const [newByDate, setNewByDate]       = useState([]);
  const [retByDate, setRetByDate]       = useState([]);
  const [urlByDate, setUrlByDate]       = useState([]);
  const [couponByDate, setCouponByDate] = useState([]);
  const [pcByDate, setPcByDate]         = useState([]);
  const [andByDate, setAndByDate]       = useState([]);
  const [iosByDate, setIosByDate]       = useState([]);

  const [eventCount, setEventCount]   = useState(0);
  const [couponCount, setCouponCount] = useState(0);

  // 상품 클릭 퍼포먼스 전체
  const [prodPerf, setProdPerf] = useState([]);

  // ─── 데이터 조회 함수 ────────────────────────────────────────
  const fetchData = () => {
    if (!mallId || !selectedEvent || !selectedUrl) return;
    const [s, e] = range.map(d => d.format('YYYY-MM-DD'));
    const params = {
      start_date: `${s}T00:00:00+09:00`,
      end_date:   `${e}T23:59:59.999+09:00`,
      url:        selectedUrl
    };

    const visReq   = api.get(`/api/${mallId}/analytics/${selectedEvent}/visitors-by-date`, { params });
    const clickReq = api.get(`/api/${mallId}/analytics/${selectedEvent}/clicks-by-date`,     { params });
    const devReq   = api.get(`/api/${mallId}/analytics/${selectedEvent}/devices-by-date`,    { params });

    Promise.all([visReq, clickReq, devReq])
      .then(([visRes, clkRes, devRes]) => {
        const vis = Array.isArray(visRes.data) ? visRes.data : [];
        const clk = Array.isArray(clkRes.data) ? clkRes.data : [];
        const dev = Array.isArray(devRes.data) ? devRes.data : [];

        // 신규 vs 재방문
        const newMap = new Map(vis.map(o => [o.date, o.newVisitors   || 0]));
        const retMap = new Map(vis.map(o => [o.date, o.returningVisitors || 0]));
        setNewByDate(dates.map(d => newMap.get(d) || 0));
        setRetByDate(dates.map(d => retMap.get(d) || 0));

        // URL vs 쿠폰 클릭
        const urlMap    = new Map(clk.map(o => [o.date, o.product || 0]));
        const couponMap = new Map(clk.map(o => [o.date, o.coupon  || 0]));
        setUrlByDate(    dates.map(d => urlMap.get(d)    || 0));
        setCouponByDate( dates.map(d => couponMap.get(d) || 0));

        // 디바이스별 유입
        const pcMap  = new Map(), andMap = new Map(), iosMap = new Map();
        dev.forEach(o => {
          if (o.device === 'PC')        pcMap.set(o.date, o.count);
          else if (o.device === 'Android') andMap.set(o.date, o.count);
          else if (o.device === 'iOS')      iosMap.set(o.date, o.count);
        });
        setPcByDate(  dates.map(d => pcMap.get(d)  || 0));
        setAndByDate(dates.map(d => andMap.get(d) || 0));
        setIosByDate(dates.map(d => iosMap.get(d) || 0));
      })
      .catch(() => message.error('데이터를 불러오지 못했습니다.'));
  };

  // ─── mallId 변경 시: 이벤트 목록 & 쿠폰 개수 로드 ───────────────
  useEffect(() => {
    if (!mallId) return;

    api.get(`/api/${mallId}/events`)
      .then(res => {
        const evs = (res.data || []).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(evs);
        setEventCount(evs.length);
        if (evs.length) setSelectedEvent(evs[0]._id);
      })
      .catch(() => message.error('이벤트 목록을 불러오지 못했습니다.'));

    api.get(`/api/${mallId}/coupons`)
      .then(res => setCouponCount(res.data.length))
      .catch(() => {});
  }, [mallId]);

  // ─── selectedEvent 변경 시: minDate 설정 + URL 목록 로드 ─────────
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setUrls([]); setSelectedUrl(null); setMinDate(null);
      return;
    }

    // 이벤트 시작일 적용
    const ev = events.find(e => e._id === selectedEvent);
    if (ev?.createdAt) {
      const created = dayjs(ev.createdAt);
      setMinDate(created);
      setRange([created, dayjs()]);
    }

    // URL 목록 로드
    api.get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
      .then(res => {
        const list = res.data || [];
        setUrls(list);
        setSelectedUrl(list[0] || null);
      })
      .catch(() => message.error('URL 목록을 불러오지 못했습니다.'));
  }, [mallId, selectedEvent, events]);

  // ─── selectedUrl 또는 range 변경 시 자동 조회 ─────────────────────
  useEffect(() => {
    fetchData();
  }, [selectedUrl, range]);

  // ─── 날짜 축 생성 ─────────────────────────────────────────────
  useEffect(() => {
    const [start, end] = range;
    const arr = [];
    let curr = start.startOf('day');
    const last = end.startOf('day');
    while (curr.isSameOrBefore(last, 'day')) {
      arr.push(curr.format('YYYY-MM-DD'));
      curr = curr.add(1, 'day');
    }
    setDates(arr);
  }, [range]);

  // ─── 상품 클릭 퍼포먼스 조회 ─────────────────────────────────
  useEffect(() => {
    if (!mallId || !selectedEvent) return;
    api.get(`/api/${mallId}/analytics/${selectedEvent}/product-performance`)
      .then(res => setProdPerf(res.data || []))
      .catch(() => {});
  }, [mallId, selectedEvent]);

  // ─── ECharts 옵션 설정 ───────────────────────────────────────
  const visitorLineOpt = {
    title:   { text: '신규 vs 재방문', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend:  { data: ['신규','재방문'], top: 30 },
    xAxis:   { type: 'category', data: dates },
    yAxis:   { type: 'value' },
    series: [
      { name: '신규',   type: 'line', data: newByDate },
      { name: '재방문', type: 'line', data: retByDate }
    ]
  };

  const clickLineOpt = {
    title:   { text: '클릭 추이', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend:  { data: ['URL 클릭','쿠폰 클릭'], top: 30 },
    xAxis:   { type: 'category', data: dates },
    yAxis:   { type: 'value' },
    series: [
      { name: 'URL 클릭',  type: 'line', data: urlByDate },
      { name: '쿠폰 클릭', type: 'line', data: couponByDate }
    ]
  };

  const deviceLineOpt = {
    title:   { text: '디바이스별 유입', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend:  { data: ['PC','Android','iOS'], top: 30 },
    xAxis:   { type: 'category', data: dates },
    yAxis:   { type: 'value' },
    series: [
      { name: 'PC',      type: 'line', data: pcByDate },
      { name: 'Android', type: 'line', data: andByDate },
      { name: 'iOS',     type: 'line', data: iosByDate }
    ]
  };

  const barColors = ['#5470C6', '#91CC75', '#EE6666', '#FAC858', '#73C0DE'];

  return (
    <Space direction="vertical" style={{ width: '100%', padding: 24, gap: 24 }}>

      {/* 컨트롤 + KPI 섹션 */}
      <Card>
        <Row gutter={16} align="middle">
          <Col>
            <Select
              placeholder="이벤트 선택"
              options={events.map(e => ({ label: e.title||'(제목없음)', value: e._id }))}
              value={selectedEvent}
              onChange={setSelectedEvent}
              style={{ width: 200 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="페이지 선택"
              options={urls.map(u => ({ label: u, value: u }))}
              value={selectedUrl}
              onChange={setSelectedUrl}
              style={{ width: 240 }}
            />
          </Col>
          <Col>
            <RangePicker
              value={range}
              format="YYYY-MM-DD"
              onChange={vals => vals && setRange(vals)}
              disabledDate={d => minDate && d.isBefore(minDate,'day')}
            />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchData}>조회</Button>
          </Col>
          <Col flex="auto" />
          <Col>
            <Statistic
              title="전체 이벤트 수"
              value={eventCount}
              suffix="개"
              valueStyle={{ color: '#1890ff' }}
              style={{ textAlign: 'center' }}
            />
          </Col>
          <Col>
            <Statistic
              title="전체 쿠폰 수"
              value={couponCount}
              suffix="개"
              valueStyle={{ color: '#52c41a' }}
              style={{ marginLeft: 16, textAlign: 'center' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 차트 섹션 */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card bodyStyle={{ paddingTop:'20px', height: 320 }}>
            <ReactECharts option={visitorLineOpt} style={{ height: '100%' }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bodyStyle={{ paddingTop:'20px', height: 320 }}>
            <ReactECharts option={clickLineOpt} style={{ height: '100%' }} />
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card bodyStyle={{ paddingTop:'20px', height: 320 }}>
            <ReactECharts option={deviceLineOpt} style={{ height: '100%' }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bodyStyle={{ paddingTop:'20px', height: 320 }}>
            <ReactECharts
              option={{
                title:   { text: '상품 클릭 Top 5', left: 'center', top: 10 },
                tooltip: { trigger: 'axis' },
                grid:    { left: 60, right: 20, bottom: 60 },
                xAxis:   {
                  type: 'category',
                  data: prodPerf.slice(0, 5).map(o => o.productName),
                  axisLabel: { interval: 0, rotate: 30 }
                },
                yAxis: { type: 'value' },
                series: [
                  {
                    name: '클릭수',
                    type: 'bar',
                    barWidth: '50%',
                    data: prodPerf.slice(0, 5).map((o, idx) => ({
                      value: o.clicks,
                      itemStyle: { color: barColors[idx % barColors.length] }
                    }))
                  }
                ]
              }}
              style={{ height: '100%' }}
            />
          </Card>
        </Col>
      </Row>

    </Space>
  );
}
