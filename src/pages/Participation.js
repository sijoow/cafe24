// src/pages/Participation.jsx

import React, { useEffect, useState } from 'react';
import {
  Select,
  Button,
  Table,
  Card,
  Space,
  message,
  Spin,
  Grid
} from 'antd';
import moment from 'moment';
import api from '../axios';

const { useBreakpoint } = Grid;

export default function Participation() {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const mallId = localStorage.getItem('mallId');

  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [couponNos, setCouponNos]         = useState([]);
  const [stats, setStats]                 = useState([]);
  const [loading, setLoading]             = useState(false);
  const [eventStart, setEventStart]       = useState(moment());

  // 1) 이벤트 목록 로드
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setEvents(sorted);
        if (sorted[0]) setSelectedEvent(sorted[0]._id);
      })
      .catch(() => message.error('이벤트 목록 로드 실패'));
  }, [mallId]);

  // 2) 이벤트 선택 시
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setCouponNos([]);
      setStats([]);
      return;
    }
    api.get(`/api/${mallId}/events/${selectedEvent}`)
      .then(res => {
        const ev = res.data;
        setEventStart(moment(ev.createdAt));

        // 이미지 영역에서 couponNo만 추출
        const all = [];
        (ev.images || []).forEach(img =>
          (img.regions || []).forEach(r => {
            if (r.coupon) {
              Array.isArray(r.coupon)
                ? all.push(...r.coupon)
                : all.push(r.coupon);
            }
          })
        );
        setCouponNos(Array.from(new Set(all)));
      })
      .catch(() => {
        message.error('이벤트 상세 로드 실패');
        setCouponNos([]);
      });
  }, [mallId, selectedEvent]);

  // 3) couponNos 변경되면 통계 자동 조회
  useEffect(() => {
    if (!selectedEvent || couponNos.length === 0) {
      setStats([]);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      const start_date = eventStart.format('YYYY-MM-DD');
      const end_date   = moment().format('YYYY-MM-DD');

      const params = new URLSearchParams({
        coupon_no: couponNos.join(','),
        start_date,
        end_date
      }).toString();

      try {
        const { data } = await api.get(
          `/api/${mallId}/analytics/${selectedEvent}/coupon-stats?${params}`
        );
        setStats(data);
      } catch {
        message.error('쿠폰 다운로드/사용 통계 조회 실패');
        setStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [mallId, selectedEvent, couponNos, eventStart]);

  return (
    <Card title="쿠폰 다운로드 / 사용 통계" bodyStyle={{ padding: isMobile ? 12 : 24 }}>
      <Space
        direction={isMobile ? 'vertical' : 'horizontal'}
        size="middle"
        style={{ marginBottom: 16, flexWrap: 'wrap' }}
      >
        <Select
          placeholder="게시판 선택"
          options={events.map(e => ({
            label: e.title || '(제목없음)',
            value: e._id
          }))}
          value={selectedEvent}
          onChange={setSelectedEvent}
          style={{ width: isMobile ? '100%' : 240 }}
        />
        <div style={{ lineHeight: '32px' }}>
          기간: {eventStart.format('YYYY-MM-DD')} → {moment().format('YYYY-MM-DD')}
        </div>
      </Space>

      {loading ? (
        <Spin tip="로딩 중…" />
      ) : (
        <Table
          rowKey="couponNo"
          dataSource={stats}
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
          columns={[
            { title: '쿠폰 번호',    dataIndex: 'couponNo',      key: 'couponNo' },
            { title: '쿠폰명',       dataIndex: 'couponName',    key: 'couponName' },
            {
              title: '다운로드 수',
              dataIndex: 'downloadCount',
              key: 'downloadCount',
              align: 'right'
            },
            {
              title: '사용 수',
              dataIndex: 'usedCount',
              key: 'usedCount',
              align: 'right'
            }
          ]}
        />
      )}
    </Card>
  );
}
