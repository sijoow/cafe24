// src/pages/Participation.jsx

import React, { useEffect, useState } from 'react';
import { Select, Button, Table, Card, Space, message, Spin, Grid, DatePicker } from 'antd';
import moment from 'moment';
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

  // 날짜 범위 (moment 객체 두 개)
  const [dateRange, setDateRange] = useState([ moment(), moment() ]);

  // 통계 데이터 & 로딩
  const [stats, setStats]     = useState([]);
  const [loading, setLoading] = useState(false);

  // ─── 1) 이벤트 목록 로드 ─────────────────────────────────────
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const evs = (res.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setEvents(evs);
        if (evs[0]) setSelectedEvent(evs[0]._id);
      })
      .catch(() => message.error('이벤트 목록 로드 실패'));
  }, [mallId]);

  // ─── 2) selectedEvent 바뀔 때마다: couponNos, dateRange 세팅 ───────
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setCouponNos([]);
      return;
    }

    // 2-1) 이벤트 상세에서 coupon 배열 뽑기
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

    // 2-2) 해당 이벤트의 생성일자 → dateRange 기본값 세팅
    const ev = events.find(e => e._id === selectedEvent);
    const start = ev
      ? moment(ev.createdAt)
      : moment();
    setDateRange([ start, moment() ]);
  }, [mallId, selectedEvent, events]);

  // ─── 3) 통계 조회 함수 ────────────────────────────────────────
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
    const params = new URLSearchParams({
      coupon_no:  couponNos.join(','),
      start_date: start.format('YYYY-MM-DD'),
      end_date:   end.format('YYYY-MM-DD')
    }).toString();

    api.get(`/api/${mallId}/analytics/${selectedEvent}/coupon-stats?${params}`)
      .then(res => setStats(res.data))
      .catch(() => {
        message.error('쿠폰 다운로드/사용 통계 조회 실패');
        setStats([]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Card title="쿠폰 다운로드 / 사용 통계" bodyStyle={{ padding: isMobile ? 12 : 24 }}>
      {/* ── 필터 영역 ─────────────────────────── */}
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

        {/* 시작일 ~ 종료일: RangePicker */}
        <RangePicker
          style={{ width: isMobile ? '100%' : 280 }}
          value={dateRange}
          defaultPickerValue={[
            dateRange[0],                              // 좌측 달: 시작일자 월
            dateRange[0].clone().add(1, 'month'),      // 우측 달: 시작일자 다음달
          ]}
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

      {/* ── 결과 테이블 ─────────────────────────── */}
      {loading
        ? <Spin tip="로딩 중…" />
        : <Table
            rowKey="couponNo"
            dataSource={stats}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
            columns={[
              { title: '쿠폰 번호', dataIndex: 'couponNo', key: 'couponNo' },
              { title: '쿠폰명',     dataIndex: 'couponName', key: 'couponName' },
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
          />}
    </Card>
  );
}
