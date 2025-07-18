// src/pages/PrdData.jsx

import React, { useEffect, useState } from 'react';
import { Card, Select, Button, Table, Space, message, Grid } from 'antd';
import api from '../axios';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;

export default function PrdData() {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const mallId = localStorage.getItem('mallId');

  // ─── 상태 선언 ───────────────────────────────────────────────
  const [events, setEvents]             = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [minDate, setMinDate]           = useState(null);   // 이벤트 생성일
  const [data, setData]                 = useState([]);
  const [loading, setLoading]           = useState(false);

  // ─── 1) 이벤트 목록 로드 ─────────────────────────────────────
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const evs = (res.data||[])
          .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(evs);
        if (evs.length) {
          const first = evs[0];
          setSelectedEvent(first._id);
          setMinDate(dayjs(first.createdAt));
        }
      })
      .catch(err => {
        console.error('[EVENTS LOAD ERROR]', err);
        message.error('이벤트 목록을 불러오지 못했습니다.');
      });
  }, [mallId]);

  // ─── 2) 상품 클릭 순위 조회 ───────────────────────────────────
  const fetchRanking = async () => {
    if (!selectedEvent) {
      message.warning('이벤트를 선택해주세요.');
      return;
    }
    setLoading(true);
    // 조회 기간: 생성일 → 오늘
    const start = minDate.format('YYYY-MM-DD');
    const end   = dayjs().format('YYYY-MM-DD');

    try {
      const res = await api.get(
        `/api/${mallId}/analytics/${selectedEvent}/product-clicks`,
        {
          params: {
            start_date: `${start}T00:00:00+09:00`,
            end_date:   `${end}T23:59:59.999+09:00`,
          }
        }
      );
      setData(res.data);
    } catch (err) {
      console.error('[PRODUCT CLICKS ERROR]', err);
      message.error('상품 클릭 순위 조회 실패');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── 렌더링 ────────────────────────────────────────────────
  return (
    <Card
      title="상품 클릭 순위 (전체 기간)"
      extra={(
        <Space wrap size={isMobile ? 'small' : 'middle'} style={isMobile ? { width:'100%' } : undefined}>
          {/* 이벤트 선택 */}
          <Select
            placeholder="이벤트 선택"
            options={events.map(e=>({
              label: e.title||'(제목없음)', value: e._id
            }))}
            value={selectedEvent}
            onChange={val => setSelectedEvent(val)}
            style={{ width: isMobile?'100%':200 }}
          />

          {/* 조회 버튼 */}
          <Button
            type="primary"
            loading={loading}
            onClick={fetchRanking}
            block={isMobile}
          >
            조회
          </Button>
        </Space>
      )}
      style={{ width:'100%', maxWidth:1700, margin:'0 auto' }}
      bodyStyle={{ padding: isMobile?12:24 }}
    >
      <Table
        rowKey="productNo"
        loading={loading}
        dataSource={data}
        pagination={false}
        bordered
        scroll={{ x: isMobile?'max-content':undefined }}
        locale={{ emptyText: '데이터가 없습니다.' }}
        columns={[
          { title:'순위',      dataIndex:'_',      key:'rank',
            render: (_,__,i)=> i+1 /* 테이블 index+1 */ },
          { title:'상품번호',  dataIndex:'productNo', key:'productNo' },
          { title:'클릭수',    dataIndex:'clicks',    key:'clicks', align:'right' },
        ]}
      />
    </Card>
  );
}
