// src/pages/Participation.jsx

import React, { useEffect, useState } from 'react';
import {
  Select,
  Table,
  Card,
  Space,
  Button,
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

  // ── 상태 선언 ────────────────────────────────────────────────
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [couponNos, setCouponNos]         = useState([]);
  const [stats, setStats]                 = useState([]);
  const [loading, setLoading]             = useState(false);
  const [eventStart, setEventStart]       = useState(moment());

  // ── 1) 이벤트 목록 로드 ─────────────────────────────────────
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

  // ── 2) 이벤트 선택 시: couponNos 추출 + eventStart 세팅 ─────
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setCouponNos([]);
      setStats([]);
      return;
    }

    api.get(`/api/${mallId}/events/${selectedEvent}`)
      .then(res => {
        const ev = res.data;

        // 이벤트 생성일을 기간 시작일로 저장
        setEventStart(moment(ev.createdAt));

        // 이미지 영역에서 couponNo 추출
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

  // ── 3) couponNos 변경 시: 통계 자동 조회 ─────────────────────
  useEffect(() => {
    if (!selectedEvent || couponNos.length === 0) {
      setStats([]);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);

      // coupon_no 파라미터만 전송
      const params = new URLSearchParams({
        coupon_no: couponNos.join(',')
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
  }, [mallId, selectedEvent, couponNos]);

  // ── 렌더링 ─────────────────────────────────────────────────
  return (
    <Card title="쿠폰 다운로드 / 사용 통계" bodyStyle={{ padding: isMobile ? 12 : 24 }}>
      {/* 필터 영역 */}
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

        <Button
          onClick={() => {
            // 수동 새로고침
            setStats([]);
            // couponNos가 바뀌면 effect가 다시 실행됩니다
          }}
        >
          새로 고침
        </Button>
      </Space>

      {/* 결과 테이블 */}
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
            { title: '쿠폰 번호', dataIndex: 'couponNo', key: 'couponNo' },
            { title: '쿠폰명',    dataIndex: 'couponName', key: 'couponName' },
            {
              title: '사용 쿠폰',
              dataIndex: 'usedCount',
              key: 'usedCount',
              align: 'right'
            },
            {
              title: '미사용 쿠폰',
              dataIndex: 'unusedCount',
              key: 'unusedCount',
              align: 'right'
            }
          ]}
        />
      )}
    </Card>
  );
}
