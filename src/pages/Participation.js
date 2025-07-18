// src/pages/Participation.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../axios';               // ← 커스텀 axios 인스턴스
import {
  Select,
  DatePicker,
  Button,
  Table,
  Spin,
  message,
  Space,
  Card,
  Grid,
} from 'antd';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import './NormalSection.css';

dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function Participation() {
  const { mallId } = useParams();       // URL 에서 mallId 추출
  const screens = useBreakpoint();
  const isMobile = screens.sm === false;

  // ─── 상태 선언 ───────────────────────────────────────────────
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [urls, setUrls]               = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);

  const [range, setRange]     = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [minDate, setMinDate] = useState(null);

  const [stats, setStats]     = useState([]);
  const [loading, setLoading] = useState(false);

  // ─── 1) mallId 가 준비되면 이벤트 목록 로드 ─────────────────────
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setEvents(sorted);
        if (sorted.length) {
          const first = sorted[0];
          const start = dayjs(first.createdAt);
          setSelectedEvent(first._id);
          setMinDate(start);
          setRange([start, dayjs()]);
        }
      })
      .catch(err => {
        console.error('[EVENTS LOAD ERROR]', err);
        message.error('이벤트 목록을 불러오지 못했습니다.');
      });
  }, [mallId]);

  // ─── 2) selectedEvent 바뀔 때 URL 목록 & 날짜 재설정 ─────────────
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setUrls([]);
      setSelectedUrl(null);
      setMinDate(null);
      return;
    }
    api.get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
      .then(res => {
        const list = res.data || [];
        setUrls(list);
        setSelectedUrl(list[0] || null);
      })
      .catch(err => {
        console.error('[URLS LOAD ERROR]', err);
        message.error('URL 목록을 불러오지 못했습니다.');
        setUrls([]);
        setSelectedUrl(null);
      });

    // 이벤트 생성일 기준 최소 일자 갱신
    const ev = events.find(e => e._id === selectedEvent);
    if (ev?.createdAt) {
      const start = dayjs(ev.createdAt);
      setMinDate(start);
      setRange(([prevStart, prevEnd]) => [
        prevStart.isBefore(start, 'day') ? start : prevStart,
        prevEnd,
      ]);
    }
  }, [mallId, selectedEvent, events]);

  // ─── 3) 날짜 배열 만들기 ────────────────────────────────────
  const dates = useMemo(() => {
    const arr = [];
    let cur = range[0].startOf('day'),
        last = range[1].startOf('day');
    while (cur.isSameOrBefore(last, 'day')) {
      arr.push(cur.format('YYYY-MM-DD'));
      cur = cur.add(1, 'day');
    }
    return arr;
  }, [range]);

  // ─── 4) 통계 조회 ───────────────────────────────────────────
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
        {
          params: {
            start_date: `${start}T00:00:00+09:00`,
            end_date:   `${end}T23:59:59.999+09:00`,
            url:        selectedUrl,
          }
        }
      );
      const raw = Array.isArray(data) ? data : [];
      // 누락된 날짜 0으로 채우기
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
    } catch(err) {
      console.error('[STATS LOAD ERROR]', err);
      message.error('통계 조회 실패');
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── 5) 자동/수동 조회 트리거 ───────────────────────────────
  useEffect(() => {
    if (selectedEvent && selectedUrl) {
      fetchStats();
    }
  }, [mallId, selectedEvent, selectedUrl, range]);

  // ─── 6) 테이블 컬럼 정의 ───────────────────────────────────
  const columns = [
    { title: '날짜',     dataIndex: 'date',    key: 'date' },
    { title: 'URL 클릭', dataIndex: 'product', key: 'product', align: 'right' },
    { title: '쿠폰 클릭', dataIndex: 'coupon',  key: 'coupon',  align: 'right' },
  ];

  return (
    <Card
      title="이벤트 참여 클릭 통계"
      style={{ width: '100%', maxWidth: isMobile ? '100%' : 1700, margin: '0 auto' }}
      bodyStyle={{ padding: isMobile ? 12 : 24 }}
      extra={
        <Space wrap size={isMobile ? 'small' : 'middle'} style={{ width: isMobile ? '100%' : undefined }}>
          <Select
            placeholder="이벤트 선택"
            options={events.map(e => ({ label: e.title || '(제목없음)', value: e._id }))}
            value={selectedEvent}
            onChange={setSelectedEvent}
            style={{ width: isMobile ? '100%' : 200, minWidth: 120 }}
          />
          <Select
            placeholder="URL 선택"
            options={urls.map(u => ({ label: u, value: u }))}
            value={selectedUrl}
            onChange={setSelectedUrl}
            disabled={!urls.length}
            style={{ width: isMobile ? '100%' : 240, minWidth: 120 }}
          />

          {isMobile ? (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <DatePicker
                value={range[0]}
                format="YYYY-MM-DD"
                onChange={d => d && setRange([d, range[1]])}
                disabledDate={d => minDate && d.isBefore(minDate, 'day')}
                style={{ width: '100%' }}
                allowClear={false}
              />
              <DatePicker
                value={range[1]}
                format="YYYY-MM-DD"
                onChange={d => d && setRange([range[0], d])}
                disabledDate={d => minDate && d.isBefore(minDate, 'day')}
                style={{ width: '100%' }}
                allowClear={false}
              />
            </Space>
          ) : (
            <RangePicker
              value={range}
              format="YYYY-MM-DD"
              onChange={setRange}
              disabledDate={d => minDate && d.isBefore(minDate, 'day')}
              style={{ width: 280, minWidth: 160 }}
              allowClear={false}
            />
          )}

          <Button type="primary" loading={loading} onClick={fetchStats} block={isMobile}>
            조회
          </Button>
        </Space>
      }
    >
      {loading ? (
        <Spin tip="로딩 중..." style={{ display: 'block', marginTop: 24 }} />
      ) : (
        <Table
          rowKey="key"
          columns={columns}
          dataSource={stats}
          pagination={false}
          bordered
          scroll={{ x: isMobile ? 'max-content' : undefined }}
          locale={{ emptyText: '조회된 데이터가 없습니다.' }}
        />
      )}
    </Card>
  );
}
