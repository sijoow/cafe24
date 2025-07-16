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
import axios from '../axios';                // interceptor 적용된 인스턴스
import { useMall } from '../components/MallContext';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import './NormalSection.css';

const { RangePicker } = DatePicker;

export default function Dashboard() {
  const { mallId } = useMall();

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

  // ─── mallId 바뀔 때마다: 이벤트 목록 + 쿠폰 수 불러오기 ─────────────────
  useEffect(() => {
    if (!mallId) return;

    // ▶ 이벤트 목록
    axios.get(`/api/${mallId}/events`)
      .then(res => {
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setEvents(sorted);
        setEventCount(sorted.length);
        if (sorted.length) setSelectedEvent(sorted[0]._id);
      })
      .catch(() => {
        message.error('이벤트 목록을 불러오지 못했습니다.');
      });

    // ▶ 쿠폰 수
    axios.get(`/api/${mallId}/coupons`)
      .then(res => setCouponCount(res.data.length))
      .catch(() => {
        message.error('쿠폰 목록을 불러오지 못했습니다.');
      });
  }, [mallId]);

  // ─── selectedEvent 바뀔 때마다: 최소일 설정 + URL 목록 불러오기 ───────────────
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setUrls([]);
      setSelectedUrl(null);
      setMinDate(null);
      return;
    }

    // (1) 이벤트 생성일을 최소일로 설정
    const ev = events.find(e => e._id === selectedEvent);
    if (ev?.createdAt) {
      const created = dayjs(ev.createdAt);
      setMinDate(created);
      setRange(([start, end]) => [
        start.isBefore(created, 'day') ? created : start,
        end
      ]);
    }

    // (2) URL 목록 조회
    axios.get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
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
  }, [mallId, selectedEvent, events]);

  // ─── 조회 기간 변경 시: 날짜 축 생성 ───────────────────────────────
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

  // ─── 데이터 조회 함수 ─────────────────────────────────────────────
  const fetchData = () => {
    if (!mallId || !selectedEvent || !selectedUrl) return;
    const [start, end] = range.map(d => d.format('YYYY-MM-DD'));
    const params = {
      start_date: `${start}T00:00:00+09:00`,
      end_date:   `${end}T23:59:59.999+09:00`,
      url:        selectedUrl
    };

    const base = `/api/${mallId}/analytics/${selectedEvent}`;
    const visReq   = axios.get(`${base}/visitors-by-date`, { params });
    const clickReq = axios.get(`${base}/clicks-by-date`,     { params });
    const devReq   = axios.get(`${base}/devices-by-date`,    { params });

    Promise.all([visReq, clickReq, devReq])
      .then(([visRes, clickRes, devRes]) => {
        /* …데이터 파싱 로직 동일… */
      })
      .catch(() => {
        message.error('데이터를 불러오지 못했습니다.');
      });
  };

  // ─── fetchData 자동 호출 ─────────────────────────────────────────
  useEffect(fetchData, [mallId, selectedEvent, selectedUrl, range, dates]);

  // ─── 차트 옵션 설정 ─────────────────────────────────────────────
  /* …옵션 설정 동일… */

  return (
    <Space direction="vertical" style={{ width: '100%', padding: 24, gap: 24 }}>
      {/* 컨트롤 */}
      <Card>
        <Space wrap>
          <Select
            placeholder="이벤트 선택"
            options={events.map(e => ({ label: e.title || '(제목없음)', value: e._id }))}
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
        {/* …차트 & KPI 카드 렌더링 동일… */}
      </Row>
    </Space>
  );
}
