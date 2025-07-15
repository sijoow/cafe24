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
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useParams } from 'react-router-dom';
import './NormalSection.css';

dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function StatEventVisitors() {
  const { mallId } = useParams();
  const screens = useBreakpoint();
  const isMobile = screens.sm === false;

  // 1) 상태 선언
  const [events, setEvents]             = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [urls, setUrls]                 = useState([]);
  const [selectedUrl, setSelectedUrl]   = useState(null);
  const [range, setRange]               = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [minDate, setMinDate]           = useState(null);
  const [data, setData]                 = useState([]);
  const [loading, setLoading]           = useState(false);

  // 2) 이벤트 목록 로드
  useEffect(() => {
    axios
      .get(`/api/${mallId}/events`)
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
      .catch(() => message.error('이벤트 목록 불러오기 실패'));
  }, [mallId]);

  // 3) URL 목록 및 기간 초기화
  useEffect(() => {
    if (!selectedEvent) {
      setUrls([]);
      setSelectedUrl(null);
      setMinDate(null);
      return;
    }

    // (1) URL 목록
    axios
      .get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
      .then(res => {
        const list = res.data || [];
        setUrls(list);
        if (list.length) setSelectedUrl(list[0]);
      })
      .catch(() => message.error('URL 목록 불러오기 실패'));

    // (2) 해당 이벤트 생성일로 최소일 재설정
    const ev = events.find(e => e.value === selectedEvent);
    if (ev && ev.createdAt) {
      const min = dayjs(ev.createdAt);
      setMinDate(min);
      setRange([min, dayjs()]);
    }
  }, [mallId, selectedEvent, events]);

  // 4) 통계 조회 함수
  const fetchStats = async () => {
    if (!selectedEvent) return message.warning('이벤트를 선택하세요');
    if (!selectedUrl)   return message.warning('URL을 선택하세요');

    setLoading(true);
    const [start, end] = range.map(d => d.format('YYYY-MM-DD'));
    try {
      const res = await axios.get(
        `/api/${mallId}/analytics/${selectedEvent}/visitors-by-date`,
        {
          params: {
            start_date: `${start}T00:00:00+09:00`,
            end_date:   `${end}T23:59:59.999+09:00`,
            url:        decodeURIComponent(selectedUrl),
          },
        }
      );

      // API 결과 → 날짜 순으로 100% 채운 테이블 데이터
      const apiList = (res.data || []).map(item => ({
        date:              item.date,
        totalVisitors:     item.totalVisitors || 0,
        newVisitors:       item.newVisitors || 0,
        returningVisitors: item.returningVisitors || 0,
        revisitRate:       item.revisitRate || '0 %',
      }));

      // 전체 날짜 축 생성
      const days = [];
      let cursor = range[0].startOf('day');
      const last = range[1].startOf('day');
      while (cursor.isSameOrBefore(last, 'day')) {
        days.push(cursor.format('YYYY-MM-DD'));
        cursor = cursor.add(1, 'day');
      }

      const lookup = new Map(apiList.map(o => [o.date, o]));
      const tableData = days.map(date => {
        const row = lookup.get(date) || {
          date,
          totalVisitors: 0,
          newVisitors: 0,
          returningVisitors: 0,
          revisitRate: '0 %',
        };
        return { key: date, ...row };
      });

      setData(tableData);
    } catch (err) {
      console.error(err);
      message.error('통계 로드 실패');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 5) 자동 조회 트리거
  useEffect(() => {
    if (selectedEvent && selectedUrl) {
      fetchStats();
    }
  }, [selectedEvent, selectedUrl, range]);

  // 6) 테이블 컬럼 정의
  const columns = [
    { title: '날짜', dataIndex: 'date', key: 'date' },
    {
      title: '총 방문자',
      dataIndex: 'totalVisitors',
      key: 'totalVisitors',
      align: 'right',
    },
    {
      title: '신규 방문자',
      dataIndex: 'newVisitors',
      key: 'newVisitors',
      align: 'right',
    },
    {
      title: '재방문자',
      dataIndex: 'returningVisitors',
      key: 'returningVisitors',
      align: 'right',
    },
    {
      title: '재방문 비율',
      dataIndex: 'revisitRate',
      key: 'revisitRate',
      align: 'right',
    },
  ];

  return (
    <Card
      title="이벤트 방문자 통계 (일별)"
      extra={
        <Space
          wrap
          size={isMobile ? 'small' : 'middle'}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          <Select
            placeholder="이벤트 선택"
            options={events}
            value={selectedEvent}
            onChange={setSelectedEvent}
            allowClear
            style={{
              width: isMobile ? '100%' : 200,
              minWidth: 120,
            }}
          />
          <Select
            placeholder="URL 선택"
            options={urls.map(u => ({ label: u, value: u }))}
            value={selectedUrl}
            onChange={setSelectedUrl}
            allowClear
            style={{
              width: isMobile ? '100%' : 240,
              minWidth: 120,
            }}
          />

          {isMobile ? (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <DatePicker
                value={range[0]}
                format="YYYY-MM-DD"
                onChange={date => date && setRange([date, range[1]])}
                disabledDate={d => minDate && d.isBefore(minDate, 'day')}
                style={{ width: '100%' }}
                placeholder="시작일"
                allowClear={false}
              />
              <DatePicker
                value={range[1]}
                format="YYYY-MM-DD"
                onChange={date => date && setRange([range[0], date])}
                disabledDate={d => minDate && d.isBefore(minDate, 'day')}
                style={{ width: '100%' }}
                placeholder="종료일"
                allowClear={false}
              />
            </Space>
          ) : (
            <RangePicker
              value={range}
              format="YYYY-MM-DD"
              onChange={setRange}
              disabledDate={d => minDate && d.isBefore(minDate, 'day')}
              style={{
                width: 280,
                minWidth: 160,
              }}
            />
          )}

          <Button
            type="primary"
            loading={loading}
            onClick={fetchStats}
            block={isMobile}
          >
            조회
          </Button>
        </Space>
      }
      style={{
        width: '100%',
        maxWidth: 1700,
        margin: '0 auto',
      }}
      bodyStyle={{
        padding: isMobile ? 12 : 24,
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        locale={{ emptyText: '조회된 데이터가 없습니다.' }}
        bordered
        scroll={{ x: isMobile ? 'max-content' : undefined }}
      />
    </Card>
  );
}
