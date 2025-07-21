// src/pages/Participation.jsx

import React, { useEffect, useState } from 'react';
import { Select, Button, Table, Card, Space, message, Spin, Grid, DatePicker } from 'antd';
import api from '../axios';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

export default function Participation() {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const mallId = localStorage.getItem('mallId');

  // 1) 이벤트(게시판) 목록
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 이벤트 상세에서 뽑아낸 쿠폰 번호 배열
  const [couponNos, setCouponNos] = useState([]);

  // 날짜 범위 (["YYYY-MM-DD", "YYYY-MM-DD"])
  const [dateRange, setDateRange] = useState([]);

  // 통계 데이터 & 로딩
  const [stats, setStats]     = useState([]);
  const [loading, setLoading] = useState(false);

  // ─── 이벤트 목록 로드 ───────────────────────────────────────────
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const evs = (res.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setEvents(evs);
        setSelectedEvent(evs[0]?._id || null);
      })
      .catch(() => message.error('이벤트 목록 로드 실패'));
  }, [mallId]);

  // ─── 선택된 이벤트 상세에서 couponNos 뽑기 ────────────────────────
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setCouponNos([]);
      return;
    }
    api.get(`/api/${mallId}/events/${selectedEvent}`)
      .then(res => {
        const ev = res.data;
        const allCoupons = [];
        (ev.images || []).forEach(img => {
          (img.regions || []).forEach(r => {
            if (r.coupon) {
              Array.isArray(r.coupon)
                ? allCoupons.push(...r.coupon)
                : allCoupons.push(r.coupon);
            }
          });
        });
        setCouponNos(Array.from(new Set(allCoupons)));
      })
      .catch(() => {
        message.error('이벤트 상세 로드 실패');
        setCouponNos([]);
      });
  }, [mallId, selectedEvent]);

  // ─── 통계 조회 ─────────────────────────────────────────────────
  const fetchStats = () => {
    if (!selectedEvent) {
      return message.warning('게시판을 선택해주세요.');
    }
    if (couponNos.length === 0) {
      return message.warning('해당 게시판에 등록된 쿠폰이 없습니다.');
    }
    if (dateRange.length !== 2) {
      return message.warning('조회할 시작·끝 날짜를 선택해주세요.');
    }

    setLoading(true);
    // build query string
    const params = new URLSearchParams({
      coupon_no: couponNos.join(','),
      start_date: dateRange[0],
      end_date:   dateRange[1]
    }).toString();

    api.get(`/api/${mallId}/analytics/${selectedEvent}/coupon-stats?${params}`)
      .then(res => {
        setStats(res.data);
      })
      .catch(() => {
        message.error('쿠폰 다운로드/사용 통계 조회 실패');
        setStats([]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Card title="쿠폰 다운로드 / 사용 통계" bodyStyle={{ padding: isMobile ? 12 : 24 }}>
      {/* ─── 필터 영역 ─────────────────────────────────────────────── */}
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

        <RangePicker
          style={{ width: isMobile ? '100%' : 280 }}
          onChange={(_, dateStrings) => setDateRange(dateStrings)}
          allowClear={false}
        />

        <Button
          type="primary"
          onClick={fetchStats}
          loading={loading}
          block={isMobile}
        >
          조회
        </Button>
      </Space>

      {/* ─── 결과 테이블 ───────────────────────────────────────────── */}
      {loading
        ? <Spin tip="로딩 중…" />
        : <Table
            rowKey="couponNo"
            dataSource={stats}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
            columns={[
              { title: '쿠폰 번호',  dataIndex: 'couponNo',      key: 'couponNo' },
              { title: '쿠폰명',      dataIndex: 'couponName',    key: 'couponName' },
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
      }
    </Card>
  );
}
