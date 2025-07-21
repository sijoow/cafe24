// src/pages/Participation.jsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  Select,
  DatePicker,
  Button,
  Table,
  Spin,
  message,
  Space,
  Card,
  Grid,
  Tabs
} from 'antd';
import api from '../axios';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import './NormalSection.css';

dayjs.extend(isSameOrBefore);
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;
const { TabPane } = Tabs;

export default function Participation() {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  // ─── mallId ──────────────────────────────────────────────
  const [mallId, setMallId] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('mall_id') || params.get('state') || params.get('mallId');
    if (q) {
      localStorage.setItem('mallId', q);
      setMallId(q);
    } else {
      const stored = localStorage.getItem('mallId');
      if (stored) setMallId(stored);
      else message.error('mall_id 파라미터가 없습니다.');
    }
  }, []);

  // ─── 이벤트(게시판) 목록 ─────────────────────────────────
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const sorted = (res.data || []).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        setEvents(sorted);
        setSelectedEvent(sorted[0]?._id || null);
      })
      .catch(() => message.error('이벤트 목록 로드 실패'));
  }, [mallId]);

  // ─── URL / 쿠폰 선택용 상태 ────────────────────────────────
  const [urls, setUrls]                   = useState([]);
  const [selectedUrls, setSelectedUrls]   = useState([]);
  const [coupons, setCoupons]             = useState([]);
  const [selectedCoupons, setSelectedCoupons] = useState([]);

  // ─── 날짜 범위 ────────────────────────────────────────────
  const [range,    setRange]    = useState([dayjs().subtract(7,'day'), dayjs()]);
  const [minDate,  setMinDate]  = useState(null);

  // ─── 로딩 & 결과 데이터 ───────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [stats,   setStats]   = useState([]);

  // ─── selectedEvent 바뀌면 URL·쿠폰 리스트 로드 ─────────────
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setUrls([]); setSelectedUrls([]);
      setCoupons([]); setSelectedCoupons([]);
      setMinDate(null);
      return;
    }

    // 1) URL 목록
    api.get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
      .then(res => {
        setUrls(res.data);
        setSelectedUrls(res.data);
      })
      .catch(() => {
        message.error('URL 목록 로드 실패');
        setUrls([]); setSelectedUrls([]);
      });

    // 2) 쿠폰 목록 (클릭된 distinct 쿠폰번호 → 전체 쿠폰 API에서 이름 매핑)
    api.get(`/api/${mallId}/analytics/${selectedEvent}/coupons-distinct`)
      .then(async res => {
        const nos = res.data || [];
        if (!nos.length) {
          setCoupons([]); setSelectedCoupons([]);
          return;
        }
        const { data: allCoupons } = await api.get(`/api/${mallId}/coupons`);
        const list = allCoupons
          .filter(c => nos.includes(c.coupon_no))
          .map(c => ({ label: `${c.coupon_name} [${c.coupon_no}]`, value: c.coupon_no }));
        setCoupons(list);
        setSelectedCoupons(list.map(x => x.value));
      })
      .catch(() => {
        message.error('쿠폰 목록 로드 실패');
        setCoupons([]); setSelectedCoupons([]);
      });

    // 3) 이벤트 생성일 → 최소 날짜
    const ev = events.find(e => e._id === selectedEvent);
    if (ev?.createdAt) {
      const d0 = dayjs(ev.createdAt);
      setMinDate(d0);
      setRange([d0, dayjs()]);
    }
  }, [mallId, selectedEvent, events]);

  // ─── 날짜 배열 만들기 ────────────────────────────────────────
  const dates = useMemo(() => {
    const arr = [];
    let cur = range[0]?.startOf('day'), last = range[1]?.startOf('day');
    if (!cur || !last) return arr;
    while (cur.isSameOrBefore(last, 'day')) {
      arr.push(cur.format('YYYY-MM-DD'));
      cur = cur.add(1, 'day');
    }
    return arr;
  }, [range]);

  // ─── 통계 조회 함수 ─────────────────────────────────────────
  const fetchStats = async (type) => {
    if (!selectedEvent) {
      return message.warning('게시판(이벤트)을 선택해주세요.');
    }
    setLoading(true);

    try {
      // ─── (A) 쿠폰 다운로드/사용 통계
      if (type === 'stats') {
        const { data } = await api.get(
          `/api/${mallId}/analytics/${selectedEvent}/coupon-stats`
        );
        // data: [{ couponNo, issuedCount, usedCount }, …]
        setStats(data);
        return;
      }

      // ─── (B) URL 클릭 / 쿠폰 클릭 통계
      const [start, end] = range.map(d => d.format('YYYY-MM-DD'));
      const params = {
        start_date: `${start}T00:00:00+09:00`,
        end_date:   `${end  }T23:59:59.999+09:00`
      };
      if (type === 'url' && selectedUrls.length) {
        params.url = selectedUrls.join(',');
      }
      if (type === 'coupon' && selectedCoupons.length) {
        params.coupon_no = selectedCoupons.join(',');
      }
      const { data: raw } = await api.get(
        `/api/${mallId}/analytics/${selectedEvent}/clicks-by-date`,
        { params }
      );
      // raw: [{ date, '/path.html':count, … }, …]

      const items = type === 'url' ? selectedUrls : selectedCoupons;
      const filled = dates.map(date => {
        const rec = raw.find(r => r.date === date) || {};
        const row = { key: date, date };
        items.forEach(k => row[k] = rec[k] || 0);
        row.total = items.reduce((sum, k) => sum + row[k], 0);
        return row;
      });
      setStats(filled);

    } catch (err) {
      console.error(err);
      message.error('통계 조회 실패');
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  // 자동 조회 (URL 탭)
  useEffect(() => {
    fetchStats('url');
  }, [selectedEvent, selectedUrls, range]);

  // ─── URL·쿠폰 탭용 컬럼 생성 ─────────────────────────────────
  const makeColumns = (type) => {
    const items = type === 'url' ? urls : coupons.map(c=>c.value);
    return [
      { title: '날짜', dataIndex: 'date', key: 'date' },
      ...items.map(key => ({
        title: type === 'coupon'
          ? (coupons.find(c=>c.value===key)?.label || key)
          : key,
        dataIndex: key,
        key,
        align: 'right'
      })),
      {
        title: '합계',
        dataIndex: 'total',
        key: 'total',
        align: 'right',
        sorter: (a,b)=>a.total-b.total,
        defaultSortOrder: 'descend'
      }
    ];
  };

  return (
    <Card title="이벤트 참여 클릭 통계" bodyStyle={{ padding: isMobile ? 12 : 24 }}>
      {/* ─── 게시판(이벤트) 선택 */}
      <Space
        style={{ marginBottom: 16 }}
        direction={isMobile ? 'vertical' : 'horizontal'}
        wrap
      >
        <Select
          placeholder="게시판 선택"
          options={events.map(e=>({ label: e.title||'(제목없음)', value: e._id }))}
          value={selectedEvent}
          onChange={setSelectedEvent}
          style={{ width: isMobile ? '100%' : 200 }}
        />
      </Space>

      <Tabs defaultActiveKey="url" onChange={fetchStats}>
        {/* URL 클릭 탭 */}
        <TabPane tab="URL 클릭" key="url">
          <Space
            direction={isMobile ? 'vertical' : 'horizontal'}
            size="middle"
            style={{ marginBottom: 16 }}
          >
            <Select
              mode="multiple"
              placeholder="URL 선택"
              options={urls.map(u=>({ label: u, value: u }))}
              value={selectedUrls}
              onChange={setSelectedUrls}
              style={{ width: isMobile?'100%':240 }}
              allowClear
            />
            <RangePicker
              value={range}
              disabledDate={d=>minDate&&d.isBefore(minDate,'day')}
              format="YYYY-MM-DD"
              onChange={setRange}
              style={{ width: isMobile?'100%':280 }}
              allowClear={false}
            />
            <Button type="primary" loading={loading} onClick={()=>fetchStats('url')} block={isMobile}>
              조회
            </Button>
          </Space>
          {loading
            ? <Spin tip="로딩 중…" style={{ display:'block', marginTop:24 }} />
            : <Table
                columns={makeColumns('url')}
                dataSource={stats}
                pagination={false}
                bordered
                rowKey="key"
                scroll={{ x:'max-content' }}
              />
          }
        </TabPane>

        {/* 쿠폰 클릭 탭 */}
        <TabPane tab="쿠폰 클릭" key="coupon">
          <Space
            direction={isMobile ? 'vertical' : 'horizontal'}
            size="middle"
            style={{ marginBottom: 16 }}
          >
            <Select
              mode="multiple"
              placeholder="쿠폰 선택"
              options={coupons}
              value={selectedCoupons}
              onChange={setSelectedCoupons}
              style={{ width: isMobile?'100%':240 }}
              allowClear
            />
            <RangePicker
              value={range}
              disabledDate={d=>minDate&&d.isBefore(minDate,'day')}
              format="YYYY-MM-DD"
              onChange={setRange}
              style={{ width: isMobile?'100%':280 }}
              allowClear={false}
            />
            <Button type="primary" loading={loading} onClick={()=>fetchStats('coupon')} block={isMobile}>
              조회
            </Button>
          </Space>
          {loading
            ? <Spin tip="로딩 중…" style={{ display:'block', marginTop:24 }} />
            : <Table
                columns={makeColumns('coupon')}
                dataSource={stats}
                pagination={false}
                bordered
                rowKey="key"
                scroll={{ x:'max-content' }}
              />
          }
        </TabPane>

        {/* 쿠폰 다운로드/사용 탭 */}
        <TabPane tab="쿠폰 다운로드/사용" key="stats">
          <Button
            type="primary"
            loading={loading}
            onClick={()=>fetchStats('stats')}
            style={{ marginBottom:16 }}
          >
            조회
          </Button>
          {loading
            ? <Spin tip="로딩 중…" />
            : <Table
                rowKey="couponNo"
                dataSource={stats}
                pagination={false}
                columns={[
                  { title: '쿠폰번호',   dataIndex: 'couponNo',    key: 'couponNo' },
                  { title: '다운로드 수', dataIndex: 'issuedCount', key: 'issuedCount', align:'right' },
                  { title: '사용 수',     dataIndex: 'usedCount',   key: 'usedCount',   align:'right' }
                ]}
              />
          }
        </TabPane>
      </Tabs>
    </Card>
  );
}
