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
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import api from '../axios';

dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;
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

  // 1) Load events & init date
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

  // 2) On event change → extract couponNos & reset date
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setCouponNos([]);
      return;
    }
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
        setCouponNos(Array.from(new Set(all)));

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
      });
  }, [mallId, selectedEvent, events]);

  // 3) Fetch stats + individually fetch missing coupon names
  const fetchStats = useCallback(async () => {
    if (!selectedEvent)            return message.warning('게시판을 선택해주세요.');
    if (couponNos.length === 0)    return message.warning('등록된 쿠폰이 없습니다.');
    if (range.length !== 2)        return message.warning('기간을 선택해주세요.');

    setLoading(true);
    try {
      const [ start, end ] = range;
      const qs = new URLSearchParams({
        coupon_no:  couponNos.join(','),
        start_date: start.format('YYYY-MM-DD'),
        end_date:   end.format('YYYY-MM-DD'),
      }).toString();

      // 3‑1) 기본 통계 요청
      const statRes = await api.get(
        `/api/${mallId}/analytics/${selectedEvent}/coupon-stats?${qs}`
      );
      const data = Array.isArray(statRes.data) ? statRes.data : [];

      // 3‑2) 이름이 없는 항목만 개별 조회
      await Promise.all(
        data
          .filter(item => !item.couponName)
          .map(async item => {
            try {
              const { data: arr } = await api.get(
                `/api/${mallId}/coupons`,
                {
                  params: {
                    shop_no:    1,
                    coupon_no:  item.couponNo,
                    fields:     'coupon_no,coupon_name',
                    limit:      1
                  }
                }
              );
              const name = Array.isArray(arr) && arr[0]?.coupon_name
                ? arr[0].coupon_name
                : '(이름없음)';
              item.couponName = name;
            } catch {
              item.couponName = '(이름없음)';
            }
          })
      );

      setStats(data);
    } catch (err) {
      console.error(err);
      message.error('쿠폰 통계 조회 실패');
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [mallId, selectedEvent, couponNos, range]);

  // 4) Table columns
  const columns = [
    { title: '쿠폰 번호',   dataIndex: 'couponNo',       key: 'couponNo' },
    {
      title: '쿠폰명',
      dataIndex: 'couponName',
      key: 'couponName',
      render: name => name || '(이름없음)'
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

  // 5) Totals for summary
  const totals = stats.reduce((acc, cur) => {
    acc.issued += cur.issuedCount        || 0;
    acc.used   += cur.usedCount          || 0;
    acc.unused += cur.unusedCount        || 0;
    acc.autoDel+= cur.autoDeletedCount   || 0;
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
