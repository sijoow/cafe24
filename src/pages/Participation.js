// src/pages/Participation.jsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  Select,
  Button,
  Table,
  Card,
  Space,
  message,
  Spin,
  Grid,
  DatePicker,
  Typography
} from 'antd';
import dayjs from 'dayjs';
import api from '../axios';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function Participation() {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const mallId = localStorage.getItem('mallId');

  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [couponNos, setCouponNos]         = useState([]);
  const [range, setRange]                 = useState([ dayjs().subtract(7, 'day'), dayjs() ]);
  const [minDate, setMinDate]             = useState(null);
  const [stats, setStats]                 = useState([]);
  const [loading, setLoading]             = useState(false);

  // 1) 이벤트 목록 로드 & 초기 날짜 설정
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const evs = (res.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(evs);
        if (evs.length) {
          const first = evs[0];
          setSelectedEvent(first._id);
          const start = first.createdAt
            ? dayjs(first.createdAt)
            : dayjs().subtract(7, 'day');
          setMinDate(start);
          setRange([ start, dayjs() ]);
        }
      })
      .catch(() => message.error('이벤트 목록 로드 실패'));
  }, [mallId]);

  // 2) selectedEvent 변경 시: 쿠폰 목록 + stats 초기화 + 날짜 리셋
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setCouponNos([]);
      setStats([]);                // ← 이전 stats 지우기
      return;
    }
    // API 호출
    api.get(`/api/${mallId}/events/${selectedEvent}`)
      .then(res => {
        const all = [];
        (res.data.images || []).forEach(img =>
          (img.regions || []).forEach(r => {
            if (r.coupon) {
              Array.isArray(r.coupon)
                ? all.push(...r.coupon)
                : all.push(r.coupon);
            }
          })
        );
        const newNos = Array.from(new Set(all));
        setCouponNos(newNos);
        setStats([]);              // ← 쿠폰 변경 시에도 stats 초기화

        // 날짜 리셋
        const ev = events.find(e => e._id === selectedEvent);
        const start = ev?.createdAt
          ? dayjs(ev.createdAt)
          : dayjs().subtract(7, 'day');
        setMinDate(start);
        setRange([ start, dayjs() ]);
      })
      .catch(() => {
        message.error('이벤트 상세 로드 실패');
        setCouponNos([]);
        setStats([]);              // ← 실패 시에도 초기화
      });
  }, [mallId, selectedEvent, events]);

  // 3) 쿠폰 통계 조회
  const fetchStats = useCallback(() => {
    if (!selectedEvent || couponNos.length === 0 || range.length !== 2) {
      setStats([]);               // 조건 미충족 시도 초기화
      return;
    }

    setLoading(true);
    const [ start, end ] = range;
    const qs = new URLSearchParams({
      coupon_no:  couponNos.join(','),
      start_date: start.format('YYYY-MM-DD'),
      end_date:   end.format('YYYY-MM-DD')
    }).toString();

    api.get(`/api/${mallId}/analytics/${selectedEvent}/coupon-stats?${qs}`)
      .then(res => setStats(Array.isArray(res.data) ? res.data : []))
      .catch(() => {
        message.error('쿠폰 통계 조회 실패');
        setStats([]);
      })
      .finally(() => setLoading(false));
  }, [mallId, selectedEvent, couponNos, range]);

  // 4) couponNos 변경 시 자동 호출
  useEffect(() => {
    fetchStats();
  }, [couponNos, fetchStats]);

  // 5) 테이블 컬럼
  const columns = [
    { title: '쿠폰 번호',   dataIndex: 'couponNo',   key: 'couponNo' },
    {
      title: '쿠폰명',
      dataIndex: 'couponName',
      key: 'couponName',
      render: name => name || '기간종료 이벤트'
    },
    {
      title: '다운로드 수',
      dataIndex: 'issuedCount',
      key: 'issuedCount',
      align: 'right',
      render: v => <Text>{v?.toLocaleString() || 0}</Text>
    },
    {
      title: '주문 완료 수',
      dataIndex: 'usedCount',
      key: 'usedCount',
      align: 'right',
      render: v => <Text>{v?.toLocaleString() || 0}</Text>
    }
  ];

  // 6) 합계 계산
  const totals = stats.reduce((acc, cur) => {
    acc.issued += cur.issuedCount      || 0;
    acc.used   += cur.usedCount        || 0;
    acc.unused += cur.unusedCount      || 0;
    acc.autoDel+= cur.autoDeletedCount || 0;
    return acc;
  }, { issued: 0, used: 0, unused: 0, autoDel: 0 });

  return (
    <Card title="쿠폰 다운로드 / 주문 완료 통계" bodyStyle={{ padding: isMobile ? 12 : 24 }}>
      <Space
        direction={isMobile ? 'vertical' : 'horizontal'}
        size="middle"
        wrap
        style={{ marginBottom: 16 }}
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
          allowClear
        />

        {isMobile ? (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <DatePicker
              value={range[0]}
              onChange={d => d && setRange([d, range[1]])}
              disabledDate={d =>
                (minDate && d.isBefore(minDate, 'day')) ||
                d.isAfter(dayjs(), 'day')
              }
              style={{ width: '100%' }}
            />
            <DatePicker
              value={range[1]}
              onChange={d => d && setRange([range[0], d])}
              disabledDate={d =>
                (minDate && d.isBefore(minDate, 'day')) ||
                d.isAfter(dayjs(), 'day')
              }
              style={{ width: '100%' }}
            />
          </Space>
        ) : (
          <RangePicker
            value={range}
            onChange={dates => dates?.length === 2 && setRange(dates)}
            disabledDate={d =>
              (minDate && d.isBefore(minDate, 'day')) ||
              d.isAfter(dayjs(), 'day')
            }
            style={{ width: 280 }}
            format="YYYY-MM-DD"
            separator=" → "
            allowClear={false}
          />
        )}

        <Button
          type="primary"
          onClick={fetchStats}
          loading={loading}
          block={isMobile}
        >
          조회
        </Button>
      </Space>

      {loading ? (
        <Spin tip="로딩 중…" />
      ) : (
        <>
          {stats.length > 0 && (
            <Text strong style={{ display: 'block', marginBottom: 12 }}>
              발급 쿠폰수: {totals.issued.toLocaleString()}개&nbsp;
              (사용 쿠폰수: {totals.used.toLocaleString()}개 /
              미사용 쿠폰수: {totals.unused.toLocaleString()}개 /
              자동삭제 수: {totals.autoDel.toLocaleString()}개)
            </Text>
          )}

          <Table
            columns={columns}
            dataSource={stats}
            rowKey="couponNo"
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
          />
        </>
      )}
    </Card>
  );
}
