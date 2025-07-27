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

  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [couponNos, setCouponNos]         = useState([]);
  const [dateRange, setDateRange]         = useState([ moment(), moment() ]);
  const [stats, setStats]                 = useState([]);
  const [loading, setLoading]             = useState(false);

  // 1) 이벤트 목록 로드
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const evs = (res.data || [])
          .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        setEvents(evs);
        if (evs.length) setSelectedEvent(evs[0]._id);
      })
      .catch(() => message.error('이벤트 목록 로드 실패'));
  }, [mallId]);

  // 2) 이벤트 선택 시: 쿠폰번호 + 기간 세팅
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setCouponNos([]);
      return;
    }
    // 상세에서 regions[].coupon 추출
    api.get(`/api/${mallId}/events/${selectedEvent}`)
      .then(res => {
        const all = [];
        (res.data.images||[]).forEach(img =>
          (img.regions||[]).forEach(r => {
            if (r.coupon) {
              Array.isArray(r.coupon)
                ? all.push(...r.coupon)
                : all.push(r.coupon);
            }
          })
        );
        setCouponNos(Array.from(new Set(all)));
        // 기본 기간: 생성일 → 오늘
        const ev = events.find(e=>e._id===selectedEvent);
        const start = ev ? moment(ev.createdAt) : moment();
        setDateRange([ start, moment() ]);
      })
      .catch(() => {
        message.error('이벤트 상세 로드 실패');
        setCouponNos([]);
      });
  }, [mallId, selectedEvent, events]);

  // 3) 통계 조회
  const fetchStats = () => {
    if (!selectedEvent)      return message.warning('게시판을 선택해주세요.');
    if (couponNos.length===0) return message.warning('등록된 쿠폰이 없습니다.');
    if (dateRange.length!==2) return message.warning('기간을 선택해주세요.');

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
        message.error('쿠폰 통계 조회 실패');
        setStats([]);
      })
      .finally(() => setLoading(false));
  };

  const columns = [
    { title:'쿠폰 번호',        dataIndex:'couponNo',     key:'couponNo' },
    { title:'쿠폰명',           dataIndex:'couponName',   key:'couponName' },
    {
      title:'다운로드 수',
      dataIndex:'downloadCount',
      key:'downloadCount',
      align:'right'
    },
    {
      title:'주문 완료 수',
      dataIndex:'orderCount',
      key:'orderCount',
      align:'right'
    }
  ];

  return (
    <Card title="쿠폰 다운로드 / 주문 완료 통계" bodyStyle={{ padding: isMobile?12:24 }}>
      <Space
        direction={isMobile?'vertical':'horizontal'}
        size="middle"
        wrap
        style={{ marginBottom:16 }}
      >
        <Select
          placeholder="게시판 선택"
          options={events.map(e=>({ label:e.title||'(제목없음)', value:e._id }))}
          value={selectedEvent}
          onChange={setSelectedEvent}
          style={{ width: isMobile?'100%':240 }}
        />
        <RangePicker
          style={{ width: isMobile?'100%':280 }}
          value={dateRange}
          onChange={setDateRange}
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

      {loading
        ? <Spin tip="로딩 중…" />
        : <Table
            columns={columns}
            dataSource={stats}
            rowKey="couponNo"
            pagination={false}
            bordered
            scroll={{ x:'max-content' }}
          />}
    </Card>
  );
}
