// src/pages/StatEventVisitors.jsx

import React, { useEffect, useState } from 'react';
import {
  Card,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  message,
  Grid,
} from 'antd';
import api from '../axios';               // ← 커스텀 axios 인스턴스
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useParams } from 'react-router-dom';
import './NormalSection.css';

dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function StatEventVisitors() {
  // mallId를 URL params에서 받아옵니다.
  const { mallId } = useParams();
  const screens = useBreakpoint();
  const isMobile = screens.sm === false;

  // 상태 선언
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [urls, setUrls]                   = useState([]);
  const [selectedUrl, setSelectedUrl]     = useState(null);

  const [range, setRange]   = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [minDate, setMinDate] = useState(null);

  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(false);

  // 1) mallId가 준비되면 이벤트 목록을 로드
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const opts = (res.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map(ev => ({
            label: ev.title || '(제목없음)',
            value: ev._id,
            createdAt: ev.createdAt,
          }));
        setEvents(opts);
        if (opts.length) {
          const { value, createdAt } = opts[0];
          setSelectedEvent(value);
          const min = dayjs(createdAt);
          setMinDate(min);
          setRange([min, dayjs()]);
        }
      })
      .catch(err => {
        console.error('[EVENTS LOAD ERROR]', err);
        message.error('이벤트 목록 불러오기 실패');
      });
  }, [mallId]);

  // 2) selectedEvent 변경 시 URL 목록 및 날짜 리셋
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setUrls([]);
      setSelectedUrl(null);
      setMinDate(null);
      return;
    }
    api.get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
      .then(res => {
        setUrls(res.data || []);
        if (res.data?.length) {
          setSelectedUrl(res.data[0]);
        }
      })
      .catch(err => {
        console.error('[URLS LOAD ERROR]', err);
        message.error('URL 목록 불러오기 실패');
      });

    // 이벤트 생성일 기준 최소 날짜 재설정
    const ev = events.find(e => e.value === selectedEvent);
    if (ev) {
      const min = dayjs(ev.createdAt);
      setMinDate(min);
      setRange([min, dayjs()]);
    }
  }, [mallId, selectedEvent, events]);

  // 3) 통계 조회 함수
  const fetchStats = async () => {
    if (!mallId || !selectedEvent) {
      return message.warning('이벤트를 선택하세요');
    }
    if (!selectedUrl) {
      return message.warning('URL을 선택하세요');
    }

    setLoading(true);
    const [start, end] = range.map(d => d.format('YYYY-MM-DD'));
    try {
      const res = await api.get(
        `/api/${mallId}/analytics/${selectedEvent}/visitors-by-date`,
        {
          params: {
            start_date: `${start}T00:00:00+09:00`,
            end_date:   `${end}T23:59:59.999+09:00`,
            url:        decodeURIComponent(selectedUrl),
          },
        }
      );

      // 받아온 통계에 빈 날짜 채우기
      const raw = res.data || [];
      const lookup = new Map(raw.map(o => [o.date, o]));
      const days = [];
      let cursor = range[0].startOf('day');
      const lastDay = range[1].startOf('day');
      while (cursor.isSameOrBefore(lastDay, 'day')) {
        days.push(cursor.format('YYYY-MM-DD'));
        cursor = cursor.add(1, 'day');
      }

      const tableData = days.map(date => {
        const o = lookup.get(date) || {};
        return {
          key:              date,
          date,
          totalVisitors:     o.totalVisitors     || 0,
          newVisitors:       o.newVisitors       || 0,
          returningVisitors: o.returningVisitors || 0,
          revisitRate:       o.revisitRate       || '0 %',
        };
      });

      setData(tableData);
    } catch (err) {
      console.error('[STATS LOAD ERROR]', err);
      message.error('통계 로드 실패');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 4) 자동/수동 조회 트리거
  useEffect(() => {
    if (mallId && selectedEvent && selectedUrl) {
      fetchStats();
    }
  }, [mallId, selectedEvent, selectedUrl, range]);

  const columns = [
    { title: '날짜',        dataIndex: 'date',              key: 'date' },
    { title: '총 방문자',   dataIndex: 'totalVisitors',     key: 'totalVisitors',     align: 'right' },
    { title: '신규 방문자', dataIndex: 'newVisitors',       key: 'newVisitors',       align: 'right' },
    { title: '재방문자',    dataIndex: 'returningVisitors', key: 'returningVisitors', align: 'right' },
    { title: '재방문 비율', dataIndex: 'revisitRate',       key: 'revisitRate',       align: 'right' },
  ];

  return (
    <Card
      title="이벤트 방문자 통계 (일별)"
      extra={
        <Space wrap size={isMobile ? 'small' : 'middle'} style={isMobile ? { width: '100%' } : undefined}>
          <Select
            placeholder="이벤트 선택"
            options={events}
            value={selectedEvent}
            onChange={setSelectedEvent}
            allowClear
            style={{ width: isMobile ? '100%' : 200, minWidth: 120 }}
          />
          <Select
            placeholder="URL 선택"
            options={urls.map(u => ({ label: u, value: u }))}
            value={selectedUrl}
            onChange={setSelectedUrl}
            allowClear
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
            />
          )}

          <Button type="primary" loading={loading} onClick={fetchStats} block={isMobile}>
            조회
          </Button>
        </Space>
      }
      style={{ width: '100%', maxWidth: 1700, margin: '0 auto' }}
      bodyStyle={{ padding: isMobile ? 12 : 24 }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: isMobile ? 'max-content' : undefined }}
        locale={{ emptyText: '조회된 데이터가 없습니다.' }}
      />
    </Card>
  );
}
