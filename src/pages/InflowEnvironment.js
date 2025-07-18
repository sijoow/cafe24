// src/pages/InflowEnvironment.jsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Grid,
} from 'antd';
import axios from '../axios';              // ← 커스텀 axios 인스턴스
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import './NormalSection.css';

dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function InflowEnvironment() {
  const screens = useBreakpoint();
  const isMobile = screens.sm === false;

  // 이벤트, URL, 날짜, 로딩 상태
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [urls, setUrls]                   = useState([]);
  const [selectedUrl, setSelectedUrl]     = useState(null);
  const [range, setRange]                 = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [minDate, setMinDate]             = useState(null);
  const [loading, setLoading]             = useState(false);

  // 차트용 데이터
  const [pieData, setPieData]             = useState([]);
  const [lineData, setLineData]           = useState({ dates: [], devices: [], series: [] });

  // 1) 마운트: 이벤트 목록 불러오기
  useEffect(() => {
    axios.get('/api/events')
      .then(res => {
        const opts = (res.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map(ev => ({
            label: ev.title || '(제목없음)',
            value: ev._id,
            createdAt: ev.createdAt,
          }));
        setEvents(opts);
        if (opts.length) {
          const first = opts[0];
          setSelectedEvent(first.value);
          const start = dayjs(first.createdAt);
          setMinDate(start);
          setRange([start, dayjs()]);
        }
      })
      .catch(() => message.error('이벤트 목록 로드 실패'));
  }, []);

  // 2) selectedEvent 변경 시 → URL 목록 + 날짜 초기화
  useEffect(() => {
    if (!selectedEvent) return;
    axios.get(`/api/analytics/${selectedEvent}/urls`)
      .then(res => {
        const list = res.data || [];
        setUrls(list);
        setSelectedUrl(list[0] || null);
      })
      .catch(() => message.error('URL 목록 로드 실패'));

    const ev = events.find(e => e.value === selectedEvent);
    if (ev?.createdAt) {
      const start = dayjs(ev.createdAt);
      setMinDate(start);
      setRange([start, dayjs()]);
    }
  }, [selectedEvent, events]);

  // 3) 데이터 조회 함수
  const fetchData = useCallback(async () => {
    if (!selectedEvent || !selectedUrl) return;
    setLoading(true);

    // 날짜 포맷팅
    const [s, e] = range.map(d => d.format('YYYY-MM-DD'));
    const params = {
      start_date: `${s}T00:00:00+09:00`,
      end_date:   `${e}T23:59:59.999+09:00`,
      url:        selectedUrl,
    };

    try {
      // ── Pie 데이터: 디바이스별 합계
      const devRes = await axios.get(
        `/api/analytics/${selectedEvent}/devices`,
        { params }
      );
      const rawPie = Array.isArray(devRes.data) ? devRes.data : [];
      const allDevices = ['PC', 'Android', 'iOS'];
      setPieData(allDevices.map(dev => ({
        name:  dev,
        value: rawPie.find(r => r.device_type === dev)?.count || 0,
      })));

      // ── Line 데이터: 날짜별 디바이스별
      const lineRes = await axios.get(
        `/api/analytics/${selectedEvent}/devices-by-date`,
        { params }
      );
      const rawLine = Array.isArray(lineRes.data) ? lineRes.data : [];

      // 날짜 축 생성
      const dates = [];
      let cursor = range[0].startOf('day');
      const last   = range[1].startOf('day');
      while (cursor.isSameOrBefore(last, 'day')) {
        dates.push(cursor.format('YYYY-MM-DD'));
        cursor = cursor.add(1, 'day');
      }

      // 디바이스별 series 구성
      const series = allDevices.map(dev => ({
        name: dev,
        type: 'line',
        data: dates.map(d => {
          const rec = rawLine.find(r => r.date === d && r.device === dev);
          return rec ? rec.count : 0;
        }),
      }));

      setLineData({ dates, devices: allDevices, series });
    } catch (err) {
      console.error(err);
      message.error('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, selectedUrl, range]);

  // 4) 자동 조회 트리거
  useEffect(() => {
    if (selectedEvent && selectedUrl) {
      fetchData();
    }
  }, [selectedEvent, selectedUrl, range, fetchData]);

  // ─── ECharts 옵션 ─────────────────────────────────────────────
  const pieOption = {
    title: {
      text: '유입 환경 (디바이스)',
      left: 'center',
      top: 8,
      textStyle: { fontSize: isMobile ? 14 : 16 },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: isMobile ? 'horizontal' : 'vertical',
      bottom: isMobile ? 10 : 'center',
      left: isMobile ? 'center' : '75%',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { fontSize: isMobile ? 12 : 13 },
    },
    series: [{
      name: '건수',
      type: 'pie',
      radius: isMobile ? ['30%', '50%'] : ['40%', '60%'],
      center: isMobile ? ['50%', '45%'] : ['40%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: isMobile ? 12 : 14,
          fontWeight: 'bold',
        },
      },
      data: pieData,
    }],
  };

  const lineOption = {
    title: { text: '일자별 디바이스 유입', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: {
      data: lineData.devices,
      orient: isMobile ? 'horizontal' : 'vertical',
      bottom: isMobile ? 0 : 'auto',
      left: isMobile ? 'center' : 'right',
    },
    xAxis: { type: 'category', data: lineData.dates },
    yAxis: { type: 'value' },
    series: lineData.series,
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card size={isMobile ? 'small' : 'default'}>
        <Space
          wrap
          direction={isMobile ? 'vertical' : 'horizontal'}
          size="middle"
          style={{ width: '100%' }}
        >
          <Select
            placeholder="이벤트 선택"
            options={events}
            value={selectedEvent}
            onChange={setSelectedEvent}
            style={{ width: isMobile ? '100%' : 200 }}
            allowClear
          />
          <Select
            placeholder="페이지 선택"
            options={urls.map(u => ({ label: u, value: u }))}
            value={selectedUrl}
            onChange={setSelectedUrl}
            style={{ width: isMobile ? '100%' : 240 }}
            allowClear
          />

          {isMobile ? (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <DatePicker
                value={range[0]}
                onChange={d => setRange([d, range[1]])}
                disabledDate={d => minDate && d.isBefore(minDate, 'day')}
                style={{ width: '100%' }}
              />
              <DatePicker
                value={range[1]}
                onChange={d => setRange([range[0], d])}
                disabledDate={d => minDate && d.isBefore(minDate, 'day')}
                style={{ width: '100%' }}
              />
            </Space>
          ) : (
            <RangePicker
              value={range}
              onChange={setRange}
              disabledDate={d => minDate && d.isBefore(minDate, 'day')}
              style={{ width: 280 }}
            />
          )}

          <Button
            type="primary"
            loading={loading}
            onClick={fetchData}
            block={isMobile}
          >
            검색
          </Button>
        </Space>
      </Card>

      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 16,
          marginTop: 16,
        }}
      >
        <Card
          title="디바이스 분포"
          loading={loading}
          style={{ flex: 1 }}
          size={isMobile ? 'small' : 'default'}
        >
          <ReactECharts option={pieOption} style={{ height: isMobile ? 200 : 300 }} />
        </Card>

        <Card
          title="일자별 디바이스"
          loading={loading}
          style={{ flex: 2 }}
          size={isMobile ? 'small' : 'default'}
        >
          <ReactECharts option={lineOption} style={{ height: isMobile ? 200 : 300 }} />
        </Card>
      </div>
    </Space>
  );
}
