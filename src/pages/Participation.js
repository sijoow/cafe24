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

  // ── 상태 선언 ────────────────────────────────────────────────
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [couponNos, setCouponNos]         = useState([]);
  const [dateRange, setDateRange]         = useState([moment(), moment()]);
  const [stats, setStats]                 = useState([]);
  const [loading, setLoading]             = useState(false);

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

  // ── 2) 이벤트 선택 시: couponNos 추출 + 일단 기본 dateRange 세팅 ─────
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setCouponNos([]);
      return;
    }

    api.get(`/api/${mallId}/events/${selectedEvent}`)
      .then(res => {
        const ev = res.data;
        // 2-1) 이미지 영역에서 couponNo 모으기
        const allCoupons = [];
        (ev.images || []).forEach(img =>
          (img.regions || []).forEach(r => {
            if (r.coupon) {
              Array.isArray(r.coupon)
                ? allCoupons.push(...r.coupon)
                : allCoupons.push(r.coupon);
            }
          })
        );
        const uniqueCoupons = Array.from(new Set(allCoupons));
        setCouponNos(uniqueCoupons);

        // 2-2) 일단 이벤트 생성일 → 오늘 까지 기본값
        setDateRange([ moment(ev.createdAt), moment() ]);
      })
      .catch(() => {
        message.error('이벤트 상세 로드 실패');
        setCouponNos([]);
      });
  }, [mallId, selectedEvent]);

  // ── 3) couponNos가 세팅되면: 쿠폰 API에서 발급 기간 가져와 dateRange 덮어쓰기 ─
  useEffect(() => {
    if (!mallId || couponNos.length === 0) return;

    api.get(`/api/${mallId}/coupons`)
      .then(res => {
        const allCoupons = res.data || [];
        // coupon_no 필드가 문자열일 수 있으니 String으로 일치시켜 필터
        const matched = allCoupons.filter(c =>
          couponNos.includes(String(c.coupon_no))
        );
        if (!matched.length) return;

        // start_date / end_date 필드 사용
        const startDates = matched
          .map(c => c.start_date || c.coupon_start_date)
          .filter(Boolean)
          .map(d => moment(d));
        const endDates = matched
          .map(c => c.end_date   || c.coupon_end_date)
          .filter(Boolean)
          .map(d => moment(d));

        if (startDates.length && endDates.length) {
          const minStart = moment.min(startDates);
          const maxEnd   = moment.max(endDates);
          setDateRange([minStart, maxEnd]);
        }
      })
      .catch(() => {
        // 쿠폰 정보가 없으면 그냥 기본 dateRange 유지
      });
  }, [mallId, couponNos]);

  // ── 4) 통계 조회 ─────────────────────────────────────────────
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
      end_date:   end.format('YYYY-MM-DD'),
    }).toString();

    api.get(`/api/${mallId}/analytics/${selectedEvent}/coupon-stats?${params}`)
      .then(res => setStats(res.data))
      .catch(() => {
        message.error('쿠폰 다운로드/사용 통계 조회 실패');
        setStats([]);
      })
      .finally(() => setLoading(false));
  };

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

        <RangePicker
          style={{ width: isMobile ? '100%' : 280 }}
          value={dateRange}
          onChange={setDateRange}
          allowClear={false}
          defaultPickerValue={[
            dateRange[0],
            dateRange[0].clone().add(1, 'month'),
          ]}
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
        />
      )}
    </Card>
  );
}
