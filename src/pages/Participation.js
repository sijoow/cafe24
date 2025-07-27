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
  Grid,
  DatePicker
} from 'antd';
import moment from 'moment';
import api from '../axios';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

export default function Participation() {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const mallId = localStorage.getItem('mallId');

  // 1) 이벤트 리스트
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 2) 해당 이벤트에 매핑된 쿠폰 번호들
  const [couponNos, setCouponNos] = useState([]);

  // 3) 조회 기간 (moment 객체 배열)
  const [dateRange, setDateRange] = useState([ moment(), moment() ]);

  // 4) 통계 데이터 & 로딩 상태
  const [stats, setStats]     = useState([]);
  const [loading, setLoading] = useState(false);

  // ─── (A) 이벤트 목록 불러오기 ─────────────────────────────────
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const evs = (res.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(evs);
        if (evs.length) {
          setSelectedEvent(evs[0]._id);
        }
      })
      .catch(() => message.error('이벤트 목록 로드 실패'));
  }, [mallId]);

  // ─── (B) 게시판 선택 시: 쿠폰 번호 추출 + 날짜 범위 초기화 ──────────
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setCouponNos([]);
      return;
    }

    // (B1) 이벤트 상세에서 coupon 배열 추출
    api.get(`/api/${mallId}/events/${selectedEvent}`)
      .then(res => {
        const ev = res.data;
        const all = [];
        (ev.images || []).forEach(img =>
          (img.regions || []).forEach(r => {
            if (r.coupon) {
              Array.isArray(r.coupon) ? all.push(...r.coupon) : all.push(r.coupon);
            }
          })
        );
        setCouponNos(Array.from(new Set(all)));
      })
      .catch(() => {
        message.error('이벤트 상세 로드 실패');
        setCouponNos([]);
      });

    // (B2) 기본 기간: 이벤트 생성일 → 오늘
    const ev = events.find(e => e._id === selectedEvent);
    const start = ev ? moment(ev.createdAt) : moment();
    setDateRange([ start, moment() ]);
  }, [mallId, selectedEvent, events]);

  // ─── (C) 통계 조회 함수 ────────────────────────────────────────
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
    const [ start, end ] = dateRange;
    const qs = new URLSearchParams({
      coupon_no:  couponNos.join(','),
      start_date: start.format('YYYY-MM-DD'),
      end_date:   end.format('YYYY-MM-DD')
    }).toString();

    api.get(`/api/${mallId}/analytics/${selectedEvent}/coupon-stats?${qs}`)
      .then(res => setStats(res.data))
      .catch(() => {
        message.error('쿠폰 다운로드/주문 통계 조회 실패');
        setStats([]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Card title="쿠폰 다운로드 / 주문 완료 통계"
          bodyStyle={{ padding: isMobile ? 12 : 24 }}>
      {/* ─── 필터 영역 ──────────────────────────────────────── */}
      <Space
        direction={isMobile ? 'vertical' : 'horizontal'}
        size="middle"
        style={{ marginBottom: 16, flexWrap: 'wrap' }}
      >
        {/* 게시판 선택 */}
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

        {/* 기간 선택 */}
        <RangePicker
          style={{ width: isMobile ? '100%' : 280 }}
          value={dateRange}
          onChange={dates => setDateRange(dates)}
          allowClear={false}
        />

        {/* 조회 버튼 */}
        <Button
          type="primary"
          onClick={fetchStats}
          loading={loading}
          block={isMobile}
        >
          조회
        </Button>
      </Space>

      {/* ─── 결과 테이블 ────────────────────────────────────────── */}
      {loading
        ? <Spin tip="로딩 중…" />
        : <Table
            rowKey="couponNo"
            dataSource={stats}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
            columns={[
              { title: '쿠폰 번호',    dataIndex: 'couponNo',     key: 'couponNo' },
              { title: '쿠폰명',       dataIndex: 'couponName',   key: 'couponName' },
              {
                title: '다운로드 수',
                dataIndex: 'downloadCount',
                key: 'downloadCount',
                align: 'right'
              },
              {
                title: '주문 완료 수',
                dataIndex: 'orderCount',
                key: 'orderCount',
                align: 'right'
              }
            ]}
          />}
    </Card>
  );
}
