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
import axios from 'axios';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import './NormalSection.css';
const { RangePicker } = DatePicker;

export default function Dashboard() {
  // 1) 이벤트 & URL
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [urls, setUrls]                   = useState([]);
  const [selectedUrl, setSelectedUrl]     = useState(null);

  // 2) 조회 기간 & 최소일
  const [range, setRange]     = useState([ dayjs().subtract(6, 'day'), dayjs() ]);
  const [minDate, setMinDate] = useState(null);

  // 3) 날짜 축
  const [dates, setDates] = useState([]);

  // 4) 시계열 데이터
  const [newByDate,    setNewByDate]     = useState([]);
  const [retByDate,    setRetByDate]     = useState([]);
  const [urlByDate,    setUrlByDate]     = useState([]);
  const [couponByDate, setCouponByDate]  = useState([]);
  const [pcByDate,     setPcByDate]      = useState([]);
  const [andByDate,    setAndByDate]     = useState([]);
  const [iosByDate,    setIosByDate]     = useState([]);

  // 5) KPI
  const [eventCount,  setEventCount]   = useState(0);
  const [couponCount, setCouponCount]  = useState(0);

  // ─── 마운트 시: 이벤트 목록 + KPI 로드 ─────────────────────────────
  useEffect(() => {
    // 이벤트 목록
    axios.get('/api/events')
      .then(res => {
        const sorted = (res.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(sorted);
        setEventCount(sorted.length);
        if (sorted.length) {
          setSelectedEvent(sorted[0]._id);
          // minDate, range는 아래 selectedEvent effect에서 설정됩니다
        }
      })
      .catch(() => {
        message.error('이벤트 목록을 불러오지 못했습니다.');
      });

    // 쿠폰 수
    axios.get('/api/coupons')
      .then(res => setCouponCount(res.data.length))
      .catch(() => {});
  }, []);

  // ─── selectedEvent 변경 시: 최소일 설정 + URL 목록 로드 ───────────────────
  useEffect(() => {
    if (!selectedEvent) {
      setUrls([]);
      setSelectedUrl(null);
      setMinDate(null);
      return;
    }

    // (1) 해당 이벤트 생성일을 최소일로 설정
    const ev = events.find(e => e._id === selectedEvent);
    if (ev?.createdAt) {
      const created = dayjs(ev.createdAt);
      setMinDate(created);
      setRange(([start, end]) => [
        start.isBefore(created, 'day') ? created : start,
        end
      ]);
    }

    // (2) URL 목록 조회 & 기본 선택
    axios.get(`/api/analytics/${selectedEvent}/urls`)
      .then(res => {
        const list = res.data || [];
        setUrls(list);
        setSelectedUrl(list[0] || null);
      })
      .catch(() => {
        message.error('URL 목록을 불러오지 못했습니다.');
        setUrls([]);
        setSelectedUrl(null);
      });
  }, [selectedEvent, events]);

  // ─── 날짜 축 생성 ───────────────────────────────────────────────
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

  // ─── 데이터 조회 ───────────────────────────────────────────────
  const fetchData = () => {
    if (!selectedEvent || !selectedUrl) return;
    const [start, end] = range.map(d => d.format('YYYY-MM-DD'));
    const params = {
      start_date: `${start}T00:00:00+09:00`,
      end_date:   `${end}T23:59:59.999+09:00`,
      url:        selectedUrl
    };

    const visReq   = axios.get(`/api/analytics/${selectedEvent}/visitors-by-date`, { params });
    const clickReq = axios.get(`/api/analytics/${selectedEvent}/clicks-by-date`,     { params });
    const devReq   = axios.get(`/api/analytics/${selectedEvent}/devices-by-date`,    { params });

    Promise.all([visReq, clickReq, devReq])
      .then(([visRes, clickRes, devRes]) => {
        const vis = Array.isArray(visRes.data) ? visRes.data : [];
        const clk = Array.isArray(clickRes.data) ? clickRes.data : [];
        const dev = Array.isArray(devRes.data) ? devRes.data : [];

        // 신규 / 재방문
        const newMap = new Map(vis.map(o => [o.date, o.newVisitors || 0]));
        const retMap = new Map(vis.map(o => [o.date, o.returningVisitors || 0]));
        setNewByDate(dates.map(d => newMap.get(d) || 0));
        setRetByDate(dates.map(d => retMap.get(d) || 0));

        // URL 클릭 vs 쿠폰 클릭
        const urlMap    = new Map(clk.map(o => [o.date, o.product || 0]));
        const couponMap = new Map(clk.map(o => [o.date, o.coupon  || 0]));
        setUrlByDate(    dates.map(d => urlMap.get(d)    || 0));
        setCouponByDate( dates.map(d => couponMap.get(d) || 0));

        // 디바이스별 (PC / Android / iOS)
        const pcMap  = new Map();
        const andMap = new Map();
        const iosMap = new Map();
        dev.forEach(o => {
          const devName = o.device; // "PC", "Android", "iOS"
          if (devName === 'PC')        pcMap.set(o.date, o.count);
          else if (devName === 'Android') andMap.set(o.date, o.count);
          else if (devName === 'iOS')      iosMap.set(o.date, o.count);
        });
        setPcByDate(  dates.map(d => pcMap.get(d)  || 0));
        setAndByDate( dates.map(d => andMap.get(d) || 0));
        setIosByDate( dates.map(d => iosMap.get(d) || 0));
      })
      .catch(() => {
        message.error('데이터를 불러오지 못했습니다.');
      });
  };

  // ─── fetchData 자동 호출 ───────────────────────────────────
  useEffect(fetchData, [selectedEvent, selectedUrl, range, dates]);

  // ─── 차트 옵션 ───────────────────────────────────────────────
  const visitorLineOpt = {
    title:   { text: '신규 vs 재방문', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend:  { data: ['신규', '재방문'], top: 30 },
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
    legend:  { data: ['URL 클릭', '쿠폰 클릭'], top: 30 },
    xAxis:   { type: 'category', data: dates },
    yAxis:   { type: 'value' },
    series: [
      { name: 'URL 클릭', type: 'line', data: urlByDate },
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

  return (
    <Space direction="vertical" style={{ width: '100%', padding: 24, gap: 24 }}>
      {/* 컨트롤 */}
      <Card>
        <Space wrap>
          <Select
            placeholder="이벤트 선택"
            options={events.map(e => ({
              label: e.title || '(제목없음)',
              value: e._id
            }))}
            value={selectedEvent}
            onChange={setSelectedEvent}
            style={{ width: 200 }}
          />
          <Select
            placeholder="페이지 선택"
            options={urls.map(u => ({ label: u, value: u }))}
            value={selectedUrl}
            onChange={setSelectedUrl}
            style={{ width: 240 }}
          />
          <RangePicker
            value={range}
            format="YYYY-MM-DD"
            onChange={vals => vals && setRange(vals)}
            disabledDate={current =>
              minDate && current.isBefore(minDate, 'day')
            }
          />
          <Button type="primary" onClick={fetchData}>조회</Button>
        </Space>
      </Card>

      {/* 차트 및 KPI */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card>
            <ReactECharts option={visitorLineOpt} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <ReactECharts option={clickLineOpt} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card>
            <ReactECharts option={deviceLineOpt} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Row gutter={16}>
            <Col xs={12}>
              <Card>
                <Statistic title="전체 이벤트 수" value={eventCount} suffix="개" />
              </Card>
            </Col>
            <Col xs={12}>
              <Card>
                <Statistic title="전체 쿠폰 수" value={couponCount} suffix="개" />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Space>
  );
}
