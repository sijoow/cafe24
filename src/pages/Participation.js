// src/pages/Participation.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Select, DatePicker, Button, Table, Spin, message, Space, Card, Grid } from 'antd';
import api from '../axios';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import './NormalSection.css';

dayjs.extend(isSameOrBefore);
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function Participation() {
  const screens = useBreakpoint();
  const isMobile = screens.sm === false;

  // 0) mallId 설정
  const [mallId, setMallId] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('mall_id') || params.get('state') || params.get('mallId');
    if (q) {
      localStorage.setItem('mallId', q);
      setMallId(q);
    } else {
      const stored = localStorage.getItem('mallId');
      if (stored) setMallId(stored);
      else message.error('mall_id 파라미터가 없습니다.');
    }
  }, []);

  // 1) 이벤트 목록
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const sorted = (res.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(sorted);
        setSelectedEvent(sorted[0]?._id || null);
      })
      .catch(err => {
        console.error('EVENTS LOAD ERROR', err);
        message.error('이벤트 목록 로드 실패');
      });
  }, [mallId]);

  // 2) URL 목록 & 날짜 초기화
  const [urls, setUrls]               = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [range, setRange]             = useState([dayjs().subtract(7,'day'), dayjs()]);
  const [minDate, setMinDate]         = useState(null);

  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setUrls([]); setSelectedUrl(null); setMinDate(null);
      return;
    }
    api.get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
      .then(res => {
        setUrls(res.data || []);
        setSelectedUrl(res.data?.[0] || null);
      })
      .catch(err => {
        console.error('URLS LOAD ERROR', err);
        message.error('URL 목록 로드 실패');
        setUrls([]); setSelectedUrl(null);
      });
    const ev = events.find(e => e._id === selectedEvent);
    if (ev?.createdAt) {
      const start = dayjs(ev.createdAt);
      setMinDate(start);
      setRange([start, dayjs()]);
    }
  }, [mallId, selectedEvent, events]);

  // 3) 날짜 배열
  const dates = useMemo(() => {
    const arr = [];
    if (!range[0] || !range[1]) return arr;
    let cur = range[0].startOf('day'), last = range[1].startOf('day');
    while (cur.isSameOrBefore(last,'day')) {
      arr.push(cur.format('YYYY-MM-DD'));
      cur = cur.add(1,'day');
    }
    return arr;
  }, [range]);

  // 4) 클릭 통계 조회
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!mallId || !selectedEvent || !selectedUrl) {
      message.warning('이벤트와 URL을 모두 선택해주세요.');
      return;
    }
    setLoading(true);
    const [start, end] = range.map(d => d.format('YYYY-MM-DD'));
    try {
      const { data } = await api.get(
        `/api/${mallId}/analytics/${selectedEvent}/clicks-by-date`,
        { params: {
            start_date: `${start}T00:00:00+09:00`,
            end_date:   `${end}T23:59:59.999+09:00`,
            url:        selectedUrl,
          }}
      );
      const raw = Array.isArray(data) ? data : [];
      const filled = dates.map(d => {
        const r = raw.find(x => x.date === d) || {};
        return {
          key:    d,
          date:   d,
          product: r.product || 0,
          coupon:  r.coupon  || 0,
        };
      });
      setStats(filled);
    } catch (err) {
      console.error('STATS LOAD ERROR', err);
      message.error('통계 조회 실패');
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  // 5) 자동/수동 조회
  useEffect(() => {
    if (selectedEvent && selectedUrl) fetchStats();
  }, [mallId, selectedEvent, selectedUrl, range]);

  // 6) 테이블
  const columns = [
    { title: '날짜',     dataIndex: 'date',    key: 'date' },
    { title: 'URL 클릭', dataIndex: 'product', key: 'product', align:'right' },
    { title: '쿠폰 클릭', dataIndex: 'coupon',  key: 'coupon',  align:'right' },
  ];

  return (
    <Card
      title="이벤트 참여 클릭 통계"
      extra={
        <Space wrap size={isMobile?'small':'middle'} style={isMobile?{width:'100%'}:undefined}>
          <Select
            placeholder="이벤트 선택"
            options={events.map(e=>({ label:e.title||'(제목없음)', value:e._id }))}
            value={selectedEvent}
            onChange={setSelectedEvent}
            style={{ width: isMobile?'100%':200 }}
          />
          <Select
            placeholder="URL 선택"
            options={urls.map(u=>({ label:u, value:u }))}
            value={selectedUrl}
            onChange={setSelectedUrl}
            disabled={!urls.length}
            style={{ width: isMobile?'100%':240 }}
          />
          {isMobile
            ? (
              <Space direction="vertical" size="small" style={{width:'100%'}}>
                <DatePicker
                  value={range[0]}
                  onChange={d=>d&&setRange([d,range[1]])}
                  disabledDate={d=>minDate&&d.isBefore(minDate,'day')}
                  style={{width:'100%'}}
                  allowClear={false}
                />
                <DatePicker
                  value={range[1]}
                  onChange={d=>d&&setRange([range[0],d])}
                  disabledDate={d=>minDate&&d.isBefore(minDate,'day')}
                  style={{width:'100%'}}
                  allowClear={false}
                />
              </Space>
            ) : (
              <RangePicker
                value={range}
                onChange={setRange}
                disabledDate={d=>minDate&&d.isBefore(minDate,'day')}
                style={{width:280}}
                allowClear={false}
              />
            )
          }
          <Button type="primary" loading={loading} onClick={fetchStats} block={isMobile}>
            조회
          </Button>
        </Space>
      }
      style={{ width:'100%', maxWidth:1700, margin:'0 auto' }}
      bodyStyle={{ padding: isMobile?12:24 }}
    >
      {loading
        ? <Spin tip="로딩 중..." style={{display:'block',marginTop:24}}/>
        : <Table
            columns={columns}
            dataSource={stats}
            pagination={false}
            bordered
            rowKey="key"
            scroll={{ x: isMobile?'max-content':undefined }}
          />
      }
    </Card>
  );
}
