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

  // 0) mallId
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

  // 1) 이벤트(게시판) 목록
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const sorted = (res.data || []).sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setEvents(sorted);
        setSelectedEvent(sorted[0]?._id || null);
      })
      .catch(() => message.error('이벤트 목록 로드 실패'));
  }, [mallId]);

  // 2) URL / 쿠폰 목록
  const [urls, setUrls]                         = useState([]);
  const [selectedUrls, setSelectedUrls]         = useState([]);
  const [coupons, setCoupons]                   = useState([]);
  const [selectedCoupons, setSelectedCoupons]   = useState([]);

  // 3) 날짜 범위
  const [range, setRange]     = useState([dayjs().subtract(7,'day'), dayjs()]);
  const [minDate, setMinDate] = useState(null);

  // 4) 로딩 & 통계
  const [loading, setLoading] = useState(false);
  const [stats, setStats]     = useState([]);

  // 5) 이벤트 선택 시 URL / 쿠폰 불러오기
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setUrls([]); setSelectedUrls([]);
      setCoupons([]); setSelectedCoupons([]);
      setMinDate(null);
      return;
    }

    // 5-a) 이벤트 설정에서 URL 추출
    api.get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
      .then(res => {
        setUrls(res.data);
        setSelectedUrls(res.data); // 전체 선택
      })
      .catch(() => {
        message.error('URL 목록 로드 실패');
        setUrls([]); setSelectedUrls([]);
      });

    // 5-b) 해당 이벤트에서 클릭된 distinct 쿠폰번호 → 전체 쿠폰 API에서 이름 매칭
    api.get(`/api/${mallId}/analytics/${selectedEvent}/coupons-distinct`)
      .then(async res => {
        const nos = res.data; // [1001,1002,...]
        if (!nos.length) {
          setCoupons([]); setSelectedCoupons([]);
          return;
        }
        const { data: allCoupons } = await api.get(`/api/${mallId}/coupons`);
        const list = allCoupons
          .filter(c => nos.includes(c.coupon_no))
          .map(c => ({
            label: `${c.coupon_name} [${c.coupon_no}]`,
            value: c.coupon_no
          }));
        setCoupons(list);
        setSelectedCoupons(list.map(x=>x.value)); // 전체 선택
      })
      .catch(() => {
        message.error('쿠폰 목록 로드 실패');
        setCoupons([]); setSelectedCoupons([]);
      });

    // 5-c) 이벤트 생성일 → 최소 날짜
    const ev = events.find(e => e._id === selectedEvent);
    if (ev?.createdAt) {
      const d0 = dayjs(ev.createdAt);
      setMinDate(d0);
      setRange([d0, dayjs()]);
    }
  }, [mallId, selectedEvent, events]);

  // 6) 날짜 배열 만들기
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

// (7) 통계 조회 함수
const fetchStats = async (type) => {
  if (!selectedEvent) return message.warning('게시판(이벤트)을 선택해주세요.');
  setLoading(true);

  const [start, end] = range.map(d => d.format('YYYY-MM-DD'));
  try {
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
    // raw: [{ date, data:{ key1:count1, key2:count2, … } }, …]

    // 8) 날짜 × 항목별로 채우기 + 합계 계산
    const items = type === 'url' ? selectedUrls : selectedCoupons;
    const filled = dates.map(date => {
      // 같은 date의 레코드 찾기
      const rec = raw.find(r => r.date === date)?.data || {};
      const row = { key: date, date };
      // 각 컬럼별 값을 rec[key] 에서 가져오고, 없으면 0
      items.forEach(k => {
        row[k] = rec[k] || 0;
      });
      // 마지막에 합계 컬럼 추가
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

  // 8) 초기·자동 호출: 이벤트, URL/쿠폰, 날짜 바뀔 때마다 URL 탭 조회
  useEffect(() => {
    fetchStats('url');
  }, [selectedEvent, selectedUrls, range]);

  // 9) 컬럼 생성 (제목에 라벨 또는 URL 사용)
  const makeColumns = (type) => {
    const items = type === 'url' ? urls : coupons.map(c=>c.value);
    return [
      { title: '날짜', dataIndex: 'date', key: 'date' },
      ...items.map(key => {
        // 쿠폰이면 label, URL이면 그냥 문자열
        const title = type === 'coupon'
          ? (coupons.find(c=>c.value===key)?.label || key)
          : key;
        return {
          title,
          dataIndex: key,
          key,
          align: 'right'
        };
      }),
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
      <Space style={{ marginBottom: 16 }} direction={isMobile?'vertical':'horizontal'} wrap>
        <Select
          placeholder="게시판 선택"
          options={events.map(e=>({ label: e.title||'(제목없음)', value: e._id }))}
          value={selectedEvent}
          onChange={setSelectedEvent}
          style={{ width: isMobile?'100%':200 }}
        />
      </Space>

      <Tabs defaultActiveKey="url" onChange={fetchStats}>
        {/* URL 클릭 탭 */}
        <TabPane tab="URL 클릭" key="url">
          <Space direction={isMobile?'vertical':'horizontal'} size="middle" style={{ marginBottom:16 }}>
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
              disabledDate={d=>minDate && d.isBefore(minDate,'day')}
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
            ? <Spin tip="로딩 중..." style={{ display:'block', marginTop:24 }} />
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
          <Space direction={isMobile?'vertical':'horizontal'} size="middle" style={{ marginBottom:16 }}>
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
              disabledDate={d=>minDate && d.isBefore(minDate,'day')}
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
            ? <Spin tip="로딩 중..." style={{ display:'block', marginTop:24 }} />
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
      </Tabs>
    </Card>
  );
}
