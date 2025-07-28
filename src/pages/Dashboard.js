// src/pages/Dashboard.jsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Statistic,
  message,
  Space,
  Button,
  Table,
  Typography,
  Spin
} from 'antd';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import api from '../axios';
import './NormalSection.css';

const { RangePicker } = DatePicker;
const { Text } = Typography;

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

  const [prodPerf, setProdPerf] = useState([]);

  // 쿠폰 통계
  const [stats, setStats] = useState([]);
  const [couponTotals, setCouponTotals] = useState({
    issued: 0,
    used: 0,
    unused: 0,
    autoDel: 0
  });

  const [loading, setLoading] = useState(false);

  // ─── 데이터 조회 함수 ────────────────────────────────────────
  const fetchData = useCallback(() => {
    if (!mallId || !selectedEvent || !selectedUrl) return;

    setLoading(true);
    const [s, e] = range.map(d => d.format('YYYY-MM-DD'));
    const params = {
      start_date: `${s}T00:00:00+09:00`,
      end_date:   `${e}T23:59:59.999+09:00`,
      url:        selectedUrl
    };

    // 기존 요청들
    const visReq   = api.get(`/api/${mallId}/analytics/${selectedEvent}/visitors-by-date`, { params });
    const clkReq   = api.get(`/api/${mallId}/analytics/${selectedEvent}/clicks-by-date`,     { params });
    const devReq   = api.get(`/api/${mallId}/analytics/${selectedEvent}/devices-by-date`,    { params });

    // 쿠폰 통계 요청
    const qs = new URLSearchParams({
      coupon_no:  urls.join(','), // 모든 URL이 아닌, 이벤트 단위 couponNos- but reuse urls?
      start_date: s,
      end_date:   e
    }).toString();
    const couponReq = api.get(`/api/${mallId}/analytics/${selectedEvent}/coupon-stats?${qs}`);

    Promise.all([visReq, clkReq, devReq, couponReq])
      .then(([visRes, clkRes, devRes, couponRes]) => {
        // visitors-by-date
        const vis = Array.isArray(visRes.data) ? visRes.data : [];
        const newMap = new Map(vis.map(o => [o.date, o.newVisitors   || 0]));
        const retMap = new Map(vis.map(o => [o.date, o.returningVisitors || 0]));
        setNewByDate(dates.map(d => newMap.get(d) || 0));
        setRetByDate(dates.map(d => retMap.get(d) || 0));

        // clicks-by-date
        const clk = Array.isArray(clkRes.data) ? clkRes.data : [];
        const urlMap    = new Map(clk.map(o => [o.date, o.product || 0]));
        const couponMap = new Map(clk.map(o => [o.date, o.coupon  || 0]));
        setUrlByDate(    dates.map(d => urlMap.get(d)    || 0));
        setCouponByDate( dates.map(d => couponMap.get(d) || 0));

        // devices-by-date
        const dev = Array.isArray(devRes.data) ? devRes.data : [];
        const pcMap  = new Map(), andMap = new Map(), iosMap = new Map();
        dev.forEach(o => {
          if (o.device === 'PC')        pcMap.set(o.date, o.count);
          else if (o.device === 'Android') andMap.set(o.date, o.count);
          else if (o.device === 'iOS')      iosMap.set(o.date, o.count);
        });
        setPcByDate(  dates.map(d => pcMap.get(d)  || 0));
        setAndByDate(dates.map(d => andMap.get(d) || 0));
        setIosByDate(dates.map(d => iosMap.get(d) || 0));

        // coupon-stats
        const cr = Array.isArray(couponRes.data) ? couponRes.data : [];
        setStats(cr);
        // totals
        const tot = cr.reduce((acc, cur) => {
          acc.issued += cur.issuedCount      || 0;
          acc.used   += cur.usedCount        || 0;
          acc.unused += cur.unusedCount      || 0;
          acc.autoDel+= cur.autoDeletedCount || 0;
          return acc;
        }, { issued:0, used:0, unused:0, autoDel:0 });
        setCouponTotals(tot);
      })
      .catch(() => {
        message.error('데이터를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [mallId, selectedEvent, selectedUrl, range, urls, dates]);

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

    const ev = events.find(e => e._id === selectedEvent);
    if (ev?.createdAt) {
      const created = dayjs(ev.createdAt);
      setMinDate(created);
      setRange([created, dayjs()]);
    }

    api.get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
      .then(res => {
        setUrls(res.data || []);
        setSelectedUrl((res.data||[])[0] || null);
      })
      .catch(() => message.error('URL 목록을 불러오지 못했습니다.'));
  }, [mallId, selectedEvent, events]);

  // ─── selectedUrl 또는 range 또는 urls 변경 시 자동 조회 ─────────
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
            />
          </Col>
          <Col>
            <Statistic
              title="전체 쿠폰 수"
              value={couponCount}
              suffix="개"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 1행: 신규 vs 재방문 */}
      <Row gutter={16}>
        <Col xs={24}>
          <Card bodyStyle={{ paddingTop:'20px', height: 320 }}>
            <ReactECharts option={visitorLineOpt} style={{ height: '100%' }} />
          </Card>
        </Col>
      </Row>

      {/* 2행: 디바이스 유입 차트 + 쿠폰 통계 */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card bodyStyle={{ paddingTop:'20px', height: 320 }}>
            <ReactECharts option={deviceLineOpt} style={{ height: '100%' }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title="쿠폰 다운로드 / 주문 완료 통계"
            bodyStyle={{ padding: 16 }}
            loading={loading}
          >
            <Space size="large" style={{ marginBottom: 16 }}>
              <Statistic title="발급된 쿠폰" value={couponTotals.issued} suffix="개" />
              <Statistic title="사용된 쿠폰" value={couponTotals.used} suffix="개" />
              <Statistic title="미사용 쿠폰" value={couponTotals.unused} suffix="개" />
            </Space>
            {loading ? (
              <Spin />
            ) : (
              <Table
                size="small"
                columns={[
                  { title: '쿠폰번호', dataIndex: 'couponNo', key: 'couponNo' },
                  { title: '다운로드', dataIndex: 'issuedCount', key: 'issuedCount', align: 'right' },
                  { title: '사용완료', dataIndex: 'usedCount', key: 'usedCount', align: 'right' }
                ]}
                dataSource={stats}
                rowKey="couponNo"
                pagination={false}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 3행: 상품 클릭 Top 5 */}
      <Row gutter={16}>
        <Col xs={24}>
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
