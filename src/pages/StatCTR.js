// src/pages/StatCTR.jsx

import React, { useEffect, useState } from 'react';
import { Card, Select, DatePicker, Button, Table, Space, message } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function StatCTR() {
  // 1) 이벤트 목록
  const [events, setEvents]         = useState([]);
  const [selectedEvent, setEventId] = useState(null);

  // 2) URL 목록
  const [urls, setUrls]             = useState([]);
  const [selectedUrl, setUrl]       = useState(null);

  // 3) 조회 기간 & 결과 (Day.js로 변경)
  const [range, setRange]           = useState([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);

  // 컬럼 정의 (날짜별 통계)
  const columns = [
    { title: '날짜',           dataIndex: 'date',             key: 'date' },
    { title: '조회수',         dataIndex: 'count',            key: 'count',            align: 'right' },
    { title: '방문자수',       dataIndex: 'visit_count',      key: 'visit_count',      align: 'right' },
    { title: '첫방문수',       dataIndex: 'first_visit_count',key: 'first_visit_count',align: 'right' },
  ];

  // ─── 1) 마운트 시 이벤트 목록 로드 ────────────────────────────
  useEffect(() => {
    axios.get('https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app/api/events')
      .then(res => {
        setEvents(
          res.data.map(ev => ({
            label: ev.title || '(제목없음)',
            value: ev._id
          }))
        );
      })
      .catch(err => {
        console.error('▶ 이벤트 목록 로드 실패', err);
        message.error('이벤트 목록 로드 실패');
      });
  }, []);

  // ─── 2) 이벤트 선택 시 URL 목록 로드 ─────────────────────────
  useEffect(() => {
    if (!selectedEvent) {
      setUrls([]);
      setUrl(null);
      return;
    }
    axios.get(
      `https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app/api/analytics/${selectedEvent}/urls`
    )
    .then(res => {
      const paths = res.data
        .filter(u => typeof u === 'string')
        .map(u => {
          try {
            return new URL(u).pathname;
          } catch {
            return u;
          }
        });
      setUrls(paths);
    })
    .catch(err => {
      console.error('▶ URL 목록 로드 실패:', err);
      message.error('URL 목록 로드 실패');
    });
  }, [selectedEvent]);

  // ─── 3) 조회 버튼 클릭 시 ────────────────────────────────────
  const fetchStats = async () => {
    if (!selectedEvent) {
      message.warning('이벤트를 선택하세요');
      return;
    }
    if (!selectedUrl) {
      message.warning('페이지(URL)를 선택하세요');
      return;
    }

    setLoading(true);
    const [start, end] = range;

    // start~end 사이 날짜 배열 생성 (Day.js 사용)
    const days = [];
    let cursor = start;
    while (cursor.isSame(end, 'day') || cursor.isBefore(end, 'day')) {
      days.push(cursor.format('YYYY-MM-DD'));
      cursor = cursor.add(1, 'day');
    }

    try {
      // 날짜별 API 호출 병렬 처리
      const results = await Promise.all(
        days.map(async date => {
          const res = await axios.get(
            'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app/api/pages/view',
            {
              params: {
                start_date: date,
                end_date:   date,
                url:        selectedUrl
              }
            }
          );
          const stats = (res.data.view && res.data.view[0]) || {};
          return {
            key:               date,
            date,
            count:             stats.count || 0,
            visit_count:       stats.visit_count || 0,
            first_visit_count: stats.first_visit_count || 0,
          };
        })
      );

      setData(results);
    } catch (err) {
      console.error('▶ 통계 로드 실패:', err);
      message.error('통계 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="페이지뷰 통계" style={{ maxWidth: 800, margin: 'auto' }}>
      <Space style={{ marginBottom: 16 }}>
        {/* 이벤트 선택 */}
        <Select
          placeholder="이벤트 선택"
          style={{ width: 200 }}
          options={events}
          value={selectedEvent}
          onChange={setEventId}
          allowClear
        />

        {/* URL 선택 */}
        <Select
          placeholder="페이지(URL) 선택"
          style={{ width: 200 }}
          options={urls.map(u => ({ label: u, value: u }))}
          value={selectedUrl}
          onChange={setUrl}
          allowClear
        />

        {/* 기간 선택 */}
        <RangePicker
          value={range}
          format="YYYY-MM-DD"
          onChange={vals => setRange(vals)}
        />

        {/* 조회 버튼 */}
        <Button type="primary" onClick={fetchStats}>조회</Button>
      </Space>

      {/* 결과 테이블 */}
      <Table
        dataSource={data}
        columns={columns}
        rowKey="key"
        loading={loading}
        pagination={false}
        bordered
      />
    </Card>
  );
}

